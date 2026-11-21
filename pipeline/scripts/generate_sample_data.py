"""Generate sample split JSON for web development."""

from __future__ import annotations

import _bootstrap  # noqa: F401

import json
from datetime import date, datetime, timezone
from pathlib import Path

from crimetracker.config import load_config, resolve_path
from crimetracker.narrative.tone import (
    national_comparison_message,
    pattern_message,
    rolling_year_narrative,
)

SAMPLE_SLUG = "otatara-invercargill"


def _write_json(path: Path, data: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")


def _sample_brief() -> dict:
    return {
        "slug": SAMPLE_SLUG,
        "display_name": "Otatara, Invercargill",
        "rolling_year": {
            "total": 142,
            "rate_per_1000": 28.4,
            "prior_total": 128,
            "prior_rate_per_1000": 25.6,
            "delta_pct": 10.9,
            "confidence": "medium",
            "by_crime_type": {
                "Theft": {"count": 94, "prior_count": 82, "rate_per_1000": 18.8, "delta_pct": 14.6},
                "Burglary": {"count": 31, "prior_count": 29, "rate_per_1000": 6.2, "delta_pct": 6.9},
                "Assault": {"count": 12, "prior_count": 14, "rate_per_1000": 2.4, "delta_pct": -14.3},
            },
        },
        "latest_month": {
            "total": 13,
            "rate_per_1000": 2.6,
            "prior_total": 11,
            "prior_rate_per_1000": 2.2,
            "delta_pct": 18.2,
            "confidence": "medium",
            "month": "2026-04",
            "previous_month": "2026-03",
        },
        "vs_national": {
            "total_ratio": 1.1,
            "by_crime_type": {
                "Theft": 1.25,
                "Burglary": 0.95,
                "Assault": 0.88,
            },
        },
        "patterns": {
            "by_crime_type": {
                "Theft": {
                    "peak_day": "Saturday",
                    "peak_hour_band": "10pm–2am",
                    "unknown_time_pct": 28.0,
                    "day_distribution": {"Mon": 10, "Tue": 12, "Wed": 11, "Thu": 13, "Fri": 14, "Sat": 22, "Sun": 12},
                    "hour_distribution": {"0-5": 8, "6-11": 18, "12-17": 32, "18-23": 36},
                },
                "Burglary": {
                    "peak_day": "Wednesday",
                    "peak_hour_band": "9am–3pm",
                    "unknown_time_pct": 45.0,
                    "day_distribution": {"Mon": 5, "Tue": 4, "Wed": 8, "Thu": 5, "Fri": 4, "Sat": 3, "Sun": 2},
                    "hour_distribution": {"0-5": 2, "6-11": 12, "12-17": 14, "18-23": 3},
                },
            },
        },
        "safety_messages": [
            {
                "crime_type": "Theft",
                "message": pattern_message(
                    "Theft", "Otatara", "Saturday", "10pm–2am", "medium", 28.0
                ),
                "content_key": "theft/evening",
                "confidence": "medium",
            },
            {
                "crime_type": "Burglary",
                "message": pattern_message(
                    "Burglary", "Otatara", "Wednesday", "9am–3pm", "medium", 45.0
                ),
                "content_key": "burglary/general",
                "confidence": "medium",
            },
        ],
        "comparison_narrative": {
            "rolling_year": rolling_year_narrative(
                "Otatara", 10.9, 28.4, 25.6, "medium"
            ),
            "latest_month": "April 2026 saw a slight increase in reported victimisations compared to March (13 vs 11).",
            "national": {
                "Theft": national_comparison_message("Theft", 1.25),
                "total": national_comparison_message("all crime", 1.1),
            },
        },
    }


def generate() -> Path:
    config = load_config()
    out_dir = resolve_path(config["export"]["web_data_dir"])
    pop = config["population"]

    meta = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "pipeline_version": config["export"]["pipeline_version"],
        "data_through": "2026-04",
        "current_period": {"start": "2025-05", "end": "2026-04"},
        "prior_period": {"start": "2024-05", "end": "2025-04"},
        "latest_month": "2026-04",
        "previous_month": "2026-03",
        "population_source": pop["source_label"],
        "population_caveat": pop["caveat"],
    }

    areas = [
        {
            "slug": SAMPLE_SLUG,
            "name": "Otatara",
            "display_name": "Otatara, Invercargill",
            "ta_slug": "invercargill-city",
            "ta_name": "Invercargill City",
            "region_slug": "southland",
            "region_name": "Southland",
            "population": 5000,
            "has_brief": True,
        },
        {
            "slug": "gladstone-invercargill",
            "name": "Gladstone",
            "display_name": "Gladstone, Invercargill",
            "ta_slug": "invercargill-city",
            "ta_name": "Invercargill City",
            "region_slug": "southland",
            "region_name": "Southland",
            "population": 4200,
            "has_brief": False,
        },
    ]

    national = {
        "rolling_year": {
            "total_rate_per_1000": 25.8,
            "by_crime_type": {
                "Theft": 15.0,
                "Burglary": 6.5,
                "Assault": 2.7,
                "Robbery": 0.4,
                "Sexual": 0.35,
                "Harm": 0.02,
            },
        },
    }

    _write_json(out_dir / "meta.json", meta)
    _write_json(out_dir / "areas.json", areas)
    _write_json(out_dir / "national.json", national)
    _write_json(out_dir / "briefs" / f"{SAMPLE_SLUG}.json", _sample_brief())

    _append_changelog(date.today())
    print(f"Sample data written to {out_dir}")
    return out_dir


def _append_changelog(today: date) -> None:
    changelog = resolve_path("../../CHANGELOG.md")
    entry = (
        f"\n### {today.isoformat()} — Sample data generated\n\n"
        "- Exported sample brief for Otatara, Invercargill\n"
    )
    if changelog.exists():
        text = changelog.read_text(encoding="utf-8")
        if "## [Unreleased]" in text:
            text = text.replace("## [Unreleased]", f"## [Unreleased]{entry}")
            changelog.write_text(text, encoding="utf-8")


if __name__ == "__main__":
    generate()
