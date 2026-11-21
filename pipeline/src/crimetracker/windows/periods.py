"""Rolling comparison window definitions."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date

import pandas as pd


@dataclass(frozen=True)
class ComparisonWindows:
    data_through: date
    current_start: date
    current_end: date
    prior_start: date
    prior_end: date
    latest_month: date
    previous_month: date


def month_end(d: date) -> date:
    return (d.replace(day=28) + pd.offsets.MonthEnd(0)).date()


def from_data_through(data_through: date) -> ComparisonWindows:
    """Build rolling 12m vs prior 12m and latest vs previous month."""
    current_end = month_end(data_through)
    current_start = (current_end.replace(day=1) - pd.DateOffset(months=11)).date()
    prior_end = (current_start.replace(day=1) - pd.DateOffset(days=1)).date()
    prior_start = (prior_end.replace(day=1) - pd.DateOffset(months=11)).date()
    latest = month_end(data_through)
    previous = (latest.replace(day=1) - pd.DateOffset(months=1)).date()
    previous = month_end(previous)

    return ComparisonWindows(
        data_through=data_through,
        current_start=current_start,
        current_end=current_end,
        prior_start=prior_start,
        prior_end=prior_end,
        latest_month=latest,
        previous_month=previous,
    )


def period_label(start: date, end: date) -> str:
    return f"{start.strftime('%b %Y')} – {end.strftime('%b %Y')}"
