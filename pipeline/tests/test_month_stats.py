from datetime import date

import pandas as pd

from crimetracker.aggregates.build import _filter_month, _month_stats


def test_filter_month_matches_first_of_month_timestamps():
    df = pd.DataFrame(
        {
            "month": pd.to_datetime(["2026-05-01", "2026-04-01", "2026-03-01"]),
            "crime_type": ["Theft", "Theft", "Theft"],
            "count": [3, 1, 2],
            "hour_unknown": [False, False, False],
            "day_of_week": ["Monday", "Tuesday", "Wednesday"],
            "hour": [10, 11, 12],
        }
    )
    may = _filter_month(df, date(2026, 5, 31))
    april = _filter_month(df, date(2026, 4, 30))

    assert may["count"].sum() == 3
    assert april["count"].sum() == 1


def test_month_stats_uses_calendar_month_not_end_date():
    df = pd.DataFrame(
        {
            "month": pd.to_datetime(["2026-05-01", "2026-04-01"]),
            "crime_type": ["Theft", "Burglary"],
            "count": [3, 1],
            "hour_unknown": [False, False],
            "day_of_week": ["Monday", "Tuesday"],
            "hour": [10, 11],
        }
    )
    conf = {
        "high": {"min_population": 1000, "min_count": 20},
        "medium": {"min_population": 500, "min_count": 10},
    }
    stats = _month_stats(df, date(2026, 5, 31), date(2026, 4, 30), 2505, conf)

    assert stats is not None
    assert stats["total"] == 3
    assert stats["prior_total"] == 1
    assert stats["month"] == "2026-05"
    assert stats["previous_month"] == "2026-04"
