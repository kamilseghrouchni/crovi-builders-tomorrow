# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is vCRO

A cohort intelligence system for life sciences. It answers questions about
biological samples, cohorts, analytical platforms, data access, and pricing.
Every claim must be backed by source quotes with IDs (PMID, PMC, DOI, or NCT).

## Running Scripts

All scripts are pure Python stdlib. No pip install needed.

```bash
# Search
python3 scripts/pubmed_api.py --queries "AD metabolomics" --retmax 20 --cache_dir store
python3 scripts/europepmc_api.py --queries "FFPE metabolomics" --cache_dir store
python3 scripts/clinicaltrials_api.py --condition "Alzheimer" --terms "plasma" --top_n 20 --cache_dir store

# Map and fetch papers
python3 scripts/pmid_to_pmc.py --pmids_file /tmp/pmids.txt
python3 scripts/pmc_fetch.py --pmc_ids PMC12269576 --cache_dir store

# Query artifacts
python3 scripts/store_query.py file.json --search "statin" --select id,cohorts_named
python3 scripts/store_search.py "medication confounding" --section cohort --top 5

# Run state: progress ledger and crash recovery (not a scheduler)
python3 scripts/run_state.py store/runs/my_run init store/runs/my_run/request.json
python3 scripts/run_state.py store/runs/my_run complete search --artifact pubmed_results.json
python3 scripts/run_state.py store/runs/my_run skip notion_create "webapp mode"
python3 scripts/run_state.py store/runs/my_run status
python3 scripts/run_state.py store/runs/my_run next   # crash recovery: first incomplete phase

# Notion delivery
python3 scripts/md_to_notion.py recommendation.md --page-id <id> --post
```

## Pipeline Architecture

A 9-step pipeline driven by skill files in `skills/`. Each skill is a
`SKILL.md` instruction doc that tells Claude what to do at that phase.

1. **Understand** (`vcro-understand`) — parse user query into `store/runs/{date}_{slug}/request.json`
2. **Search** (`vcro-cohort-map` Phase A) — PubMed + Europe PMC + ClinicalTrials.gov with adaptive expansion
3. **Validate** (`vcro-validate`) — classify results as RELEVANT / TANGENTIAL / NOT_RELEVANT
4. **Map and fetch** — convert PMIDs to PMC IDs, download paper sections
5. **Extract** (`vcro-cohort-map` Phase B) — extract intelligence dimensions from paper sections in batches of 8-10
6. **Signal** (`vcro-signal`) — synthesize evidence across papers
7. **Contacts / Provider / Access** (`vcro-contacts`, `vcro-source`, `vcro-access`) — PI names, platform comparisons, access routes
8. **Rank** (`vcro-rank`) — order top 5 cohorts by fit to request (not raw N)
9. **Deliver** (`vcro-deliver`) — markdown recommendation, post to Notion

Not every query needs all 9 steps. A feasibility question may only need
steps 1-6. A pricing question may only need `vcro-pricing`.

## Key Architecture Decisions

- **Skills are instruction docs, not code.** They live in `skills/*/SKILL.md` and tell Claude what to do.
- **Scripts are pure tools.** They make API calls, parse XML, write JSON. No judgment, no orchestration.
- **The store is a filesystem cache.** Papers, runs, and artifacts live on disk. No database.
- **Intelligence dimensions** (`references/intelligence-dimensions.md`) define the vocabulary for extraction. Pick 5-8 per paper based on scope_notes.
- **Two modes:** CLI (Claude Code reads CLAUDE.md directly) and production (Next.js + Vercel AI SDK with `streamText` and `useChat`).
- **Opus orchestrates, never processes.** The main Opus session spawns subagents for ALL heavy phases. It reads 3–5 sentence digests from subagents — never raw JSON files or script output. See `vcro-os` for the full model allocation table.

## Store Structure

```
store/
├── sources/pmc/PMC.../           # Per-paper sections (meta.json, cohort.txt, biospecimens.txt, etc.)
├── sources/clinicaltrials/NCT.../
├── cohorts/
├── runs/{date}_{slug}/           # Per-run artifacts (request.json, run_state.json, extracted_cohorts.json, etc.)
└── index/
```

Initialize with: `mkdir -p store/sources/pmc store/sources/clinicaltrials store/cohorts store/runs store/index`

## Critical Rules

1. Every claim needs a source quote with ID (PMID, PMC, DOI, or NCT)
2. Every fact needs an implication ("which means for your project..."). If you cannot say it, skip it
3. Negative results matter as much as positive
4. Rank by fit to the request, not by raw sample size
5. Batch extraction into groups of 8-10 papers
6. Use `store_query.py` to search artifacts without loading entire files
7. Log every phase to `run_state.py` for crash recovery (it's a ledger, not a scheduler)
8. Do NOT include ISOSpec in provider comparisons
9. Ask the user before including tangential results. Never auto-resolve
10. If resuming a crashed run, check `run_state.py status` and resume from the first incomplete phase

## Notion Delivery

`md_to_notion.py` supports: headings, bullets, numbered lists, checkboxes,
callouts (`> `), code blocks, dividers (`---`), tables, toggles
(`:::toggle Title`), bookmarks (`[bookmark](url)`), table of contents
(`!toc`), inline bold, italic, code, and links.

## Environment Variables

- `.notion-token` — Notion integration token (optional, skip Notion if not set)
- `.openai-key` — OpenAI API key for semantic search embeddings (optional, falls back to TF-IDF)
- `ANTHROPIC_API_KEY` — for production Next.js route (`@ai-sdk/anthropic`)

## Version Controlling with Git.

Never author commits as Claude. Always under kamil seghrouchni, kamil@gmail.com