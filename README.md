# Suburb Sense

Make sense of safety where you live.

**Live:** [suburbsense.grf-technologies.com](https://suburbsense.grf-technologies.com)

Suburb Sense turns NZ Police recorded crime victimisation stats into suburb-level briefs — rolling trends, rates per 1,000 residents, a map, and plain-language safety guidance.

Not affiliated with NZ Police, Stats NZ, or any government agency.

## Why this exists

Police open data is solid for analysts and awkward for residents. This project is a monthly batch ETL plus a read-only Next.js site: land the Crosstab, aggregate to Stats NZ Area Units, export JSON, serve it.

Design decisions and failure modes are written up in [docs/CASE_STUDY.md](docs/CASE_STUDY.md).

## Stack

| Layer | Tech |
| --- | --- |
| ETL | Python 3.11+, pandas, pyarrow, YAML, Makefile |
| Web | TypeScript, React 19, Next.js 15, Tailwind CSS 4 |
| Maps | MapLibre + OpenFreeMap by default; Mapbox if a token is set |
| Geocoding | Addressfinder when keyed; otherwise a coarser OSM path |
| Serving | Static JSON under `web/public/data/`; national GeoJSON under `web/server-data/` (server-only) |

## Pipeline (short version)

`make pipeline` runs extract → ingest → transform → load.

The Police file that matters is the **Victimisations — location and time** Crosstab (*Time and Place*). Age/Ethnicity sheets and Police Stations exports without Area Unit will not produce suburb briefs. Ingest expects messy Tableau reality (UTF-16 LE / tab is common), aliases a few column names, and **fails closed** if Year Month, ANZSOC Division, Area Unit, or Territorial Authority is missing.

Details: [docs/ETL_PIPELINE.md](docs/ETL_PIPELINE.md).

## Quick start

```bash
make install-pipeline
make install-web
make fixtures   # sample CSVs + ETL → web/public/data/
make dev        # http://localhost:3000
```

Optional env vars: copy `web/.env.example` to `web/.env.local` (`NEXT_PUBLIC_SITE_URL`, Addressfinder / Mapbox / GA as needed).

Deployments must include `web/server-data/boundaries/all_suburbs.geojson` in the server bundle (it is not public). See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Production data

1. From [policedata.nz](https://www.police.govt.nz/about-us/publications-statistics/data-and-statistics/policedatanz), export the **Time and Place** Crosstab with Area Unit, TA, Year Month, ANZSOC, Meshblock, day, hour, Victimisations → `data/raw/police/victimisations.csv`
2. Export [Geographic Areas Table 2024](https://datafinder.stats.govt.nz/table/115227-geographic-areas-table-2024/) → `data/raw/stats_nz/geographic_areas_2024.csv`
3. `make download-stats && make pipeline`

Police usually publish near month-end with about a two-month lag on the latest complete month. Checklist: [docs/USER_ACTIONS.md](docs/USER_ACTIONS.md).

## Layout

```
pipeline/     Python package (ingest, aggregates, export, narrative)
web/          Next.js app
docs/         architecture, ETL, case study, security, deploy
data/         raw + parquet (gitignored; rebuild locally)
```

## Docs

| Doc | What it’s for |
| --- | --- |
| [docs/CASE_STUDY.md](docs/CASE_STUDY.md) | Problem, choices, what shipped |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Components and JSON contract |
| [docs/ETL_PIPELINE.md](docs/ETL_PIPELINE.md) | Stage-by-stage pipeline |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Vercel + Cloudflare |
| [docs/SECURITY.md](docs/SECURITY.md) | Threat notes for the live host |
| [docs/USER_ACTIONS.md](docs/USER_ACTIONS.md) | Monthly refresh checklist |

## Attribution

NZ Police and Stats NZ data: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Attribute upstream sources if you redistribute derived stats.
