"""Police CSV ingest."""

from __future__ import annotations

from pathlib import Path

import pandas as pd

from crimetracker.config import load_config, resolve_path
from crimetracker.police.clean import clean_dataframe
from crimetracker.police.ingest import load_raw_csv, validate_columns

PROCESSED_PATH = resolve_path("../../data/processed/victimisations.parquet")


def ingest(raw_path: Path | None = None, output_path: Path | None = None) -> pd.DataFrame:
    raw = load_raw_csv(raw_path)
    validate_columns(raw)
    cleaned = clean_dataframe(raw)
    out = output_path or PROCESSED_PATH
    out.parent.mkdir(parents=True, exist_ok=True)
    cleaned.to_parquet(out, index=False)
    return cleaned


def main() -> None:
    df = ingest()
    total = int(df["count"].sum()) if "count" in df.columns else len(df)
    print(f"Ingested {total:,} victimisations ({len(df):,} rows) -> {PROCESSED_PATH}")
    print(f"Date range: {df['month'].min()} to {df['month'].max()}")
    print(f"Area units: {df['area_unit'].nunique():,}")
