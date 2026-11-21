"""Export split JSON for the Next.js web app."""

from __future__ import annotations

import json
from datetime import date, datetime, timezone
from pathlib import Path

from crimetracker.config import load_config, resolve_path
from crimetracker.export.area_boundaries import export_area_boundaries
from crimetracker.export.meshblock_boundaries import export_meshblock_boundaries
from crimetracker.export.meshblock_lookup import export_meshblock_lookup


def _write_json(path: Path, data: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")


def _strip_internal(brief: dict) -> dict:
    return {k: v for k, v in brief.items() if not k.startswith("_")}


def export_split(
    areas_index: list[dict],
    briefs: list[dict],
    meta_extra: dict,
    national: dict,
    geography: dict | None = None,
) -> Path:
    config = load_config()
    out_dir = resolve_path(config["export"]["web_data_dir"])
    pop_cfg = config["population"]

    meta = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "pipeline_version": config["export"]["pipeline_version"],
        "population_source": pop_cfg["source_label"],
        "population_caveat": pop_cfg["caveat"],
        **meta_extra["meta"],
    }

    _write_json(out_dir / "meta.json", meta)
    _write_json(out_dir / "areas.json", areas_index)
    _write_json(out_dir / "national.json", national)
    if geography is not None:
        _write_json(out_dir / "geography.json", geography)

    briefs_dir = out_dir / "briefs"
    if briefs_dir.exists():
        for old in briefs_dir.glob("*.json"):
            old.unlink()

    for brief in briefs:
        slug = brief["slug"]
        _write_json(briefs_dir / f"{slug}.json", _strip_internal(brief))

    _append_changelog(date.today(), meta["data_through"], len(briefs))
    try:
        export_meshblock_lookup(areas_index)
    except FileNotFoundError as exc:
        print(f"Skipping meshblock lookup export: {exc}")
    try:
        export_area_boundaries(areas_index)
    except Exception as exc:  # noqa: BLE001
        print(f"Skipping area boundary export: {exc}")
    try:
        export_meshblock_boundaries(areas_index)
    except Exception as exc:  # noqa: BLE001
        print(f"Skipping meshblock boundary export: {exc}")
    print(f"Exported {len(briefs)} briefs, {len(areas_index)} areas -> {out_dir}")
    return out_dir


def _append_changelog(today: date, data_through: str, brief_count: int) -> None:
    changelog = resolve_path("../../CHANGELOG.md")
    entry = (
        f"\n### {today.isoformat()} — Pipeline export (data through {data_through})\n\n"
        f"- Exported {brief_count} area briefs\n"
    )
    if changelog.exists():
        text = changelog.read_text(encoding="utf-8")
        if "## [Unreleased]" in text and entry.strip() not in text:
            text = text.replace("## [Unreleased]", f"## [Unreleased]{entry}")
            changelog.write_text(text, encoding="utf-8")
