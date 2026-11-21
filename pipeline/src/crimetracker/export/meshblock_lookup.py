"""Export meshblock → area slug lookup for address geocoding."""

from __future__ import annotations

import json
from pathlib import Path

import pandas as pd

from crimetracker.config import load_config, resolve_path
from crimetracker.population.rollup import POP_PATH, _load_geographic_areas


def build_meshblock_lookup(
    geo_path: Path,
    population_path: Path | None = None,
    brief_slugs: set[str] | None = None,
) -> dict[str, dict]:
    geo = _load_geographic_areas(geo_path)
    pop_path = population_path or POP_PATH
    if not pop_path.exists():
        raise FileNotFoundError(f"Population rollup missing: {pop_path}")

    pop = pd.read_parquet(pop_path)[
        ["area_unit", "territorial_authority", "slug", "display_name"]
    ].drop_duplicates()

    merged = geo.merge(pop, on=["area_unit", "territorial_authority"], how="inner")
    merged = merged.drop_duplicates(subset=["meshblock"], keep="first")

    lookup: dict[str, dict] = {}
    for _, row in merged.iterrows():
        slug = str(row["slug"])
        lookup[str(row["meshblock"])] = {
            "slug": slug,
            "display_name": str(row["display_name"]),
            "has_brief": brief_slugs is None or slug in brief_slugs,
        }
    return lookup


def export_meshblock_lookup(
    areas_index: list[dict],
    geo_path: Path | None = None,
    output_path: Path | None = None,
) -> Path:
    config = load_config()
    geo_path = geo_path or resolve_path(
        f"{config['stats_nz']['raw_dir']}/{config['stats_nz']['filenames']['geographic_areas']}"
    )
    out_dir = resolve_path(config["export"]["web_data_dir"])
    output_path = output_path or out_dir / "meshblock_to_area.json"

    brief_slugs = {a["slug"] for a in areas_index if a.get("has_brief")}
    lookup = build_meshblock_lookup(geo_path, brief_slugs=brief_slugs)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(lookup, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"Exported {len(lookup):,} meshblock mappings -> {output_path}")
    return output_path
