"""Confidence scoring for area-unit statistics."""

from __future__ import annotations

from typing import Literal

Confidence = Literal["high", "medium", "low"]


def score_confidence(
    population: int,
    count: int,
    *,
    high_pop: int = 1000,
    high_count: int = 20,
    medium_pop: int = 500,
    medium_count: int = 10,
) -> Confidence:
    if population >= high_pop and count >= high_count:
        return "high"
    if population >= medium_pop or count >= medium_count:
        return "medium"
    return "low"


def show_latest_month(confidence: Confidence) -> bool:
    return confidence != "low"
