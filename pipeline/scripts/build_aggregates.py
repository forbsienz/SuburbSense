"""Build aggregates and export web JSON."""

import _bootstrap  # noqa: F401

import pandas as pd

from crimetracker.aggregates.build import build_all
from crimetracker.config import resolve_path
from crimetracker.export.json_export import export_split
from crimetracker.export.meshblock_briefs import export_meshblock_briefs
from crimetracker.population.rollup import POP_PATH


def main() -> None:
    vic_path = resolve_path("../../data/processed/victimisations.parquet")
    if not vic_path.exists():
        raise FileNotFoundError(f"Run ingest first. Missing {vic_path}")

    if not POP_PATH.exists():
        raise FileNotFoundError(f"Run download_stats first. Missing {POP_PATH}")

    victimisations = pd.read_parquet(vic_path)
    population = pd.read_parquet(POP_PATH)

    areas_index, briefs, extra = build_all(victimisations, population)
    export_split(areas_index, briefs, extra, extra["national"], extra.get("geography"))
    export_meshblock_briefs(victimisations, population, briefs)


if __name__ == "__main__":
    main()
