# vCRO Project Context

This document contains everything needed to set up the vCRO project from scratch. Read this fully before doing anything.

## What is vCRO

A cohort intelligence system for life sciences. It answers questions like "what cohorts exist for AD blood metabolomics with longitudinal design" or "can metabolomics run on FFPE tissue" or "how much would 500 plasma samples cost." It searches biomedical literature, extracts deep intelligence from papers, maps access routes, compares analytical platforms, and delivers evidence-backed recommendations.

## Project Structure

Create this exact structure:

```
vcro/
├── CLAUDE.md                          # Main skill file (provided)
├── skills/                            # Intelligence skills (provided)
│   ├── vcro-understand/SKILL.md
│   ├── vcro-cohort-map/SKILL.md
│   ├── vcro-validate/SKILL.md
│   ├── vcro-signal/SKILL.md
│   ├── vcro-contacts/SKILL.md
│   ├── vcro-source/SKILL.md
│   ├── vcro-access/SKILL.md
│   ├── vcro-rank/SKILL.md
│   ├── vcro-deliver/SKILL.md
│   └── vcro-pricing/SKILL.md
├── scripts/                           # Python tools (provided)
│   ├── pubmed_api.py
│   ├── europepmc_api.py
│   ├── clinicaltrials_api.py
│   ├── pmc_fetch.py
│   ├── pmid_to_pmc.py
│   ├── store_query.py
│   ├── store_search.py
│   ├── md_to_notion.py
│   └── run_state.py
├── references/                        # Domain knowledge (provided)
│   ├── intelligence-dimensions.md
│   ├── pricing-data.md
│   ├── context-package-schema.md
│   ├── run-checklist.md
│   └── run-state-schema.md
├── store/                             # Runtime data (gitignored, created at runtime)
│   ├── sources/pmc/
│   ├── sources/clinicaltrials/
│   ├── cohorts/
│   ├── runs/
│   └── index/
├── app/                               # Next.js frontend (to be built)
│   ├── page.tsx
│   ├── layout.tsx
│   └── api/
│       └── chat/
│           └── route.ts
├── package.json
├── tsconfig.json
├── .gitignore
├── .notion-token                      # Notion API token (optional)
└── .openai-key                        # OpenAI key for semantic search (optional)
```

## What Already Exists (in the migration bundle)

All files in `skills/`, `scripts/`, `references/`, and `CLAUDE.md` are complete and tested. They ran two full end-to-end pipelines:

1. **AD/ALS blood metabolomics** — 125 papers searched, 30 validated, 30 extracted with deep intelligence, 5 ranked cohorts with evidence quotes, Notion page delivered
2. **FFPE metabolomics feasibility** — 79 papers, 27 relevant, 23 extracted, full feasibility report with recovery rates, platform comparisons, PoC recommendations

The scripts are pure Python stdlib. No pip install needed. They call PubMed, Europe PMC, ClinicalTrials.gov, OpenAI embeddings, and Notion APIs directly via urllib.

## How the Pipeline Works

A user sends a question. The system:

1. **Understands** — parses the question into a structured request.json with indication, modality, sample type, scope notes
2. **Searches** — runs PubMed + Europe PMC + ClinicalTrials.gov with adaptive expansion (author targeting, recency sweeps)
3. **Validates** — classifies every result as relevant/tangential/not relevant. Asks the user about tangential items
4. **Maps and fetches** — converts PMIDs to PMC IDs, downloads paper sections (cohort, biospecimens, results, access)
5. **Extracts** — reads paper sections, extracts intelligence dimensions with exact quotes and implications. Batched in groups of 8 to 10
6. **Signals** — synthesizes evidence across papers: effect sizes, what worked, what failed, replication status
7. **Contacts + Provider + Access** — extracts PI names, compares platforms, maps access routes with timeline and cost
8. **Ranks** — orders cohorts by fit to the specific request, not by raw N
9. **Delivers** — writes a markdown recommendation, converts to Notion blocks, posts to Notion page

Not every query needs all 9 steps. A feasibility question might skip ranking. A pricing question might only need the pricing skill.

## Two Modes of Operation

### Development: Claude Code CLI

Open a terminal in the project root. Run `claude`. Claude Code reads CLAUDE.md, discovers the skills, and can run the full pipeline via bash tools. You interact in the terminal with full streaming visibility.

### Production: Next.js + Vercel AI SDK

The `app/api/chat/route.ts` endpoint receives user queries from the React frontend. It calls the Anthropic API via AI SDK `streamText`, with the skills as system prompt context and the scripts as tools. Progress streams to the frontend via data parts. The frontend uses `useChat` from the AI SDK.

Both modes use the same skills, scripts, and store. Write intelligence once, run it everywhere.

## What Needs to Be Built (the UI/backend)

### Next.js API Route (`app/api/chat/route.ts`)

This is the orchestrator in production mode. It should:
1. Receive user query from the frontend
2. Load CLAUDE.md and relevant skills as system prompt context
3. Call Anthropic API via `streamText` from `ai` package
4. Define tools that wrap the Python scripts (exec child processes)
5. Stream progress to the frontend as data parts
6. Each tool call (search, validate, extract) appears as a progress update

### React Frontend (`app/page.tsx`)

Use `useChat` from `ai/react`. Render:
- Chat input for user queries
- Streaming text responses
- Progress indicators from data parts (which phase is running)
- Tool invocation displays (what script ran, what it returned)
- Final recommendation as rich content (tables, callouts, links)

### Dependencies

```json
{
  "dependencies": {
    "ai": "latest",
    "@ai-sdk/anthropic": "latest",
    "next": "latest",
    "react": "latest",
    "react-dom": "latest"
  }
}
```

## Key Design Decisions

- **Skills are instruction docs, not code.** They tell Claude what to do. Claude executes via tools.
- **Scripts are pure tools.** They make API calls, parse XML, write JSON. No judgment, no orchestration.
- **The store is a filesystem cache.** Papers, runs, and artifacts live on disk. No database needed.
- **Streaming is critical.** The user must see progress during long phases. No dead silence.
- **Evidence standard.** Every claim must have a source quote with a paper ID. No unsourced assertions.
- **No ISOSpec in provider comparisons.** ISOSpec is the internal capability, not a customer-facing option.
- **Batch extraction.** Never send 30 papers to one job. Split into groups of 8 to 10.
- **Notion is the deliverable.** The recommendation page is the primary output. Chat gives a summary with link.

## Pricing Data Sources (verified March 2026)

Already captured in `references/pricing-data.md`:
- NIA Aging Research Biobank: $7.91 to $9.80 per vial
- Boston Medical Center: plasma $15/aliquot, serum $24/aliquot
- Lifelines Netherlands: EUR 4 to 19 per sample (volume dependent)
- EMBL Metabolomics Core: EUR 34 to 130 per sample
- Duke University: Biocrates MxP 500 $90 to $145 per sample + kit
- Biocrates kit: $100.50 per sample (NIEHS 2022 prices)
- ADNI data: free (DUA only)
- UK Biobank: GBP 9,000 for 3 years
- Metabolon: no public pricing (quote only)

## Sourcing Intelligence (validated March 2026)

Five sourcing edges, all tested:
1. Publications as hospital inventory prior (paper on 15 patients means the hospital has many more)
2. Failed clinical trial sample pools (1,100+ patient trials terminated, samples exist somewhere)
3. Trial sites as hospital map (89% of hospitals with AD/ALS infrastructure not found via publications alone)
4. Prior omics work as sample quality signal (fasting status, platform, QC, storage from methods sections)
5. Hospital profiles from public sources (publications + trials + biobank registries = complete dossier)

## Product Layers

Layer 1: **Discovery** — what cohorts/samples exist
Layer 2: **Fitness** — what makes them useful for YOUR specific question
Layer 3: **Platform match** — which analytical approach fits which samples
Layer 4: **Sourcing** — how to get access, from whom, timeline, cost

These layers apply to any query. The intelligence dimensions change based on the question (metabolomics cares about fasting and statin confounding; genomics cares about ancestry and sequencing depth).

## Environment Variables / Tokens

- `.notion-token` — Notion integration token for page delivery (optional, skip Notion if not set)
- `.openai-key` — OpenAI API key for semantic search embeddings (optional, falls back to TF-IDF keyword search)
- `ANTHROPIC_API_KEY` — for Claude Code CLI (uses Pro Max subscription if logged in via `claude login`)
- For Next.js production: set `ANTHROPIC_API_KEY` in environment for `@ai-sdk/anthropic`

## Agent Teams (recommended for full pipeline runs)

Claude Code has native agent teams (experimental, v2.1.32+). Unlike subagents which only report back, teammates communicate directly with each other through a shared task list.

Enable in `.claude/settings.json`:
```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

For a full vCRO run, tell Claude to create a team:
```
Create an agent team for this cohort intelligence query. Structure:
- Searcher: runs PubMed, EPMC, ClinicalTrials.gov searches and adaptive expansion
- Validator: classifies results as relevant/tangential/not relevant
- Extractor 1: reads papers 1-12, extracts intelligence dimensions with quotes
- Extractor 2: reads papers 13-24, shares findings with Extractor 1
- Analyst: synthesizes signal, maps access routes, compares providers
- Deliverer: assembles ranking and Notion recommendation from all outputs
```

Key advantages over subagents:
- Extractors share findings (e.g. "ADNI has 56% statin confounding") so the other extractor can flag related patterns
- Analyst gets compressed summaries directly from teammates instead of reading 100KB files
- You can message any teammate directly mid-run ("what have you found so far?")
- Shared task list means teammates self-coordinate

Use Shift+Down to cycle through teammates. For split pane view (see all output at once), use tmux or iTerm2.

Token cost is higher (each teammate is a separate Claude instance). Use agent teams for full pipeline runs, use simple subagents for quick focused tasks.

Architecture: each teammate loads the same CLAUDE.md, skills, and MCP servers. Communication via mailbox (message/broadcast). Shared task list with dependency tracking (extraction must complete before signal starts). Task claiming uses file locking to prevent races.

Hooks for quality gates:
- `TeammateIdle`: runs when teammate finishes. Exit code 2 sends feedback and keeps it working.
- `TaskCompleted`: runs when task marked complete. Exit code 2 prevents completion and sends feedback (e.g. "extraction missing source quotes, redo").

Plan approval: tell the lead to require plan approval for extractors. They plan in read-only mode, lead reviews, approves or rejects with feedback. Perfect for the tangential question gate.

Teams stored locally at `~/.claude/teams/` and `~/.claude/tasks/`. Always clean up via the lead, not teammates.

## Memory Architecture

Three layers, serving two modes:

### Development mode (you building and testing with Claude Code)

**CLAUDE.md (project memory):** loaded every session. Contains pipeline, tools, rules. Shared across all sessions. Already provided.

**Auto memory (learned preferences):** Claude Code saves notes when you correct it. Enable with `/memory enable` or say "remember this." Stored in `.claude/` directory. First 200 lines loaded every session. Use for: "always use Sonnet for extraction," "batch in groups of 8 not 10," "skip ISOSpec in provider comparisons."

**CLAUDE.local.md (personal preferences):** your personal overrides, not committed to git. Use for: Notion token paths, preferred model, local settings.

### Production mode (users interacting via the UI)

Users need session history and accumulated context. Claude Code does not provide this natively. Build it in the Next.js layer:

```
store/
├── users/
│   ├── user_abc/
│   │   ├── profile.json              # preferences, organization, what they care about
│   │   ├── memory.md                 # accumulated learnings about this user
│   │   └── sessions/
│   │       ├── 20260330_ad_metabolomics/
│   │       │   ├── request.json
│   │       │   ├── extracted_cohorts.json
│   │       │   └── recommendation.md
│   │       └── 20260331_ffpe_feasibility/
│   │           └── ...
```

**How it works:**

1. User sends a query
2. API route loads `users/{id}/memory.md` into the system prompt alongside CLAUDE.md
3. Memory contains: past queries, preferences, accumulated context ("User cares about statin confounding. Prefers longitudinal cohorts. Budget sensitive.")
4. Claude sees the memory and can reference past work: "Last time we looked at AD metabolomics and found ADNI as the top match. Are you following up on that?"
5. After each session, Claude writes a 3 to 5 line summary to memory.md
6. Previous run artifacts stay in `sessions/` for deep follow-ups

**memory.md format:**
```markdown
# User Memory — {user_name}

## Preferences
- Cares about statin confounding in metabolomics
- Prefers longitudinal cohorts with n > 100
- Budget sensitive, always asks about cost
- Organization: {company_name}, commercial use required

## Past Queries
- 2026-03-30: AD/ALS blood metabolomics → recommended ADNI, Michigan ALS
- 2026-03-31: FFPE metabolomics feasibility → confirmed feasible, recommended Panome Bio PoC

## Key Learnings
- User corrected: "do not include NMR platforms, we only use LC-MS"
- User prefers tables over bullet lists for cohort comparisons
- User wants pricing breakdown with every recommendation
```

**profile.json** stores structured data:
```json
{
  "user_id": "user_abc",
  "name": "...",
  "organization": "...",
  "commercial_use": true,
  "preferred_modalities": ["LC-MS", "GC-MS"],
  "excluded_providers": ["ISOSpec"],
  "budget_range": null,
  "created": "2026-03-30"
}
```

The filesystem IS the database. No Postgres, no Redis. For the first 100 users, file-based memory scales fine. Each user is a folder. Migrate to a database only if file I/O becomes a bottleneck.

## Model Assignment

When spawning agent teams, specify models explicitly:

```
Spawn the team:
- Lead: use Opus (coordinates, synthesizes, makes final decisions)
- Searcher: use Sonnet (runs scripts, decides expansion queries)
- Extractor 1: use Sonnet (reads papers, extracts intelligence with quotes)
- Extractor 2: use Sonnet (same as above)
- Analyst: use Opus (signal synthesis, ranking, cross-paper reasoning)
- Deliverer: use Sonnet (assembles markdown from existing artifacts)
```

**What needs no LLM at all (pure script execution):**
- PubMed/EPMC/CT.gov API calls
- PMID to PMC mapping
- PMC XML parsing and section splitting
- Store queries and semantic search
- Run state tracking
- Notion block conversion and posting

**Sonnet 4.6 — 80% of LLM work:**
- Expansion query decisions, validation, extraction, contacts, provider intel, access mapping, delivery assembly
- Pattern matching and structured extraction from scientific text

**Opus 4.6 — 20% of LLM work:**
- Request understanding (nuance in what user needs)
- Signal synthesis (cross-paper reasoning, replication assessment)
- Ranking (strategic judgment across multiple criteria)

**Never use Haiku for vCRO.** Scientific text extraction requires reading dense methods sections and producing exact quotes. Haiku would miss confounders and produce shallow implications.

## Getting Started

1. Unzip the migration bundle into the project root
2. Create the store directories: `mkdir -p store/sources/pmc store/sources/clinicaltrials store/cohorts store/runs store/index`
3. Open Claude Code in the project: `cd vcro && claude`
4. Test with: "What cohorts exist for AD blood metabolomics with longitudinal design and n in the hundreds?"
5. Claude reads CLAUDE.md, follows the pipeline, runs scripts, delivers results
6. Once satisfied, scaffold the Next.js app for the production UI
