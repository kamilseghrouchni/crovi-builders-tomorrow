# Conversational Canvas MVP

## Concept
Mutable canvas + chat rail. User talks → agent calls tools → tool outputs are layout primitives keyed by `(tool, filter_signature)` → canvas inserts / replaces / dims. Follow-up turns mutate the workspace, not pile onto it.

## What the LLM does (and doesn't)

The LLM has three jobs per turn:
1. Extract filters from natural language into tool args (the parse step lives inside the tool call, no separate parse pass).
2. Pick the right tool. New search → `query_specimens`. Evidence → `find_publications`. "Compare X vs Y" → `compare_institutes`. CTA → `open_request_form`. On follow-ups it emits a *delta* filter; server merges.
3. Narrate briefly in the chat rail.

The LLM does **not**: run SQL, compute groupings/totals/gaps, decide layout, generate UI, rank, aggregate, or fuzzy-match. All deterministic on the server.

## Stack
- Next.js 16 (App Router, Vercel-hosted)
- Vercel AI SDK v6 — `streamText` with tools
- `@ai-sdk/anthropic` — `claude-sonnet-4-6`
- `better-sqlite3` server-side (reads `data/specimens.db`)
- No assistant-ui — custom chat rail (~200 LOC) + custom canvas pane
- Prompt caching from day 1 (cache breakpoint after system prompt + tool defs)

## Mutation engine

LLM emits delta filters; server merges with the last filter for that tool in the conversation, then canonicalizes.

Canonicalization pipeline before hashing:
1. resolve synonyms via `data/enriched/synonyms.json` (`MM` → `multiple myeloma`, `BMMC` → `Bone marrow mononuclear cells (BMMCs)`, country aliases, specimen-type aliases)
2. lowercase string values, trim whitespace
3. sort object keys alphabetically; sort array values
4. JSON.stringify → SHA1 → first 12 hex chars

`slot_key = "${tool}:${hash}"`

Mutation rules:
- same key → **replace**
- new key → **insert** below most-recent
- prior-turn slots → **dim** (60% opacity, no shadow)
- click a dimmed slot → **pin** (exempt from dimming)
- one canvas, one focus chain, no tabs

## Focus chain
- Active = tool calls from the most recent assistant turn
- Background = slots from prior turns (dimmed)
- Pinned slots stay full-bright until manually unpinned

## Streaming render contract
- **tool-call-start** (Sonnet emits tool name + opening brace) → mount skeleton in slot predicted by tool name
- **tool-args streaming** → update `IntentEcho` chip strip in the rail; canvas keeps skeleton
- **tool-result** → hydrate slot
- Single re-key allowed if early slot prediction was wrong (slot moves, no duplicate)

## Tool palette
```
query_specimens(filters_delta, display_grouping?)
  -> { rows, institutes, totals, groupings: {by_country, by_specimen_type, by_treatment_status}, gaps }

find_publications(intent_hash)
  -> { papers, gaps }

compare_institutes(institute_ids[])
  -> ComparisonRows

open_request_form(prefill, scope: "audit_deeper" | "source_wider")
  -> RequestPayload
```

`query_specimens` returns institute-grain by default plus precomputed groupings the canvas projects from. "Group by country" passes `{display_grouping: "country"}` — same data, different projection, same slot key (replace).

Gaps are deterministic in tool returns, never a separate tool call.

## v1 primitives (4)
- `InstituteList` — ranked biobank cards, expandable in place
- `PublicationPanel` — evidence cards or honest "no curated evidence — commission?"
- `GapCard` — actionable dead-ends (dismiss / contact / commission)
- `RequestForm` — unified CTA, scope: `audit_deeper | source_wider`

If week 3 finishes early: harden v1 (loading/empty states, dim transitions). No half-ship of `DonorTimeline`, `SpecimenRows`, `IntentEcho`, `ComparisonRows` — those are explicit v2.

## Data prep
Outputs to `data/enriched/`:
- `orgs.json` — `organization_id` → name, country, website, contact_email, address, description (from `data/subset/org_profiles.json`)
- `publications.json` — flattened from 23 bundles' `academic_ground_truth.json`, tagged by `(indication, specimen_type)` for fuzzy lookup
- `synonyms.json` — ~150 entries covering 23 bundles' indication/specimen/anatomy vocab; living document
- `curated_queries.json` — 6 demo chips with explicit roles (below)
- FTS5 index + `donor_longitudinal` materialized view inside `data/enriched/views.db`

## Curated query coverage (6, all roles committed)

| Role | Query | Source bundle |
|---|---|---|
| happy-path | Melanoma FFPE with matched plasma at -80C, T4N0 or node-positive | `melanoma-high-grade-tissue-k2edta-plasma` |
| rich-publications | Grade 3 follicular lymphoma FFPE with matched serum or plasma | `lymphoma-ffpe-grade3-serum-matched` |
| thin-result → source_wider | Lung SCC liquid biopsy in Streck BCT tubes | `lung-scc-streck-bct-liquid-biopsy` (impossible) |
| multi-gap | Triple-negative breast cancer FFPE — ER- AND PR- by IHC, grade 3+ IDC | `tnbc-er-neg-pr-neg-ffpe` (hard) |
| longitudinal | Parkinson's patients age 75+ with serum + PBMC across multiple visits | `pd-age-over-75-serum-pbmc-dna` |
| follow-up-to-compare | Breast IDC FFPE with HER2 + ER + PR + Ki67 panel documented | `breast-idc-her2-er-pr-ki67-full-panel` |

## Curated vs open queries
- **Curated**: dense publications + pre-baked failure modes
- **Open**: DB-only; `find_publications` returns `{papers: [], gaps: ["no curated evidence"]}` → GapCard offers "commission a literature scan" → routes to RequestForm with `scope=source_wider`. No banner heuristic.

## Named follow-up acceptance tests (week 3)
1. "drop ones without contact emails" → `query_specimens` re-call, same logical key, replace
2. "group by country" → `display_grouping: "country"`, same key, replace
3. "only longitudinal donors" → filter delta, replace
4. "compare Mayo SPORE vs ProteoGenex" → new tool `compare_institutes`, new key, insert

## Aesthetics
Lift directly from `inspirations/crovi-spec/`:
- `tokens.css` → `styles/tokens.css`
- Type stack: Lustria (headings), IBM Plex Sans (body), Geist Mono (tool-call args)
- Tool-call card pattern from `phases.jsx`

## File structure
```
app/
  api/agent/route.ts           # streamText + tools
  page.tsx                     # landing: query input + curated chips
  workspace/page.tsx           # chat rail + canvas
components/
  ChatRail/                    # streaming text + tool-call cards
  Canvas/                      # slot registry + insert/replace/dim
  primitives/                  # 4 v1 layout primitives
  ui/                          # buttons, chips, badges
lib/
  db.ts                        # better-sqlite3 wrapper
  filters.ts                   # delta merge + canonicalization + hashing
  slots.ts                     # slot key generation
  tools/
    query_specimens.ts
    find_publications.ts
    compare_institutes.ts
    open_request_form.ts
  publications.ts              # match papers to filter intent
  synonyms.ts                  # synonym resolver
data/
  specimens.db                 # canonical (gitignored)
  enriched/                    # generated by scripts
    orgs.json
    publications.json
    synonyms.json
    curated_queries.json
    views.db
scripts/
  enrich_orgs.py
  build_publication_index.py
  build_synonyms.py
  build_curated_queries.py
  build_db_views.py
styles/
  tokens.css                   # adapted from inspirations
```

## Build order (3 weeks)

**Week 1 — data + agent loop**
1. Data prep scripts; verify with two example queries via CLI
2. Next.js scaffold + tokens.css
3. `/api/agent` with `streamText` + 4 v1 tools (Sonnet 4.6); console-test tool calls

**Week 2 — chat rail + canvas + primitives**
4. Custom chat rail (streaming text + tool-call cards)
5. Canvas pane: slot-key registry + insert/replace/dim
6. InstituteList, PublicationPanel, GapCard, RequestForm

**Week 3 — follow-ups + polish + demo**
7. Wire & test the 4 named follow-ups; tune mutation edge cases
8. End-to-end on 6 curated + 2 open queries
9. Harden v1 primitives (loading/empty/dim transitions)
10. Aesthetic pass

## Cost expectations
- ~$0.008–0.015 per turn warm (cache hit), $0.02–0.04 cold
- Demo session of 5–6 turns ≈ $0.05–0.08

## Out of scope
Live PubMed, auth, real CTA delivery (localStorage stub only), persistence beyond localStorage, mobile.
