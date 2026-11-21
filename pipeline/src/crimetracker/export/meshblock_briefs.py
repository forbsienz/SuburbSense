"""Export per-meshblock brief JSON for the web app."""

from __future__ import annotations

import json
from pathlib import Path

from crimetracker.aggregates.meshblock_briefs import build_all_meshblock_briefs
from crimetracker.config import load_config, resolve_path


def export_meshblock_briefs(
    victimisations,
    population,
    area_briefs: list[dict],
    geo_path: Path | None = None,
    pop_path: Path | None = None,
    output_dir: Path | None = None,
    min_count: int = 1,
) -> int:
    config = load_config()
    raw_dir = resolve_path(config["stats_nz"]["raw_dir"])
    filenames = config["stats_nz"]["filenames"]
    geo_path = geo_path or raw_dir / filenames["geographic_areas"]
    pop_path = pop_path or raw_dir / filenames["meshblock_population"]
    out_dir = output_dir or resolve_path(f"{config['export']['web_data_dir']}/meshblock_briefs")
    out_dir.mkdir(parents=True, exist_ok=True)

    briefs = build_all_meshblock_briefs(
        victimisations,
        population,
        area_briefs,
        geo_path,
        pop_path,
        min_count=min_count,
    )

    for brief in briefs:
        meshblock = brief["meshblock"]
        path = out_dir / f"{meshblock}.json"
        path.write_text(json.dumps(brief, separators=(",", ":")) + "\n", encoding="utf-8")

    print(f"Exported {len(briefs):,} meshblock briefs -> {out_dir}")
    return len(briefs)
