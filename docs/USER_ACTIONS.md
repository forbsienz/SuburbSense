# Operator checklist — production data

Use this runbook to **extract** real NZ open data into the landing zone, then run the full **ETL** (`make pipeline`) so the web app loads production briefs instead of fixtures.

Related: [ETL_PIPELINE.md](./ETL_PIPELINE.md) · [ARCHITECTURE.md](./ARCHITECTURE.md)

---

## Step 1 — Extract Police victimisations (manual)

1. Open [policedata.nz](https://www.police.govt.nz/about-us/publications-statistics/data-and-statistics/policedatanz).  
2. Open **Victimisations** with **location and time** detail (Tableau title often includes *Victimisation Time and Place*).  
   - **Do not** use *Age Ethnicity Boundary* or other demographics-only sheets.  
   - Police Stations views are useful for station/TA history but **lack Area Unit / day / hour** needed for suburb briefs.  
3. Ensure the Crosstab includes at least:

   1. Year Month  
   2. ANZSOC Division (or Anzsoc Division)  
   3. Area Unit  
   4. Territorial Authority  
   5. Day of Week (or Occurrence Day Of Week)  
   6. Hour of Day (or Occurrence Hour Of Day)  
   7. Meshblock  
   8. Victimisations  

4. Download → **Crosstab** (UTF-16 LE, tab-delimited; often still named `.csv`).  
5. Save / replace:

   ```
   data/raw/police/victimisations.csv
   ```

   Expect on the order of **~500 MB** for a multi-year national extract.

**Note:** Location-and-time history may start later than other Police reports (e.g. from 2022). That is enough for rolling 12-month vs prior year and a multi-year rolling-rate trend once a full first year exists.

---

## Step 2 — Extract Stats NZ geographic areas (manual)

Automatic download is **not** available for this file in the repo.

1. Open [Geographic Areas Table 2024](https://datafinder.stats.govt.nz/table/115227-geographic-areas-table-2024/).  
2. Export / download as CSV.  
3. Save as:

   ```
   data/raw/stats_nz/geographic_areas_2024.csv
   ```

---

## Step 3 — Extract meshblock population (automated)

```bash
make download-stats
```

This downloads meshblock population (DataFinder URL in `pipeline/config/sources.yaml`) and builds:

```
data/processed/population_by_area.parquet
```

If you previously ran `make fixtures`, remove the tiny fixture population so the real file is fetched:

```bash
rm data/raw/stats_nz/meshblock_population_2018.csv
make download-stats
```

---

## Step 4 — Run full ETL (ingest → transform → load)

```bash
make pipeline
```

Equivalent stages:

1. **Ingest** Police CSV → `data/processed/victimisations.parquet`  
2. **Transform** population rollup (if needed) + aggregates / analysis  
3. **Load** JSON / GeoJSON into `web/public/data/` and `web/server-data/boundaries/`  

Expect roughly **1,700+** area briefs when the national extract is complete. `CHANGELOG.md` records each export.

Nearby-suburb map queries need **`web/server-data/boundaries/all_suburbs.geojson`** (server-only — not a public URL). Per-suburb polygons remain under `web/public/data/boundaries/`.

If `DATAFINDER_API_KEY` is unset, live boundary refresh is skipped; existing boundary files are kept.

---

## Step 5 — Run the site

```bash
make install-web   # once
make dev
```

Browse e.g. `/area/otatara-invercargill-city` (slug: `{suburb}-{territorial-authority-slug}`).

---

## Development without production extracts

```bash
make fixtures    # synthetic CSVs + full pipeline
make dev
```

---

## Monthly refresh

1. After Police publish (typically the **last working day** of the month), replace `data/raw/police/victimisations.csv`.  
2. Run `make pipeline`.  
3. Deploy updated `web/public/data/` **and** `web/server-data/` with the application.  

Verify `web/public/data/meta.json` → `data_through` matches the latest month you expect (Police data often lags the calendar by about one to two months).
