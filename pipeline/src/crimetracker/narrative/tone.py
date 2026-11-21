"""Inform-don't-alarm rules for automated safety and comparison messaging."""

from __future__ import annotations

from crimetracker.aggregates.confidence import Confidence

# Guidelines (also documented in pipeline/docs/tone-rules.md):
# - Use "reported" / "tends to" — never "you are at risk"
# - State unknown time percentages when relevant
# - Omit peak-time claims when confidence is low or unknowns are high


def pattern_message(
    crime_type: str,
    area_name: str,
    peak_day: str,
    peak_hour_band: str,
    confidence: Confidence,
    unknown_time_pct: float,
    max_unknown_pct: float = 40.0,
) -> str | None:
    if confidence == "low":
        return None
    if unknown_time_pct > max_unknown_pct:
        return (
            f"Time of day is unknown for {unknown_time_pct:.0f}% of reported "
            f"{crime_type.lower()} in {area_name}. See general prevention tips."
        )
    return (
        f"Reported {crime_type.lower()} in {area_name} tends to occur on "
        f"{peak_day}s around {peak_hour_band}."
    )


def rolling_year_narrative(
    area_name: str,
    delta_pct: float,
    rate: float,
    prior_rate: float,
    confidence: Confidence,
) -> str:
    direction = "flat"
    if delta_pct > 5:
        direction = "up"
    elif delta_pct < -5:
        direction = "down"

    base = (
        f"Total reported victimisations in {area_name} are {direction} "
        f"({abs(delta_pct):.0f}%) compared to the previous 12 months "
        f"({rate:.1f} per 1,000 residents vs {prior_rate:.1f} previously)."
    )
    if confidence == "low":
        return base + " Note: small numbers — treat this as indicative only."
    return base


def national_comparison_message(crime_type: str, ratio: float) -> str:
    label = crime_type.lower()
    pct_of = round(ratio * 100)
    if pct_of > 105:
        return (
            f"Reported {label} here is {pct_of}% of the national average — "
            "above average over the last 12 months."
        )
    if pct_of < 95:
        return (
            f"Reported {label} here is {pct_of}% of the national average — "
            "below average over the last 12 months."
        )
    return (
        f"Reported {label} here is {pct_of}% of the national average — "
        "close to average over the last 12 months."
    )
