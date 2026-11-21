"""Build area-unit aggregates, patterns, and narratives."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date

import pandas as pd

from crimetracker.aggregates.confidence import score_confidence, show_latest_month
from crimetracker.config import load_config
from crimetracker.narrative.tone import (
    national_comparison_message,
    pattern_message,
    rolling_year_narrative,
)
from crimetracker.police.clean import DAY_ORDER, DAY_SHORT, peak_hour_band
from crimetracker.police.crime_types import MAIN_CRIME_TYPES
from crimetracker.util.text import slugify
from crimetracker.windows.periods import ComparisonWindows, from_data_through


@dataclass
class BuildContext:
    windows: ComparisonWindows
    population: pd.DataFrame
    config: dict
    national_population: int


def _data_through(victimisations: pd.DataFrame) -> date:
    latest = victimisations["month"].max()
    return latest.date()


def _filter_period(df: pd.DataFrame, start: date, end: date) -> pd.DataFrame:
    start_ts = pd.Timestamp(start)
    end_ts = pd.Timestamp(end)
    return df[(df["month"] >= start_ts) & (df["month"] <= end_ts)]


def _filter_month(df: pd.DataFrame, month: date) -> pd.DataFrame:
    """Filter rows for a calendar month (crime data uses 1st-of-month timestamps)."""
    period = pd.Period(month, freq="M")
    return df[df["month"].dt.to_period("M") == period]


def _rate(count: int, population: int) -> float:
    if population <= 0:
        return 0.0
    return round(count / population * 1000, 2)


def _delta_pct(current: int, prior: int) -> float:
    if prior == 0:
        return 100.0 if current > 0 else 0.0
    return round((current - prior) / prior * 100, 1)


def _count(df: pd.DataFrame) -> int:
    if df.empty:
        return 0
    if "count" in df.columns:
        return int(df["count"].sum())
    return len(df)


def _main_types_only(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        return df
    return df[df["crime_type"].isin(MAIN_CRIME_TYPES)]


def _subtype_stats(
    current_df: pd.DataFrame,
    prior_df: pd.DataFrame,
    crime_type: str,
) -> dict:
    if "crime_subtype" not in current_df.columns:
        return {}
    result: dict = {}
    cur = current_df[current_df["crime_type"] == crime_type]
    pri = prior_df[prior_df["crime_type"] == crime_type]
    subtypes = set(cur["crime_subtype"].dropna().unique()) | set(
        pri["crime_subtype"].dropna().unique()
    )
    for subtype in sorted(subtypes):
        c = _count(cur[cur["crime_subtype"] == subtype])
        p = _count(pri[pri["crime_subtype"] == subtype])
        if c == 0 and p == 0:
            continue
        result[str(subtype)] = {"count": c, "prior_count": p}
    return result


def _period_stats(
    current_df: pd.DataFrame,
    prior_df: pd.DataFrame,
    population: int,
    conf_thresholds: dict,
) -> dict:
    total = _count(current_df)
    prior_total = _count(prior_df)
    confidence = score_confidence(
        population,
        total,
        high_pop=conf_thresholds["high"]["min_population"],
        high_count=conf_thresholds["high"]["min_count"],
        medium_pop=conf_thresholds["medium"]["min_population"],
        medium_count=conf_thresholds["medium"]["min_count"],
    )
    rate = _rate(total, population)
    prior_rate = _rate(prior_total, population)

    by_type: dict = {}
    all_types = set(current_df["crime_type"].unique()) | set(prior_df["crime_type"].unique())
    for crime_type in all_types:
        if crime_type not in MAIN_CRIME_TYPES:
            continue
        c = _count(current_df[current_df["crime_type"] == crime_type])
        p = _count(prior_df[prior_df["crime_type"] == crime_type])
        if c == 0 and p == 0:
            continue
        entry: dict = {
            "count": c,
            "prior_count": p,
            "rate_per_1000": _rate(c, population),
            "delta_pct": _delta_pct(c, p),
        }
        subtypes = _subtype_stats(current_df, prior_df, crime_type)
        if subtypes:
            entry["by_subtype"] = subtypes
        by_type[crime_type] = entry

    return {
        "total": total,
        "rate_per_1000": rate,
        "prior_total": prior_total,
        "prior_rate_per_1000": prior_rate,
        "delta_pct": _delta_pct(total, prior_total),
        "confidence": confidence,
        "by_crime_type": by_type,
    }


def _trend_series(
    area_df: pd.DataFrame,
    population: int,
    data_through: date | None = None,
) -> dict | None:
    """Rolling 12-month rates per 1,000 for all main types + each type over time."""
    if area_df.empty or population <= 0:
        return None

    main = _main_types_only(area_df)
    if main.empty:
        return None

    # Monthly counts: index = month start, columns = crime_type
    monthly = (
        main.groupby([main["month"].dt.to_period("M"), "crime_type"])["count"]
        .sum()
        .unstack(fill_value=0)
        if "count" in main.columns
        else main.groupby([main["month"].dt.to_period("M"), "crime_type"])
        .size()
        .unstack(fill_value=0)
    )
    # Ensure all main type columns exist
    for crime_type in MAIN_CRIME_TYPES:
        if crime_type not in monthly.columns:
            monthly[crime_type] = 0
    monthly = monthly[MAIN_CRIME_TYPES].sort_index()

    if len(monthly) < 12:
        return None

    # Continuous months from first observation through national data_through
    end = pd.Period(data_through, freq="M") if data_through else monthly.index.max()
    if end < monthly.index.max():
        end = monthly.index.max()
    full_index = pd.period_range(monthly.index.min(), end, freq="M")
    monthly = monthly.reindex(full_index, fill_value=0)
    monthly["all"] = monthly[MAIN_CRIME_TYPES].sum(axis=1)

    # Types that ever appear in this suburb (omit unused from points)
    active_types = [t for t in MAIN_CRIME_TYPES if int(monthly[t].sum()) > 0]

    points: list[dict] = []
    # First rolling endpoint needs 12 months of history → index 11 onward
    for i in range(11, len(monthly)):
        window = monthly.iloc[i - 11 : i + 1]
        period = monthly.index[i]
        point: dict = {"month": period.strftime("%Y-%m"), "all": _rate(int(window["all"].sum()), population)}
        for crime_type in active_types:
            point[crime_type] = _rate(int(window[crime_type].sum()), population)
        points.append(point)

    if not points:
        return None

    return {"metric": "rolling_12m_rate_per_1000", "points": points}


def _month_stats(
    victimisations: pd.DataFrame,
    latest: date,
    previous: date,
    population: int,
    conf_thresholds: dict,
) -> dict | None:
    latest_df = _filter_month(victimisations, latest)
    prev_df = _filter_month(victimisations, previous)
    stats = _period_stats(latest_df, prev_df, population, conf_thresholds)
    stats["month"] = pd.Period(latest, freq="M").strftime("%Y-%m")
    stats["previous_month"] = pd.Period(previous, freq="M").strftime("%Y-%m")
    if not show_latest_month(stats["confidence"]):
        return None
    return stats


def _pattern_block(subset: pd.DataFrame) -> dict | None:
    if subset.empty:
        return None
    total_w = int(subset["count"].sum())
    if total_w == 0:
        return None
    unknown_time_pct = round(
        subset.loc[subset["hour_unknown"], "count"].sum() / total_w * 100, 1
    )

    day_dist = {}
    for day, short in zip(DAY_ORDER, DAY_SHORT):
        day_dist[short] = int(subset.loc[subset["day_of_week"] == day, "count"].sum())

    hour_dist = {"0-5": 0, "6-11": 0, "12-17": 0, "18-23": 0}
    for _, row in subset.dropna(subset=["hour"]).iterrows():
        h = int(row["hour"])
        w = int(row["count"])
        if 0 <= h <= 5:
            hour_dist["0-5"] += w
        elif h <= 11:
            hour_dist["6-11"] += w
        elif h <= 17:
            hour_dist["12-17"] += w
        else:
            hour_dist["18-23"] += w

    peak_day = "Unknown"
    if day_dist:
        best_short = max(day_dist, key=day_dist.get)
        peak_day = DAY_ORDER[DAY_SHORT.index(best_short)]

    weights = subset["count"]
    return {
        "peak_day": peak_day,
        "peak_hour_band": peak_hour_band(subset["hour"], weights),
        "unknown_time_pct": unknown_time_pct,
        "day_distribution": day_dist,
        "hour_distribution": hour_dist,
    }


def _patterns(current_df: pd.DataFrame, crime_types: list[str]) -> dict:
    result = {}
    for crime_type in crime_types:
        block = _pattern_block(current_df[current_df["crime_type"] == crime_type])
        if block:
            result[crime_type] = block
    return result


def _patterns_by_subtype(current_df: pd.DataFrame, crime_type: str) -> dict:
    if "crime_subtype" not in current_df.columns:
        return {}
    result = {}
    subset = current_df[current_df["crime_type"] == crime_type]
    if subset.empty:
        return result
    for subtype in subset.groupby("crime_subtype")["count"].sum().sort_values(ascending=False).index:
        block = _pattern_block(subset[subset["crime_subtype"] == subtype])
        if block:
            result[str(subtype)] = block
    return result


def _all_subtype_patterns(current_df: pd.DataFrame) -> dict:
    return {
        crime_type: _patterns_by_subtype(current_df, crime_type)
        for crime_type in MAIN_CRIME_TYPES
    }


def _safety_messages(
    area_name: str,
    patterns: dict,
    rolling_confidence: str,
    max_unknown: float,
) -> list[dict]:
    messages = []
    for crime_type, p in patterns.items():
        conf = rolling_confidence if rolling_confidence != "low" else "low"
        msg = pattern_message(
            crime_type,
            area_name,
            p["peak_day"],
            p["peak_hour_band"],
            conf,  # type: ignore[arg-type]
            p["unknown_time_pct"],
            max_unknown_pct=max_unknown,
        )
        key = f"{crime_type.lower()}/general"
        if p["peak_hour_band"] in ("6pm–midnight", "6pm-midnight"):
            key = f"{crime_type.lower()}/evening"
        messages.append(
            {
                "crime_type": crime_type,
                "message": msg,
                "content_key": key,
                "confidence": conf,
            }
        )
    return messages


def _latest_month_narrative(latest: dict | None, area_name: str) -> str | None:
    if not latest:
        return None
    month = latest.get("month", "")
    return (
        f"{month} saw {latest['total']} reported victimisations in {area_name} "
        f"compared to {latest['prior_total']} the month before."
    )


def _vs_ratios(
    rolling: dict,
    baseline_rates: dict[str, float],
    baseline_total_rate: float,
) -> dict:
    area_rate = rolling["rate_per_1000"]
    total_ratio = round(area_rate / baseline_total_rate, 2) if baseline_total_rate > 0 else 0.0
    by_type: dict[str, float] = {}
    for crime_type, stats in rolling["by_crime_type"].items():
        base = baseline_rates.get(crime_type, 0)
        by_type[crime_type] = (
            round(stats["rate_per_1000"] / base, 2) if base > 0 else 0.0
        )
    return {"total_ratio": total_ratio, "by_crime_type": by_type}


def build_national_baseline(
    victimisations: pd.DataFrame,
    ctx: BuildContext,
) -> dict:
    current = _main_types_only(
        _filter_period(victimisations, ctx.windows.current_start, ctx.windows.current_end)
    )
    total_rate = _rate(_count(current), ctx.national_population)
    by_type = {}
    for crime_type in MAIN_CRIME_TYPES:
        group = current[current["crime_type"] == crime_type]
        if group.empty:
            continue
        by_type[crime_type] = _rate(_count(group), ctx.national_population)
    return {"rolling_year": {"total_rate_per_1000": total_rate, "by_crime_type": by_type}}


def build_geography_baselines(
    victimisations: pd.DataFrame,
    population: pd.DataFrame,
    ctx: BuildContext,
) -> dict:
    pop = population.copy()
    v = victimisations.copy()
    v["ta_slug"] = v["territorial_authority"].map(lambda x: slugify(x))
    v["slug"] = v["area_unit"].map(lambda x: slugify(x)) + "-" + v["ta_slug"]

    geo = pop[["slug", "ta_slug", "region_slug"]].drop_duplicates("slug")
    v = v.drop(columns=["ta_slug", "region_slug"], errors="ignore")
    v = v.merge(geo, on="slug", how="left")

    current = _main_types_only(
        _filter_period(v, ctx.windows.current_start, ctx.windows.current_end)
    )

    ta_pop = pop.groupby("ta_slug").agg(
        population=("population", "sum"),
        name=("territorial_authority", "first"),
        region_slug=("region_slug", "first"),
    )
    region_pop = pop.groupby("region_slug").agg(
        population=("population", "sum"),
        name=("region", "first"),
    )

    def _baseline_for(group_col: str, pop_df: pd.DataFrame) -> dict:
        result: dict = {}
        for key, group in current.groupby(group_col):
            if pd.isna(key) or key not in pop_df.index:
                continue
            pop_row = pop_df.loc[key]
            pop_n = int(pop_row["population"])
            total_rate = _rate(_count(group), pop_n)
            by_type = {
                crime_type: _rate(_count(g), pop_n)
                for crime_type, g in group.groupby("crime_type")
                if crime_type in MAIN_CRIME_TYPES
            }
            entry: dict = {
                "slug": str(key),
                "name": pop_row["name"],
                "rolling_year": {
                    "total_rate_per_1000": total_rate,
                    "by_crime_type": by_type,
                },
            }
            if group_col == "ta_slug":
                entry["region_slug"] = pop_row["region_slug"]
            result[str(key)] = entry
        return result

    return {
        "territorial_authorities": _baseline_for("ta_slug", ta_pop),
        "regions": _baseline_for("region_slug", region_pop),
    }


def build_area_brief(
    area_df: pd.DataFrame,
    pop_row: pd.Series,
    ctx: BuildContext,
    national_rates: dict[str, float],
    national_total_rate: float,
    ta_rates: dict[str, float],
    ta_total_rate: float,
    region_rates: dict[str, float],
    region_total_rate: float,
) -> dict | None:
    conf_cfg = ctx.config["confidence"]
    max_unknown = ctx.config["narrative"]["max_unknown_time_pct"]
    population = int(pop_row["population"])
    area_name = pop_row["area_unit"]
    display_name = pop_row["display_name"]
    slug = pop_row["slug"]

    current = _main_types_only(
        _filter_period(area_df, ctx.windows.current_start, ctx.windows.current_end)
    )
    prior = _main_types_only(
        _filter_period(area_df, ctx.windows.prior_start, ctx.windows.prior_end)
    )

    if _count(current) == 0 and _count(prior) == 0:
        return None

    rolling = _period_stats(current, prior, population, conf_cfg)
    latest = _month_stats(
        area_df,
        ctx.windows.latest_month,
        ctx.windows.previous_month,
        population,
        conf_cfg,
    )
    trend = _trend_series(area_df, population, ctx.windows.data_through)

    pattern_types = [
        crime_type
        for crime_type in MAIN_CRIME_TYPES
        if crime_type in rolling.get("by_crime_type", {})
    ]
    patterns = _patterns(current, pattern_types)
    subtype_patterns = _all_subtype_patterns(current)

    vs_national = _vs_ratios(rolling, national_rates, national_total_rate)
    vs_ta = _vs_ratios(rolling, ta_rates, ta_total_rate)
    vs_region = _vs_ratios(rolling, region_rates, region_total_rate)

    national_narratives = {
        "total": national_comparison_message("all crime", vs_national["total_ratio"])
    }
    for crime_type, ratio in vs_national["by_crime_type"].items():
        national_narratives[crime_type] = national_comparison_message(crime_type, ratio)

    min_pop = ctx.config.get("comparison", {}).get("min_population_for_rate_display", 1000)
    rate_comparison_reliable = population >= min_pop

    safety = _safety_messages(area_name, patterns, rolling["confidence"], max_unknown)

    return {
        "slug": slug,
        "display_name": display_name,
        "geography": {
            "ta_slug": pop_row["ta_slug"],
            "ta_name": pop_row["territorial_authority"],
            "region_slug": pop_row["region_slug"],
            "region_name": pop_row["region"],
            "population": population,
        },
        "rate_comparison_reliable": rate_comparison_reliable,
        "rolling_year": rolling,
        "latest_month": latest,
        "vs_national": vs_national,
        "vs_ta": vs_ta,
        "vs_region": vs_region,
        "patterns": {
            "by_crime_type": patterns,
            "by_crime_subtype": subtype_patterns,
        },
        "safety_messages": safety,
        **({"trend": trend} if trend else {}),
        "comparison_narrative": {
            "rolling_year": rolling_year_narrative(
                area_name,
                rolling["delta_pct"],
                rolling["rate_per_1000"],
                rolling["prior_rate_per_1000"],
                rolling["confidence"],
            ),
            "latest_month": _latest_month_narrative(latest, area_name),
            "national": national_narratives,
        },
        "_population": population,
        "_ta_slug": pop_row["ta_slug"],
        "_region_slug": pop_row["region_slug"],
        "_ta_name": pop_row["territorial_authority"],
        "_region_name": pop_row["region"],
        "_area_name": area_name,
    }


def build_all(
    victimisations: pd.DataFrame,
    population: pd.DataFrame,
) -> tuple[list[dict], list[dict], dict]:
    config = load_config()
    data_through = _data_through(victimisations)
    windows = from_data_through(data_through)

    ctx = BuildContext(
        windows=windows,
        population=population,
        config=config,
        national_population=int(population["population"].sum()),
    )

    national = build_national_baseline(victimisations, ctx)
    geography = build_geography_baselines(victimisations, population, ctx)
    nat_rates = national["rolling_year"]["by_crime_type"]
    nat_total = national["rolling_year"]["total_rate_per_1000"]
    ta_baselines = geography["territorial_authorities"]
    region_baselines = geography["regions"]

    # Merge population with crime keys
    pop = population.copy()
    v = victimisations.copy()
    v["ta_slug"] = v["territorial_authority"].map(lambda x: slugify(x))
    v["slug"] = v["area_unit"].map(lambda x: slugify(x)) + "-" + v["ta_slug"]
    crime_by_slug = {slug: grp for slug, grp in v.groupby("slug")}

    areas_index: list[dict] = []
    briefs: list[dict] = []

    min_brief_count = 5

    for _, pop_row in pop.iterrows():
        slug = pop_row["slug"]
        area_df = crime_by_slug.get(slug, v.iloc[0:0])
        current_count = _count(
            _main_types_only(
                _filter_period(area_df, windows.current_start, windows.current_end)
            )
        )
        has_brief = current_count >= min_brief_count

        areas_index.append(
            {
                "slug": slug,
                "name": pop_row["area_unit"],
                "display_name": pop_row["display_name"],
                "ta_slug": pop_row["ta_slug"],
                "ta_name": pop_row["territorial_authority"],
                "region_slug": pop_row["region_slug"],
                "region_name": pop_row["region"],
                "population": int(pop_row["population"]),
                "has_brief": has_brief,
            }
        )

        if not has_brief:
            continue

        ta_slug = pop_row["ta_slug"]
        region_slug = pop_row["region_slug"]
        ta_bl = ta_baselines.get(ta_slug, {}).get("rolling_year", {})
        region_bl = region_baselines.get(region_slug, {}).get("rolling_year", {})

        brief = build_area_brief(
            area_df,
            pop_row,
            ctx,
            nat_rates,
            nat_total,
            ta_bl.get("by_crime_type", {}),
            ta_bl.get("total_rate_per_1000", 0.0),
            region_bl.get("by_crime_type", {}),
            region_bl.get("total_rate_per_1000", 0.0),
        )
        if brief:
            briefs.append(brief)

    meta = {
        "data_through": data_through.strftime("%Y-%m"),
        "current_period": {
            "start": windows.current_start.strftime("%Y-%m"),
            "end": windows.current_end.strftime("%Y-%m"),
        },
        "prior_period": {
            "start": windows.prior_start.strftime("%Y-%m"),
            "end": windows.prior_end.strftime("%Y-%m"),
        },
        "latest_month": windows.latest_month.strftime("%Y-%m"),
        "previous_month": windows.previous_month.strftime("%Y-%m"),
    }

    return areas_index, briefs, {"meta": meta, "national": national, "geography": geography}
