# Handoff — vcro/mvp-biobanks

Pick up from here. The worktree is fresh off `main` @ f9a9b67.

## Goal

New MVP grounded in real biobank specimen data instead of paper-extracted cohorts.
Data source: AminoChain Specimen Center scrape.

## Data sources

### 1. Canonical — SQLite dump (USE THIS)
`/Users/kamilseghrouchni/Downloads/aminochain-specimens/specimens.db` — 2.0 GB

- 486,754 specimens, 161,374 donors, 18 orgs
- Collection 1999–2025, 8 countries
- Schema: 29 columns + `raw_json` (TA scores, T/N/M staging, measurements)
- Indexes on `specimen_id`, `donor_id`, `specimen_type`, `country_of_origin`
- Source API: `data-api.aminochain.io/specimen/get-by-filter`
- Re-run: `scripts/exfiltrate.py` (idempotent, resumable)
- Full README in same dir.

### 2. Stale subset — vcro-v3 extract
`/Users/kamilseghrouchni/Desktop/side-projects/vcro-v3/store/eval/aminochain/`

- 27,514 specimens (5.6% of canonical) split by 9 therapeutic areas
- **Worth keeping:** `organized/org_profiles.json` — 25 orgs with name, address, website, contactEmail, description. The .db only has org UUIDs.
- Pre-computed `biomarker_coverage.json`, `matched_pairs.json`, `summary.json`, `by_therapeutic_area.json` — all derived from the 27K subset, regenerate from the .db.

## Why .db (and not JSONL)

- Single 2 GB file, no server, copies cleanly
- `json_extract()` queries nested fields without flattening
- Random access via indexes; JSONL is sequential scan
- Good fit for ~500K rows. Stays.

## Diff: canonical vs subset

- Canonical has **17.7× more specimens** than subset.
- Every DB org_id is in `org_profiles.json`. ✓
- 7 profile orgs have **0 specimens in DB**: Crown Bioscience, The Douglas Brain Bank, 64 Codon, Northwestern NSTB, AminoChain (the platform), ImYoo, Ukraine Biobank.

## Proposed first work in this worktree

1. **Symlink or copy** `specimens.db` into this repo (decide path; `data/specimens.db` suggested) so the MVP is self-contained.
2. **Enrich .db with org metadata** — new `organizations` table from `org_profiles.json`, joined view `specimens_with_org`.
3. **Regenerate derived views** from full 486K rows: by_therapeutic_area, biomarker_coverage, matched_pairs, summary. Drop these as parquet/JSON next to the .db.
4. **Ingest the extraction scripts** worth keeping: `vcro-v3/scripts/aminochain_extract.py`, `aminochain_eval_bundles.py`, plus `Downloads/aminochain-specimens/scripts/exfiltrate.py` + `partitions*.json`.
5. Then decide MVP shape (TUI? web? agent endpoint?) — **not started**.

## Open decisions

- Where does `specimens.db` live in this repo? (data/, store/, root?)
- Is git-lfs / DVC needed, or stays out of git via `.gitignore` + a fetch script?
- MVP surface — do we want a query agent on top of the .db (text → SQL → ranked specimens), or a static catalog browser, or something else?

## Quick start

```bash
cd /Users/kamilseghrouchni/Desktop/side-projects/vcro-mvp-biobanks
sqlite3 /Users/kamilseghrouchni/Downloads/aminochain-specimens/specimens.db
# .schema specimens
# SELECT COUNT(*) FROM specimens;
```

## Git

- Worktree: `/Users/kamilseghrouchni/Desktop/side-projects/vcro-mvp-biobanks`
- Branch: `vcro/mvp-biobanks` (no commits yet beyond main)
- Commit author: `kamil seghrouchni <kamil.seg@gmail.com>` — never Claude.
