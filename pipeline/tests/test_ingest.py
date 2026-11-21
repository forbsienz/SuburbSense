import pandas as pd
import pytest

from crimetracker.police.clean import clean_dataframe
from crimetracker.police.ingest import validate_columns


def test_clean_sample_columns():
    df = pd.DataFrame(
        {
            "Year Month": ["April 2026", "March 2026"],
            "ANZSOC Division": [
                "08 Theft and related offences",
                "02 Assaults",
            ],
            "ANZSOC Subdivision": [
                "Other Theft",
                "Common Assault",
            ],
            "Area Unit": ["Otatara.", "Otatara."],
            "Territorial Authority": ["Invercargill City.", "Invercargill City."],
            "Region": ["Southland Region.", "Southland Region."],
            "Day of Week": ["Saturday", "UNKNOWN"],
            "Hour of Day": [22, 99],
            "Meshblock": ["284305", "284305"],
        }
    )
    validate_columns(df)
    cleaned = clean_dataframe(df)
    assert cleaned.iloc[0]["area_unit"] == "Otatara"
    assert cleaned.iloc[0]["crime_type"] == "Theft"
    assert cleaned.iloc[0]["crime_subtype"] == "Other Theft"
    assert cleaned.iloc[1]["crime_subtype"] == "Common Assault"
    assert pd.isna(cleaned.iloc[1]["hour"])


def test_validate_columns_rejects_missing_area_unit():
    """Police Stations / demographics exports without Area Unit must fail closed."""
    df = pd.DataFrame(
        {
            "Year Month": ["April 2026"],
            "ANZSOC Division": ["08 Theft and related offences"],
            "Territorial Authority": ["Invercargill City"],
            "Victimisations": [3],
        }
    )
    with pytest.raises(ValueError, match="Area Unit"):
        validate_columns(df)


def test_ingest_fixture_if_present():
    from crimetracker.config import resolve_path

    path = resolve_path("../../data/raw/police/victimisations.csv")
    if not path.exists():
        pytest.skip("fixture CSV not generated")
    from crimetracker.police.pipeline import ingest

    df = ingest()
    assert len(df) > 100
    assert "month" in df.columns
