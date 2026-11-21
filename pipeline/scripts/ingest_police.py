"""Ingest Police victimisation CSV."""

import _bootstrap  # noqa: F401

from crimetracker.police.pipeline import main

if __name__ == "__main__":
    main()
