"""Tests for geography comparison ratios."""

from crimetracker.aggregates.build import _vs_ratios


def test_vs_ratios_total():
    rolling = {
        "rate_per_1000": 146.5,
        "by_crime_type": {
            "Theft": {"rate_per_1000": 104.16},
            "Burglary": {"rate_per_1000": 30.81},
        },
    }
    baseline_rates = {"Theft": 40.42, "Burglary": 11.6}
    result = _vs_ratios(rolling, baseline_rates, 60.91)
    assert result["total_ratio"] == 2.41
    assert result["by_crime_type"]["Theft"] == 2.58


def test_vs_ratios_below_baseline():
    rolling = {"rate_per_1000": 7.58, "by_crime_type": {"Theft": {"rate_per_1000": 1.6}}}
    result = _vs_ratios(rolling, {"Theft": 40.42}, 60.91)
    assert result["total_ratio"] == 0.12
