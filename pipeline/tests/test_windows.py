from crimetracker.windows.periods import ComparisonWindows, from_data_through


def test_rolling_windows():
    windows = from_data_through(__import__("datetime").date(2026, 4, 1))
    assert windows.current_end.year == 2026
    assert windows.current_end.month == 4
    assert windows.prior_end < windows.current_start
