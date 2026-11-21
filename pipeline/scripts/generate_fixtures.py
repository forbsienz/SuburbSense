"""Generate small fixture CSVs for local pipeline testing."""

from __future__ import annotations

import _bootstrap  # noqa: F401

import random
from pathlib import Path

import pandas as pd

from crimetracker.config import resolve_path
from crimetracker.police.crime_types import map_crime_type

random.seed(42)

AREAS = [
    ("Otatara.", "Invercargill City.", "Southland Region.", "0284305", 5000),
    ("Gladstone.", "Invercargill City.", "Southland Region.", "0284401", 4200),
    ("Woodlands.", "Invercargill City.", "Southland Region.", "0284502", 3800),
    ("Grasmere.", "Invercargill City.", "Southland Region.", "0284603", 3500),
]

SUBTYPE_BY_TYPE: dict[str, list[str]] = {
    "Theft": [
        "Theft from retail premises",
        "Other Theft",
        "Motor vehicle theft and related offences",
        "Theft from a person",
    ],
    "Burglary": [
        "Burglary of a dwelling",
        "Burglary of a non-residential building",
        "Other burglary offences",
    ],
    "Assault": [
        "Common Assault",
        "Serious assault",
        "Assault of a prescribed officer",
    ],
}

CRIMES = [
    "08 Theft and related offences",
    "07 Unlawful entry with intent/burglary, break and enter",
    "02 Assaults",
]

DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
MONTHS = pd.date_range("2024-05-01", "2026-04-01", freq="MS")


def _generate_victimisations() -> pd.DataFrame:
    rows = []
    for month in MONTHS:
        label = month.strftime("%B %Y")
        for area, ta, region, mb, _pop in AREAS:
            n = random.randint(8, 25)
            for _ in range(n):
                crime = random.choices(CRIMES, weights=[0.65, 0.25, 0.1])[0]
                crime_type = map_crime_type(crime)
                subtypes = SUBTYPE_BY_TYPE.get(crime_type, [crime_type])
                subtype = random.choice(subtypes)
                hour = random.choice([99, 99, 10, 14, 22, 23, 8, 15])
                day = random.choice(DAYS + ["UNKNOWN"])
                rows.append(
                    {
                        "Year Month": label,
                        "ANZSOC Division": crime,
                        "ANZSOC Subdivision": subtype,
                        "Area Unit": area,
                        "Territorial Authority": ta,
                        "Region": region,
                        "Day of Week": day,
                        "Hour of Day": hour,
                        "Meshblock": mb,
                    }
                )
    return pd.DataFrame(rows)


def _generate_geographic_areas() -> pd.DataFrame:
    rows = []
    for area, ta, region, mb, _pop in AREAS:
        rows.append(
            {
                "MB2018_code": mb,
                "AU2017_code": f"AU{mb[:4]}",
                "AU2017_name": area,
                "REGC2023_name_ascii": "Southland Region",
                "TA2023_name_ascii": "Invercargill City",
            }
        )
    return pd.DataFrame(rows)


def _generate_population() -> pd.DataFrame:
    rows = []
    for _area, _ta, _region, mb, pop in AREAS:
        rows.append({"MB2020_V2_00": mb, "General_Electoral_Population": pop})
    return pd.DataFrame(rows)


def generate() -> None:
    police_path = resolve_path("../../data/raw/police/victimisations.csv")
    geo_path = resolve_path("../../data/raw/stats_nz/geographic_areas_2024.csv")
    pop_path = resolve_path("../../data/raw/stats_nz/meshblock_population_2018.csv")

    police_path.parent.mkdir(parents=True, exist_ok=True)
    geo_path.parent.mkdir(parents=True, exist_ok=True)

    v = _generate_victimisations()
    v.to_csv(police_path, sep="\t", encoding="utf-16-le", index=False)
    _generate_geographic_areas().to_csv(geo_path, index=False)
    _generate_population().to_csv(pop_path, index=False)

    print(f"Fixture police CSV: {police_path} ({len(v)} rows)")
    print(f"Fixture geographic areas: {geo_path}")
    print(f"Fixture population: {pop_path}")
    print("\nRun: make pipeline")


if __name__ == "__main__":
    generate()
