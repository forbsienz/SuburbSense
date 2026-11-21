"""Download Stats NZ data and build population rollup."""

import _bootstrap  # noqa: F401

from pathlib import Path

from crimetracker.config import load_config, resolve_path
from crimetracker.geo.download import download_stats_nz
from crimetracker.population.rollup import build_population_by_area


def main() -> None:
    config = load_config()
    paths = download_stats_nz()
    raw_dir = resolve_path(config["stats_nz"]["raw_dir"])
    filenames = config["stats_nz"]["filenames"]

    geo_path = raw_dir / filenames["geographic_areas"]
    pop_path = paths.get("meshblock_population") or raw_dir / filenames["meshblock_population"]

    if not geo_path.exists():
        raise FileNotFoundError(
            f"Geographic areas CSV missing at {geo_path}.\n"
            "Download manually from:\n"
            f"  {config['stats_nz']['geographic_areas_table_url']}\n"
            "Or run: make fixtures  (for local dev sample data)"
        )

    pop_df = build_population_by_area(geo_path, pop_path)
    print(f"Population rollup: {len(pop_df):,} area units")


if __name__ == "__main__":
    main()
