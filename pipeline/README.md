# Suburb Sense — Python ETL package

Batch **ETL** that converts NZ Police victimisation extracts and Stats NZ geography/population into the JSON and GeoJSON consumed by the Next.js app.

Root orchestration: `make pipeline` (from the repository root). End-to-end documentation: [../docs/ETL_PIPELINE.md](../docs/ETL_PIPELINE.md).

---

## Package layout

```
pipeline/
├── config/sources.yaml          # Source paths, DQ thresholds, export dirs
├── scripts/
│   ├── ingest_police.py         # Extract/parse → Parquet staging
│   ├── download_stats.py        # Stats NZ population extract + rollup
│   ├── build_aggregates.py      # Transform / analyse → load JSON
│   ├── generate_fixtures.py     # Synthetic landing-zone data for dev
│   └── generate_sample_data.py  # Minimal sample JSON helpers
├── src/crimetracker/
│   ├── police/                  # Ingest, clean, ANZSOC mapping
│   ├── population/              # Meshblock → Area Unit rollup
│   ├── windows/                 # Rolling period definitions
│   ├── aggregates/              # Metrics, confidence, meshblock briefs
│   ├── narrative/               # Deterministic comparison text
│   ├── export/                  # Load to web/public and server-data
│   ├── geo/                     # Geospatial helpers
│   └── util/                    # Text / ID normalisation
├── tests/                       # pytest
└── docs/tone-rules.md           # Narrative constraints
```

---

## Dependencies

See `requirements.txt`:

- **pandas** — tabular transform and aggregation  
- **pyarrow** — Parquet staging I/O  
- **pyyaml** — configuration  
- **pytest** — unit tests  

Recommended: project virtualenv at `pipeline/.venv`.

```bash
cd pipeline
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export PYTHONPATH=src
```

From the repo root, `make pipeline` expects `python3` on `PATH` (activate the venv first, or put `.venv/bin` ahead of system Python).

---

## Stage map (ETL terms)

| Stage | Script / module | Output |
| --- | --- | --- |
| **Extract / land** | Manual Police file; `download_stats.py` | `data/raw/**` |
| **Ingest + clean** | `ingest_police.py` → `police.ingest` / `police.clean` | `data/processed/victimisations.parquet` |
| **Transform (dims)** | `population.rollup` | `data/processed/population_by_area.parquet` |
| **Transform / analyse** | `aggregates.build` | In-memory briefs + baselines |
| **Load** | `export.json_export` (+ boundary exporters) | `web/public/data/**`, `web/server-data/**` |

---

## Configuration

`config/sources.yaml` defines:

- Police raw path, encoding/delimiter expectations, required columns  
- Stats NZ download URLs and filenames  
- Export directories (`web_data_dir`, `server_data_dir`)  
- Population labels/caveats  
- Confidence and comparison thresholds  
- Narrative gates (e.g. max unknown-time percentage)  

Treat this file as **config-as-code** for the warehouse-style batch job.

---

## Narratives

Area comparison sentences are produced by **rule-based templates** in `narrative/tone.py`, constrained by [docs/tone-rules.md](docs/tone-rules.md).

---

## Tests

```bash
cd pipeline
PYTHONPATH=src pytest
```
