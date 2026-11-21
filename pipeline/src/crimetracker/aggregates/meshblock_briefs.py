"""Build meshblock-level crime briefs."""

from __future__ import annotations

from pathlib import Path

import pandas as pd

from crimetracker.aggregates.build import (
    BuildContext,
    _count,
    _filter_period,
    _latest_month_narrative,
    _main_types_only,
    _month_stats,
    _patterns,
    _all_subtype_patterns,
    _period_stats,
    _safety_messages,
    _vs_ratios,
    build_national_baseline,
    build_geography_baselines,
)
from crimetracker.config import load_config, resolve_path
from crimetracker.narrative.tone import national_comparison_message, rolling_year_narrative
from crimetracker.population.rollup import POP_PATH, _load_geographic_areas, _load_meshblock_population
from crimetracker.util.text import slugify
from crimetracker.windows.periods import from_data_through


def build_meshblock_population(geo_path: Path, pop_path: Path) -> pd.DataFrame:
    geo = _load_geographic_areas(geo_path)
    pop = _load_meshblock_population(pop_path)
    merged = geo.merge(pop, on="meshblock", how="left")
    merged["population"] = merged["population"].fillna(0).astype(int)
    merged["ta_slug"] = merged["territorial_authority"].map(slugify)
    merged["region_slug"] = merged["region"].map(slugify)
    merged["slug"] = merged["area_unit"].map(slugify) + "-" + merged["ta_slug"]
    merged["display_name"] = merged["area_unit"] + ", " + merged["territorial_authority"]
    return merged


def build_meshblock_brief(
    meshblock_df: pd.DataFrame,
    meshblock: str,
    pop_row: pd.Series,
    parent_brief: dict,
    ctx: BuildContext,
    national_rates: dict[str, float],
    national_total_rate: float,
    region_rates: dict[str, float],
    region_total_rate: float,
) -> dict | None:
    conf_cfg = ctx.config["confidence"]
    max_unknown = ctx.config["narrative"]["max_unknown_time_pct"]
    population = int(pop_row["population"])
    parent_name = parent_brief["display_name"]
    display_name = f"Meshblock {meshblock}, {parent_name}"

    current = _main_types_only(
        _filter_period(meshblock_df, ctx.windows.current_start, ctx.windows.current_end)
    )
    prior = _main_types_only(
        _filter_period(meshblock_df, ctx.windows.prior_start, ctx.windows.prior_end)
    )

    if _count(current) == 0 and _count(prior) == 0:
        return None

    rolling = _period_stats(current, prior, population, conf_cfg)
    latest = _month_stats(
        meshblock_df,
        ctx.windows.latest_month,
        ctx.windows.previous_month,
        population,
        conf_cfg,
    )

    pattern_types = [
        crime_type
        for crime_type in rolling.get("by_crime_type", {})
        if crime_type in rolling["by_crime_type"]
    ]
    patterns = _patterns(current, pattern_types)
    subtype_patterns = _all_subtype_patterns(current)

    parent_rolling = parent_brief["rolling_year"]
    parent_type_rates = {
        crime_type: stats["rate_per_1000"]
        for crime_type, stats in parent_rolling.get("by_crime_type", {}).items()
    }
    vs_suburb = _vs_ratios(
        rolling,
        parent_type_rates,
        parent_rolling["rate_per_1000"],
    )
    vs_region = _vs_ratios(rolling, region_rates, region_total_rate)
    vs_national = _vs_ratios(rolling, national_rates, national_total_rate)

    national_narratives = {
        "total": national_comparison_message("all crime", vs_national["total_ratio"])
    }
    for crime_type, ratio in vs_national["by_crime_type"].items():
        national_narratives[crime_type] = national_comparison_message(crime_type, ratio)

    min_pop = ctx.config.get("comparison", {}).get("min_population_for_rate_display", 1000)
    rate_comparison_reliable = population >= min_pop

    area_label = f"meshblock {meshblock}"
    safety = _safety_messages(area_label, patterns, rolling["confidence"], max_unknown)

    return {
        "meshblock": meshblock,
        "parent_slug": parent_brief["slug"],
        "parent_display_name": parent_name,
        "scope": "meshblock",
        "slug": meshblock,
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
        "vs_suburb": vs_suburb,
        "vs_ta": vs_suburb,
        "vs_region": vs_region,
        "vs_national": vs_national,
        "patterns": {
            "by_crime_type": patterns,
            "by_crime_subtype": subtype_patterns,
        },
        "safety_messages": safety,
        "comparison_narrative": {
            "rolling_year": rolling_year_narrative(
                area_label,
                rolling["delta_pct"],
                rolling["rate_per_1000"],
                rolling["prior_rate_per_1000"],
                rolling["confidence"],
            ),
            "latest_month": _latest_month_narrative(latest, area_label),
            "national": national_narratives,
        },
    }


def build_all_meshblock_briefs(
    victimisations: pd.DataFrame,
    population: pd.DataFrame,
    area_briefs: list[dict],
    geo_path: Path,
    pop_path: Path,
    min_count: int = 1,
) -> list[dict]:
    config = load_config()
    data_through = victimisations["month"].max().date()
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
    region_baselines = geography["regions"]

    brief_by_slug = {brief["slug"]: brief for brief in area_briefs}
    meshblock_pop = build_meshblock_population(geo_path, pop_path)
    pop_by_meshblock = meshblock_pop.set_index("meshblock")

    v = victimisations.copy()
    v = v[v["meshblock"].notna()]
    crime_by_meshblock = {mb: grp for mb, grp in v.groupby("meshblock")}

    briefs: list[dict] = []
    for meshblock, mb_df in crime_by_meshblock.items():
        if meshblock not in pop_by_meshblock.index:
            continue
        pop_row = pop_by_meshblock.loc[meshblock]
        parent_slug = pop_row["slug"]
        parent_brief = brief_by_slug.get(parent_slug)
        if not parent_brief:
            continue

        current_count = _count(
            _main_types_only(
                _filter_period(mb_df, windows.current_start, windows.current_end)
            )
        )
        if current_count < min_count:
            continue

        region_slug = pop_row["region_slug"]
        region_bl = region_baselines.get(region_slug, {}).get("rolling_year", {})

        brief = build_meshblock_brief(
            mb_df,
            str(meshblock),
            pop_row,
            parent_brief,
            ctx,
            nat_rates,
            nat_total,
            region_bl.get("by_crime_type", {}),
            region_bl.get("total_rate_per_1000", 0.0),
        )
        if brief:
            briefs.append(brief)

    return briefs
