"""Clean and normalize Police victimisation records."""

from __future__ import annotations

import pandas as pd

from crimetracker.police.crime_types import map_crime_type
from crimetracker.util.text import normalize_meshblock, strip_trailing_period

UNKNOWN_HOUR = 99
DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
HOUR_BANDS = {
    "0-5": range(0, 6),
    "6-11": range(6, 12),
    "12-17": range(12, 18),
    "18-23": range(18, 24),
}


def _parse_month(series: pd.Series) -> pd.Series:
    """Parse Year Month values: 'Dec-23', 'December 2023', etc."""
    parsed = pd.to_datetime(series, format="%b-%y", errors="coerce")
    if parsed.notna().sum() == 0:
        parsed = pd.to_datetime(series, format="%B %Y", errors="coerce")
    if parsed.notna().sum() == 0:
        parsed = pd.to_datetime(series, errors="coerce")
    return parsed.dt.to_period("M").dt.to_timestamp()


def clean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    df["area_unit"] = df["Area Unit"].map(strip_trailing_period)
    df["territorial_authority"] = df["Territorial Authority"].map(strip_trailing_period)
    df["crime_type_raw"] = df["ANZSOC Division"]
    df["crime_type"] = df["crime_type_raw"].map(map_crime_type)
    if "ANZSOC Subdivision" in df.columns:
        df["crime_subtype"] = (
            df["ANZSOC Subdivision"].astype(str).map(strip_trailing_period).replace({"nan": pd.NA})
        )
    else:
        df["crime_subtype"] = pd.NA
    df.loc[df["crime_subtype"].isna(), "crime_subtype"] = df.loc[
        df["crime_subtype"].isna(), "crime_type"
    ]
    df["year_month"] = df["Year Month"].astype(str).str.strip()
    df["month"] = _parse_month(df["year_month"])

    if "Meshblock" in df.columns:
        df["meshblock"] = df["Meshblock"].map(normalize_meshblock)
    else:
        df["meshblock"] = None

    df["day_of_week"] = df["Day of Week"].replace({"UNKNOWN": pd.NA, ".": pd.NA, "": pd.NA})
    df["hour"] = pd.to_numeric(df["Hour of Day"], errors="coerce")
    df.loc[df["hour"] == UNKNOWN_HOUR, "hour"] = pd.NA
    df["hour_unknown"] = df["hour"].isna()
    df["day_unknown"] = df["day_of_week"].isna()

    if "Victimisations" in df.columns:
        df["count"] = pd.to_numeric(df["Victimisations"], errors="coerce").fillna(1).astype(int)
    else:
        df["count"] = 1

    df = df.dropna(subset=["month", "area_unit", "territorial_authority"])
    return df


def hour_band_label(hour: int) -> str:
    for label, hours in HOUR_BANDS.items():
        if hour in hours:
            return label
    return "unknown"


def peak_hour_band(hours: pd.Series, weights: pd.Series | None = None) -> str:
    if weights is None:
        weights = pd.Series(1, index=hours.index)
    known = hours.dropna().astype(int)
    if known.empty:
        return "unknown"
    band_counts = {label: 0 for label in HOUR_BANDS}
    for idx, h in known.items():
        band_counts[hour_band_label(h)] += int(weights.loc[idx])
    best = max(band_counts, key=band_counts.get)
    labels = {
        "0-5": "midnight–6am",
        "6-11": "6am–12pm",
        "12-17": "12pm–6pm",
        "18-23": "6pm–midnight",
    }
    return labels.get(best, best)
