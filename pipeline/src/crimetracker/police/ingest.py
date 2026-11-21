"""Police CSV loading and validation."""

from __future__ import annotations

from pathlib import Path

import pandas as pd

from crimetracker.config import load_config, resolve_path

# Logical field -> acceptable source column names (Tableau export variants)
COLUMN_ALIASES: dict[str, list[str]] = {
    "Year Month": ["Year Month", " Month Year", "Year Month (copy 2)"],
    "ANZSOC Division": ["ANZSOC Division"],
    "ANZSOC Subdivision": ["ANZSOC Subdivision"],
    "Area Unit": ["Area Unit"],
    "Territorial Authority": ["Territorial Authority"],
    "Day of Week": ["Day of Week", "Occurrence Day Of Week"],
    "Hour of Day": ["Hour of Day", "Occurrence Hour Of Day"],
    "Meshblock": ["Meshblock"],
    "Victimisations": ["Victimisations", "Number of Records"],
}

READ_ATTEMPTS = [
    {"encoding": "utf-8-sig", "sep": ","},
    {"encoding": "utf-16-le", "sep": "\t"},
    {"encoding": "utf-8", "sep": "\t"},
    {"encoding": "utf-8-sig", "sep": "\t"},
]


def normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Map variant column names to canonical names."""
    rename: dict[str, str] = {}
    for canonical, aliases in COLUMN_ALIASES.items():
        for alias in aliases:
            if alias in df.columns:
                rename[alias] = canonical
                break
    return df.rename(columns=rename)


def validate_columns(df: pd.DataFrame) -> None:
    required = ["Year Month", "ANZSOC Division", "Area Unit", "Territorial Authority"]
    missing = [c for c in required if c not in df.columns]
    if missing:
        raise ValueError(
            f"Police CSV missing columns: {missing}. "
            f"Found: {list(df.columns)[:15]}... "
            "Ensure you downloaded the location/time Victimisations report."
        )


def load_raw_csv(path: Path | None = None) -> pd.DataFrame:
    config = load_config()
    csv_path = path or resolve_path(config["police"]["raw_csv"])
    if not csv_path.exists():
        raise FileNotFoundError(
            f"Police CSV not found at {csv_path}. See README for download steps."
        )

    errors: list[str] = []
    for attempt in READ_ATTEMPTS:
        try:
            df = pd.read_csv(csv_path, low_memory=False, **attempt)
            df = normalize_columns(df)
            validate_columns(df)
            print(f"Loaded CSV with encoding={attempt['encoding']!r} sep={attempt['sep']!r}")
            return df
        except Exception as exc:
            errors.append(f"{attempt}: {exc}")

    raise ValueError(f"Could not parse Police CSV at {csv_path}. Tried:\n" + "\n".join(errors))
