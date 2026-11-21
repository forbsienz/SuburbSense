"""Export Stats NZ Area Unit boundaries for the web map."""

from __future__ import annotations

import json
import os
import urllib.parse
import urllib.request
from pathlib import Path

from crimetracker.config import load_config, resolve_path

WFS_LAYER = "layer-27771"


def _fetch_all_area_units(api_key: str) -> list[dict]:
    params = urllib.parse.urlencode(
        {
            "service": "WFS",
            "version": "2.0.0",
            "request": "GetFeature",
            "typeNames": WFS_LAYER,
            "outputFormat": "application/json",
            "srsName": "EPSG:4326",
            "count": "2500",
        }
    )
    url = f"https://datafinder.stats.govt.nz/services;key={api_key}/wfs?{params}"
    with urllib.request.urlopen(url, timeout=120) as res:
        payload = json.load(res)
    return payload.get("features", [])


def export_area_boundaries(areas_index: list[dict], output_dir: Path | None = None) -> int:
    api_key = os.environ.get("DATAFINDER_API_KEY", "").strip()
    if not api_key:
        print("Skipping area boundary export: DATAFINDER_API_KEY not set")
        return 0

    config = load_config()
    out_dir = output_dir or resolve_path(f"{config['export']['web_data_dir']}/boundaries")
    out_dir.mkdir(parents=True, exist_ok=True)

    features = _fetch_all_area_units(api_key)
    by_name: dict[str, dict] = {}
    for feature in features:
        props = feature.get("properties") or {}
        name = props.get("AU2017_NAME") or props.get("au2017_name")
        if name:
            by_name[str(name)] = feature

    area_by_slug = {a["slug"]: a for a in areas_index}
    all_features: list[dict] = []
    exported = 0

    for area in areas_index:
        feature = by_name.get(area["name"])
        if not feature:
            continue

        enriched = {
            **feature,
            "properties": {
                **(feature.get("properties") or {}),
                "slug": area["slug"],
                "name": area["name"],
                "display_name": area["display_name"],
                "has_brief": area.get("has_brief", False),
            },
        }

        if area.get("has_brief"):
            slug = area["slug"]
            out_path = out_dir / f"{slug}.json"
            out_path.write_text(json.dumps(enriched, separators=(",", ":")) + "\n", encoding="utf-8")
            exported += 1

        all_features.append(enriched)

    server_dir = resolve_path(f"{config['export']['server_data_dir']}/boundaries")
    server_dir.mkdir(parents=True, exist_ok=True)
    all_path = server_dir / "all_suburbs.geojson"
    all_path.write_text(
        json.dumps({"type": "FeatureCollection", "features": all_features}, separators=(",", ":"))
        + "\n",
        encoding="utf-8",
    )

    # Remove legacy public copy if present (must not be web-accessible).
    legacy_public = out_dir / "all_suburbs.geojson"
    if legacy_public.exists():
        legacy_public.unlink()

    print(
        f"Exported {exported} public area boundaries + "
        f"server-only all_suburbs.geojson ({len(all_features)} features)"
    )
    return exported
