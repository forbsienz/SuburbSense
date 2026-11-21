"""Download Stats NZ reference data."""

from __future__ import annotations

import urllib.request
from pathlib import Path

from crimetracker.config import load_config, resolve_path


def download_file(url: str, dest: Path) -> Path:
    dest.parent.mkdir(parents=True, exist_ok=True)
    print(f"Downloading {url} -> {dest}")
    req = urllib.request.Request(url, headers={"User-Agent": "CrimeTracker/0.1"})
    with urllib.request.urlopen(req, timeout=300) as response:
        dest.write_bytes(response.read())
    return dest


def download_stats_nz() -> dict[str, Path]:
    config = load_config()
    raw_dir = resolve_path(config["stats_nz"]["raw_dir"])
    urls = config["stats_nz"]["downloads"]
    paths: dict[str, Path] = {}

    for name, url in urls.items():
        filename = config["stats_nz"]["filenames"][name]
        dest = raw_dir / filename
        if dest.exists() and dest.stat().st_size > 0:
            print(f"Skipping {name} (already exists): {dest}")
        else:
            download_file(url, dest)
        paths[name] = dest

    geo_path = raw_dir / config["stats_nz"]["filenames"]["geographic_areas"]
    if not geo_path.exists():
        print(
            "\n*** ACTION REQUIRED ***\n"
            f"Download the Geographic Areas Table 2024 CSV manually:\n"
            f"  {config['stats_nz']['geographic_areas_table_url']}\n"
            f"Save as: {geo_path}\n"
            "(Use Export/Download on the DataFinder page — no direct API available.)\n"
        )

    return paths
