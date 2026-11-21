.PHONY: pipeline sample-data fixtures dev install-pipeline install-web download-stats help

help:
	@echo "CrimeTracker commands:"
	@echo "  make install-pipeline  Install Python pipeline dependencies"
	@echo "  make install-web       Install Next.js dependencies"
	@echo "  make fixtures          Generate dev fixture CSVs + run full pipeline"
	@echo "  make sample-data       Generate hand-crafted sample JSON only"
	@echo "  make download-stats    Download Stats NZ population + rollup (needs geo CSV)"
	@echo "  make pipeline          Full ETL (Police CSV + Stats NZ data required)"
	@echo "  make dev               Start Next.js dev server"

install-pipeline:
	cd pipeline && python3 -m pip install -r requirements.txt

install-web:
	cd web && npm install

sample-data:
	cd pipeline && PYTHONPATH=src python3 scripts/generate_sample_data.py

fixtures:
	cd pipeline && PYTHONPATH=src python3 scripts/generate_fixtures.py && \
		PYTHONPATH=src python3 scripts/ingest_police.py && \
		PYTHONPATH=src python3 scripts/download_stats.py && \
		PYTHONPATH=src python3 scripts/build_aggregates.py

download-stats:
	cd pipeline && PYTHONPATH=src python3 scripts/download_stats.py

pipeline:
	cd pipeline && PYTHONPATH=src python3 scripts/ingest_police.py && \
		PYTHONPATH=src python3 scripts/download_stats.py && \
		PYTHONPATH=src python3 scripts/build_aggregates.py

dev:
	cd web && npm run dev
