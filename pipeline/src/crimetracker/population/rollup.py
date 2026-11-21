"""Roll meshblock population up to Area Unit 2017."""

from __future__ import annotations

from pathlib import Path

import pandas as pd

from crimetracker.config import load_config, resolve_path
from crimetracker.util.text import slugify, strip_trailing_period

POP_PATH = resolve_path("../../data/processed/population_by_area.parquet")


def _load_geographic_areas(path: Path) -> pd.DataFrame:
    df = pd.read_csv(path, low_memory=False)
    cols = {
        "MB2018_code": "meshblock",
        "AU2017_code": "au_code",
        "AU2017_name": "area_unit",
        "REGC2023_name_ascii": "region",
        "TA2023_name_ascii": "territorial_authority",
    }
    # Fallback column names if ascii variants differ
    if "REGC2023_name_ascii" not in df.columns and "REGC2023_name" in df.columns:
        cols["REGC2023_name"] = "region"
    if "TA2023_name_ascii" not in df.columns and "TA2023_name" in df.columns:
        cols["TA2023_name"] = "territorial_authority"

    selected = {k: v for k, v in cols.items() if k in df.columns}
    geo = df[list(selected.keys())].rename(columns=selected)
    geo["meshblock"] = geo["meshblock"].astype(str).str.replace(".0", "", regex=False).str.zfill(7)
    geo["area_unit"] = geo["area_unit"].map(strip_trailing_period)
    geo["territorial_authority"] = geo["territorial_authority"].map(strip_trailing_period)
    geo["region"] = geo["region"].map(strip_trailing_period)
    geo = geo.dropna(subset=["area_unit", "au_code"])
    geo = geo.drop_duplicates(subset=["meshblock"], keep="first")
    return geo


def _load_meshblock_population(path: Path) -> pd.DataFrame:
    df = pd.read_csv(path, low_memory=False)
    mb_col = "MB2020_V2_00" if "MB2020_V2_00" in df.columns else df.columns[0]
    pop_col = "General_Electoral_Population"
    pop = df[[mb_col, pop_col]].copy()
    pop = pop.rename(columns={mb_col: "meshblock", pop_col: "population"})
    pop["meshblock"] = pop["meshblock"].astype(str).str.replace(".0", "", regex=False).str.zfill(7)
    pop["population"] = pd.to_numeric(pop["population"], errors="coerce")
    pop.loc[pop["population"] < 0, "population"] = 0
    pop = pop.dropna(subset=["population"])
    return pop


def build_population_by_area(
    geo_path: Path,
    pop_path: Path,
    output_path: Path | None = None,
) -> pd.DataFrame:
    geo = _load_geographic_areas(geo_path)
    pop = _load_meshblock_population(pop_path)

    merged = geo.merge(pop, on="meshblock", how="left")
    merged["population"] = merged["population"].fillna(0)

    grouped = (
        merged.groupby(
            ["au_code", "area_unit", "territorial_authority", "region"],
            as_index=False,
        )["population"]
        .sum()
        .astype({"population": int})
    )

    grouped["ta_slug"] = grouped["territorial_authority"].map(lambda x: slugify(x))
    grouped["region_slug"] = grouped["region"].map(lambda x: slugify(x))
    grouped["slug"] = grouped["area_unit"].map(lambda x: slugify(x)) + "-" + grouped["ta_slug"]
    grouped["display_name"] = grouped["area_unit"] + ", " + grouped["territorial_authority"]

    out = output_path or POP_PATH
    out.parent.mkdir(parents=True, exist_ok=True)
    grouped.to_parquet(out, index=False)
    return grouped
