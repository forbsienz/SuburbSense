# Case study: Suburb Sense

Live site: [suburbsense.grf-technologies.com](https://suburbsense.grf-technologies.com)

## Problem

NZ publishes a lot of recorded-crime data. For someone looking up their suburb, the public tools are still mostly analyst-shaped:

- Crosstabs answer filter questions, not “what about my street / suburb?”
- Raw counts punish small places and flatter large ones
- Meshblock / Area Unit / TA in the file don’t match how people search (an address)
- A full national suburb boundary set is tens of megabytes — too big to dump on every page load

Suburb Sense is a monthly file-based pipeline and a static-ish Next.js front end. No accounts, no app database.

## What had to be true

**Right Police extract.** Only the Victimisations *Time and Place* Crosstab has the geography + time grain this product needs. Demographics sheets and Police Stations history without Area Unit look plausible in Tableau and still fail suburb analytics. Ingest treats missing Area Unit (and the other required columns) as a hard error — covered by [`test_validate_columns_rejects_missing_area_unit`](../pipeline/tests/test_ingest.py).

**Messy files.** Exports are often UTF-16 LE and tab-separated, with trailing periods on place names and shifting column labels. That normalisation lives in `pipeline/src/crimetracker/police/ingest.py` and `clean.py`, not in the UI.

**Lag.** Figures usually trail the calendar by about two months. The UI shows `data_through`; it does not pretend the feed is live.

**Weak samples.** Unknown day/hour is common. Rates and “peak time” copy are gated on confidence thresholds so thin suburbs don’t get overstated.

**API cost.** Addressfinder / Datafinder / Nominatim can burn quota or get the host banned. Slugs are allowlisted, `/api` is rate-limited, and the national GeoJSON stays under `web/server-data/` (not a public URL).

## How it’s built

```
Police Crosstab + Stats NZ geo/pop
        → ingest / validate / clean
        → aggregates (windows, rates, mix, patterns, confidence)
        → JSON export into web/public/data (+ server-only boundaries)
```

Product grain is **Area Unit**, with meshblock kept for address resolve. Comparisons use rolling 12-month windows and rates per 1,000 from census population. Short comparison sentences are fixed templates filled from aggregates (`pipeline/docs/tone-rules.md`) so wording stays reviewable in tests.

The web app mostly reads those JSON files. MapLibre/OpenFreeMap is the default map stack. The map loads the current suburb first, then nearby polygons from the server-only national file.

## What shipped

- ~1,700 suburb briefs that clear volume / quality thresholds
- Crime-type filter across stats, mix, patterns, and the longer rate trend
- Map zoom/pan and click-through to neighbouring areas
- Hosted on Vercel at `suburbsense.grf-technologies.com` (Cloudflare DNS)
- Operator notes for the monthly Police refresh

## What I’d still watch

- Population is census vintage; intercensal change isn’t modelled
- Some Area Units never publish — by design when counts are too thin
- Geography joins break if Stats NZ and Police vintages drift
- CSP still allows the Next.js inline bootstrap; tightening with nonces is unfinished work

## Pointers

- [Architecture](./ARCHITECTURE.md) · [ETL](./ETL_PIPELINE.md) · [Security](./SECURITY.md) · [Deploy](./DEPLOYMENT.md)
