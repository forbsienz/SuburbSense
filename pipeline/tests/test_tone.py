"""Tests for narrative tone helpers."""

from crimetracker.narrative.tone import national_comparison_message


def test_national_comparison_above_average():
    msg = national_comparison_message("Theft", 1.25)
    assert "125% of the national average — above average" in msg


def test_national_comparison_below_average():
    msg = national_comparison_message("Theft", 0.6)
    assert "60% of the national average — below average" in msg


def test_national_comparison_close_to_average():
    msg = national_comparison_message("Theft", 1.02)
    assert "102% of the national average — close to average" in msg
