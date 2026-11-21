# ETL pipeline — extract, transform, load

Suburb Sense runs a **batch ETL** (Extract → Transform → Load) job that turns open Police and Stats NZ datasets into suburb briefs the web app can serve as static JSON. Orchestration is via the root `Makefile` (`make pipeline`). Configuration lives in `pipeline/config/sources.yaml`.

This document uses standard ETL / data-engineering terms throughout.

---

## Pipeline overview

```
┌─────────────────────┐     ┌──────────────────────┐     ┌─────────────────────────┐
│ EXTRACT (sources)   │────▶│ TRANSFORM (clean +   │────▶│ LOAD (serve / store)    │
│ Raw Police Crosstab │     │  aggregate + analyse)│     │ Parquet + JSON/GeoJSON  │
│ Stats NZ geo + pop  │     │  pandas / pyarrow    │     │ web/public + server-data│
└─────────────────────┘     └──────────────────────┘     └─────────────────────────┘
```

| Stage | Job | Primary scripts / modules |
| --- | --- | --- |
| **Extract** | Acquire and stage raw files | Manual Police download; `scripts/download_stats.py` |
| **Ingest / land** | Parse encodings, validate schema, write **staging** Parquet | `scripts/ingest_police.py` → `police/ingest.py`, `police/clean.py` |
| **Transform** | Dimension joins, windowed aggregates, rates, narratives | `scripts/build_aggregates.py` → `aggregates/`, `population/`, `windows/`, `narrative/` |
| **Load** | Publish **serving-layer** artefacts for the Next.js app | `export/json_export.py`, boundary exporters |
| **Analyse** (in-pipeline) | Rolling rates, YoY deltas, geographic baselines, confidence, patterns | `aggregates/build.py`, `aggregates/confidence.py` |

There is **no live database**. The warehouse analogue is columnar **Parquet** under `data/processed/`; the application serving layer is **static JSON / GeoJSON** under `web/`.

---

## 1. Extract — data sources

### 1.1 NZ Police recorded crime victimisations (fact table)

| Item | Detail |
| --- | --- |
| **Portal** | [policedata.nz](https://www.police.govt.nz/about-us/publications-statistics/data-and-statistics/policedatanz) |
| **Report** | **Victimisations — location and time detail** (Tableau sheet typically labelled *Victimisation Time and Place*) |
| **Do not use for suburb briefs** | Demographics-only sheets (e.g. *Age Ethnicity Boundary*); Police Stations views without Area Unit |
| **Export method** | Tableau **Download → Crosstab** (not the summarised “Data” sheet alone) |
| **Landing zone** | `data/raw/police/victimisations.csv` |
| **Physical format** | Despite the `.csv` suffix: **UTF-16 LE**, **tab-delimited** (`\t`) |
| **Grain** | One row ≈ victimisation count for a combination of month, ANZSOC, geography, and (when present) day/hour/meshblock |
| **Refresh cadence** | Police publish monthly (typically last working day); data often lags the calendar by ~1–2 months |
| **Licence** | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |

**Required columns (logical schema after alias normalisation):**

| Canonical name | Role | Notes |
| --- | --- | --- |
| `Year Month` | Time dimension | e.g. `September 2022` |
| `ANZSOC Division` | Crime classification | Mapped to short product labels |
| `Area Unit` | Suburb-scale geography (AU2017 naming) | Trailing periods stripped |
| `Territorial Authority` | Local government area | Used for TA baselines |
| `Day of Week` / `Occurrence Day Of Week` | Temporal pattern | Optional for totals; used for patterns |
| `Hour of Day` / `Occurrence Hour Of Day` | Temporal pattern | `99` / unknown treated as missing |
| `Meshblock` | Fine geography | Optional for area briefs; required for meshblock products |
| `Victimisations` or `Number of Records` | Measure / fact | Count weight |

**Known source limitation:** the location-and-time Tableau view may **suppress some dwelling victimisations** for privacy. Totals can understate absolute volume versus other Police reports. Suburb Sense documents this on methodology / transparency surfaces.

Typical history available in this export is on the order of **several years** (e.g. from late 2022), not the full multi-decade Police Stations history.

### 1.2 Stats NZ geographic areas (dimension)

| Item | Detail |
| --- | --- |
| **Source** | [Geographic Areas Table 2024](https://datafinder.stats.govt.nz/table/115227-geographic-areas-table-2024/) |
| **Landing zone** | `data/raw/stats_nz/geographic_areas_2024.csv` |
| **Acquire** | Manual export (no reliable automated download in this repo) |
| **Use** | Meshblock → Area Unit → TA → region hierarchy; slug construction; boundary joins |

### 1.3 Stats NZ meshblock population (dimension)

| Item | Detail |
| --- | --- |
| **Source** | Stats NZ DataFinder attachment (configured in `sources.yaml`) |
| **Landing zone** | `data/raw/stats_nz/meshblock_population_2018.csv` |
| **Acquire** | `make download-stats` / `scripts/download_stats.py` |
| **Use** | Roll up to Area Unit population for **rates per 1,000 residents** |
| **Caveat** | 2018 census electoral population — stable baseline, not live census risk |

---

## 2. Ingest — land and validate

**Entry:** `PYTHONPATH=src python scripts/ingest_police.py` (via `make pipeline`).

### Extract / parse

1. Attempt multiple **reader profiles** (`utf-8-sig`+comma, `utf-16-le`+tab, etc.) until parse succeeds (`police/ingest.py`).
2. **Column aliasing** — map Tableau variants to a canonical schema (`COLUMN_ALIASES`).
3. **Schema validation** — fail fast if core columns are missing (`Year Month`, `ANZSOC Division`, `Area Unit`, `Territorial Authority`).

### Clean / standardise (transform within ingest)

`police/clean.py` applies:

- Strip trailing periods on area / TA names  
- Parse `Year Month` → month-start timestamps  
- Map ANZSOC division → product `crime_type` (`Theft`, `Burglary`, `Assault`, `Robbery`, `Sexual`; `Harm` excluded from main UI series)  
- Normalise meshblock IDs (digit width)  
- Coerce day/hour unknowns; build `count` from Victimisations  
- Drop rows missing month / area / TA  

### Staging store

| Artefact | Path | Format |
| --- | --- | --- |
| Clean victimisations | `data/processed/victimisations.parquet` | Apache Parquet (columnar) |
| Population by area | `data/processed/population_by_area.parquet` | Parquet (from population rollup) |

Parquet is the **intermediate data store**: compressed, typed, and fast for pandas reloads on the aggregate step. Raw files remain in `data/raw/` as the immutable **landing zone**.

---

## 3. Transform — integrate, aggregate, analyse

**Entry:** `scripts/build_aggregates.py` after population rollup.

### 3.1 Population rollup

`population/rollup.py` joins meshblock population to geographic areas and aggregates to **Area Unit** population. This is a classic **dimension enrichment** / star-schema style join (facts = victimisations; dims = geography + population).

### 3.2 Analysis windows

`windows/periods.py` defines sliding windows from `data_through` (latest month present in the fact table), e.g.:

| Window | Purpose |
| --- | --- |
| **Current rolling 12 months** | Primary “year” stats on area briefs |
| **Prior rolling 12 months** | Year-over-year comparison |
| **Latest month / previous month** | Short-term movement (shown when confidence allows) |

### 3.3 Aggregations (OLAP-style rollups)

Per Area Unit (and optionally meshblock), the pipeline computes:

- Counts and **rates per 1,000** (count ÷ population × 1000)  
- Breakdowns by main crime type and subtype  
- **Geographic baselines** — same metrics for TA, region, and national for ratio comparisons  
- **Day-of-week / hour-band patterns** where time fields exist  
- **Crime mix** shares for charts  
- **Trend series** — rolling 12-month rate per 1,000 for each month that has a complete preceding year of history (first chart point ≈ 11 months after the earliest source month)

### 3.4 Confidence scoring

`aggregates/confidence.py` assigns high / medium / low based on population and count thresholds from `sources.yaml`. Low-confidence areas suppress misleading rate emphasis in the UI.

### 3.5 Rule-based narratives

`narrative/tone.py` fills **deterministic templates** using aggregate numbers and tone rules in `pipeline/docs/tone-rules.md`. Messages are gated by confidence and unknown-time share.

### 3.6 Surrogate keys / identifiers

Area briefs use URL **slugs** (`{suburb}-{ta-slug}`) as the stable join key between pipeline JSON and Next.js routes.

---

## 4. Load — serving layer

**Load** here means publishing files the web tier can read without a database.

| Artefact | Location | Consumers |
| --- | --- | --- |
| `meta.json` | `web/public/data/` | Freshness banner, SEO period labels |
| `areas.json` | `web/public/data/` | Suburb picker index |
| `national.json`, `geography.json` | `web/public/data/` | Baselines / comparisons |
| `briefs/{slug}.json` | `web/public/data/briefs/` | Area pages |
| `meshblock_briefs/{id}.json` | `web/public/data/meshblock_briefs/` | Fine-grain views |
| `meshblock_to_area.json` | `web/public/data/` | Address → suburb resolve |
| `boundaries/{slug}.json` | `web/public/data/boundaries/` | Per-suburb map polygons |
| `all_suburbs.geojson` | `web/server-data/boundaries/` | **Server-only** nearby-suburb queries (~tens of MB; not under `public/`) |

Optional live boundary pulls (DataFinder) run when `DATAFINDER_API_KEY` is set; otherwise existing boundary files are retained.

`CHANGELOG.md` is appended on each successful export (audit of load runs).

---

## 5. Idempotency, lineage, and operations

| Concern | Practice |
| --- | --- |
| **Idempotent rebuild** | Replacing the raw CSV and re-running `make pipeline` regenerates Parquet + all JSON |
| **Lineage** | Raw → Parquet → briefs; `meta.json` records `data_through`, `generated_at`, `pipeline_version` |
| **Config as code** | Thresholds, paths, and source URLs in `pipeline/config/sources.yaml` |
| **Dev fixtures** | `make fixtures` synthesises small CSVs for offline development |
| **Monthly ops** | Replace Police file → `make pipeline` → deploy `web/public/data` + `web/server-data` |

### Make targets

| Target | ETL role |
| --- | --- |
| `make download-stats` | Extract (+ rollup) Stats NZ population |
| `make pipeline` | Full ingest → transform → load |
| `make fixtures` | Synthetic extract + full pipeline |
| `make dev` | Run web app against loaded artefacts |

---

## 6. Quality checks (informal DQ)

Operators should verify after each load:

1. `meta.json` → `data_through` matches expected Police month  
2. Brief count in CHANGELOG is in the expected ~1,700+ range for full NZ  
3. Sample suburb: rolling year windows, latest month, and trend points present  
4. Area Unit names look like suburbs (not numeric codes only)  
5. Map nearby load still works (server-data GeoJSON present on the host)

Automated tests under `pipeline/tests/` cover ingest aliases and related unit behaviour.
