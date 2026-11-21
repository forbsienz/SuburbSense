"""String helpers for slugs and normalization."""

from __future__ import annotations

import re
import unicodedata


def slugify(*parts: str) -> str:
    combined = "-".join(p.strip() for p in parts if p and p.strip())
    normalized = unicodedata.normalize("NFKD", combined)
    ascii_text = normalized.encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", ascii_text.lower()).strip("-")
    return re.sub(r"-+", "-", slug)


def strip_trailing_period(value: str) -> str:
    return value.rstrip(".").strip() if isinstance(value, str) else value


def normalize_meshblock(value: object) -> str | None:
    if value is None or (isinstance(value, float) and value != value):
        return None
    text = str(value).strip().replace(".0", "")
    if not text or text in {"999999", "-29"}:
        return None
    return text.zfill(7)
