# System architecture

Python ETL builds suburb briefs; Next.js serves them. Persistence is files (raw → Parquet → JSON/GeoJSON). No user accounts and no application database.

Not affiliated with NZ Police, Stats NZ, or any government agency.

## Components

```
Operators (monthly)
  → Police Crosstab + Stats NZ geo/pop
  → pipeline/ (ingest → clean → aggregate → export)
       → data/processed/ (Parquet)
       → web/public/data/ + web/server-data/
            → Next.js (web/) → browsers
```

### Pipeline (`pipeline/`)

Python 3.11+, pandas, pyarrow, YAML config, Makefile + `scripts/`. Package under `src/crimetracker/` (police, population, aggregates, export, narrative, windows, geo). Tests in `pipeline/tests/`.

Stage detail: [ETL_PIPELINE.md](./ETL_PIPELINE.md).

### Web (`web/`)

Next.js 15 App Router, React 19, TypeScript, Tailwind 4. Maps via `react-map-gl` (MapLibre/OpenFreeMap by default, Mapbox when tokenised). Addressfinder preferred for geocode; OSM fallback without a key. Middleware rate-limits `/api/*` and slug-checks path params.

| Path | Role |
| --- | --- |
| `web/public/data/**` | Briefs, indexes, per-suburb boundaries (public) |
| `web/server-data/boundaries/all_suburbs.geojson` | National set for nearby-map queries (server-only) |
| `/api/boundary/*` | Scoped GeoJSON (slug required) |
| `/api/address/*` | Autocomplete / resolve → meshblock → area slug |

Screens: home search, area brief (map, filters, stats, patterns, safety copy), methodology, glossary, crime-type guides.

## On disk

```
data/raw/...          landing zone
data/processed/       Parquet staging
web/public/data/      serving JSON (gitignored; required at deploy)
web/server-data/      large GeoJSON (gitignored; required at deploy)
```

## JSON contract

Pipeline and UI share types in `web/lib/types`. An area brief carries rolling-year and latest-month stats, optional `rolling_12m_rate_per_1000` trend, TA/region/national ratios, patterns, confidence flags, and geography metadata.

Schema changes need coordinated updates in `aggregates/build.py` and the TypeScript types/UI.

## Hosting

Production is Vercel (`suburbsense.grf-technologies.com`) with Cloudflare DNS. The deploy artifact must include `server-data`, not only `public/`. Secrets (`ADDRESSFINDER_KEY`, optional `DATAFINDER_API_KEY`) stay in the host env.

See [DEPLOYMENT.md](./DEPLOYMENT.md) and [SECURITY.md](./SECURITY.md).
