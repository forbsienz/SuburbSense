"""Export meshblock boundary GeoJSON per suburb (Area Unit)."""

from __future__ import annotations

import json
import os
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

import pandas as pd

from crimetracker.config import load_config, resolve_path
from crimetracker.population.rollup import POP_PATH, _load_geographic_areas

WFS_LAYER = "layer-92197"
BATCH_SIZE = 40
MAX_RETRIES = 4


def _meshblocks_per_slug(geo_path: Path, population_path: Path) -> dict[str, list[str]]:
    geo = _load_geographic_areas(geo_path)
    pop = pd.read_parquet(population_path)[
        ["area_unit", "territorial_authority", "slug"]
    ].drop_duplicates()
    merged = geo.merge(pop, on=["area_unit", "territorial_authority"], how="inner")
    merged = merged.drop_duplicates(subset=["meshblock"], keep="first")

    by_slug: dict[str, list[str]] = {}
    for _, row in merged.iterrows():
        slug = str(row["slug"])
        by_slug.setdefault(slug, []).append(str(row["meshblock"]))
    return by_slug


def _fetch_meshblock_batch(api_key: str, meshblock_ids: list[str]) -> list[dict]:
    if not meshblock_ids:
        return []
    quoted = ",".join(f"'{mid}'" for mid in meshblock_ids)
    cql = f"MB2018_V1_00 IN ({quoted})"
    params = urllib.parse.urlencode(
        {
            "service": "WFS",
            "version": "2.0.0",
            "request": "GetFeature",
            "typeNames": WFS_LAYER,
            "outputFormat": "application/json",
            "srsName": "EPSG:4326",
            "cql_filter": cql,
            "count": str(len(meshblock_ids)),
        }
    )
    url = f"https://datafinder.stats.govt.nz/services;key={api_key}/wfs?{params}"

    last_error: Exception | None = None
    for attempt in range(MAX_RETRIES):
        try:
            with urllib.request.urlopen(url, timeout=180) as res:
                payload = json.load(res)
            return payload.get("features", [])
        except (urllib.error.URLError, TimeoutError, OSError) as exc:
            last_error = exc
            wait = 2 ** attempt
            print(f"  WFS batch failed (attempt {attempt + 1}/{MAX_RETRIES}): {exc}; retrying in {wait}s")
            time.sleep(wait)

    raise RuntimeError(f"WFS batch failed after {MAX_RETRIES} attempts") from last_error


def export_meshblock_boundaries(
    areas_index: list[dict],
    geo_path: Path | None = None,
    population_path: Path | None = None,
    output_dir: Path | None = None,
) -> int:
    api_key = os.environ.get("DATAFINDER_API_KEY", "").strip()
    if not api_key:
        print("Skipping meshblock boundary export: DATAFINDER_API_KEY not set")
        return 0

    config = load_config()
    raw_dir = resolve_path(config["stats_nz"]["raw_dir"])
    geo_path = geo_path or raw_dir / config["stats_nz"]["filenames"]["geographic_areas"]
    pop_path = population_path or POP_PATH
    out_dir = output_dir or resolve_path(
        f"{config['export']['web_data_dir']}/meshblocks_by_suburb"
    )
    out_dir.mkdir(parents=True, exist_ok=True)

    by_slug = _meshblocks_per_slug(geo_path, pop_path)
    brief_slugs = {a["slug"] for a in areas_index if a.get("has_brief")}
    exported = 0
    skipped = 0

    for slug in sorted(brief_slugs):
        out_path = out_dir / f"{slug}.geojson"
        if out_path.exists():
            skipped += 1
            continue

        meshblock_ids = by_slug.get(slug, [])
        if not meshblock_ids:
            continue

        print(f"Exporting meshblocks for {slug} ({len(meshblock_ids)} blocks)...")
        features: list[dict] = []
        for i in range(0, len(meshblock_ids), BATCH_SIZE):
            batch = meshblock_ids[i : i + BATCH_SIZE]
            features.extend(_fetch_meshblock_batch(api_key, batch))
            time.sleep(0.15)

        if not features:
            print(f"  No features returned for {slug}, skipping.")
            continue

        collection = {"type": "FeatureCollection", "features": []}
        for feature in features:
            props = feature.get("properties") or {}
            mb = str(props.get("MB2018_V1_00", "")).zfill(7)
            feature["properties"] = {
                **props,
                "meshblock": mb,
                "slug": slug,
            }
            collection["features"].append(feature)

        out_path.write_text(json.dumps(collection, separators=(",", ":")) + "\n", encoding="utf-8")
        exported += 1

    print(
        f"Exported meshblock boundaries for {exported} suburbs "
        f"({skipped} already present) -> {out_dir}"
    )
    return exported
