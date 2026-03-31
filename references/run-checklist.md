# vCRO Run Checklist

This is the mandatory checklist the main session follows during
every run. Every item must be done. No shortcuts.

## Phase 0: Understand
- [ ] Read request, extract what is stated vs implied
- [ ] Identify genuine gaps (max 2)
- [ ] If gaps: ask user ONE message. If none: proceed.
- [ ] Write request.json with scope_notes
- [ ] scope_notes must be specific enough to drive dimension selection downstream

## Phase 1: Notion + first message
- [ ] Create Notion page via notion_api.py --action create
- [ ] Save page_id to run_state.json
- [ ] Send user: "🔍 Searching for [indication] cohorts with [sample type]..." + Notion link
- [ ] Append to Notion activity log: natural narration of what we are looking for and why

## Phase 2: Search
- [ ] Spawn search subagent (Haiku)
- [ ] Task must include: initial queries + instruction to do adaptive expansion + recency sweep
- [ ] Cache dir must be the clean store
- [ ] On completion: read results, identify 2 to 3 named cohorts from titles
- [ ] Send user early nugget naming those cohorts: "Already seeing [X], [Y], and [Z]..."
- [ ] Append to Notion: narration with named cohorts and context
- [ ] Update run_state.json

## Phase 3: Validate (batched)
- [ ] Split results into batches of 30
- [ ] Spawn batch subagents in parallel (Sonnet)
- [ ] Each batch returns classifications with reasons
- [ ] Between batches or after all complete: send nugget naming a strong find
- [ ] Compile all batch results into validation_results.json
- [ ] If tangential items exist: format by theme (max 3 themes), ask user ONE question
- [ ] Wait for user response. Apply decision.
- [ ] NEVER auto-resolve tangential. NEVER set tangential_resolved=true without user input.
- [ ] Append to Notion: what matched, what was discarded and why (plain language, named cohorts)
- [ ] Update run_state.json

## Phase 4: PMID mapping + section fetch
- [ ] Run pmid_to_pmc.py on all relevant PMIDs (main session exec, fast)
- [ ] Run pmc_fetch.py in batches of 3 with 1.5s delay (main session exec)
- [ ] Log how many mapped, how many have full text
- [ ] No user message needed (fast phase, under 60 seconds)
- [ ] Update run_state.json

## Phase 5: Extract (scope-driven)
- [ ] Before spawning: scan relevant items, identify 2 to 3 named cohorts
- [ ] Send user nugget: "Diving into [X] and [Y] details now. Checking sample sizes, longitudinal structure, and what was actually measured. About 2 to 3 minutes."
- [ ] Spawn extraction subagent (Sonnet)
- [ ] Task MUST include:
  - scope_notes from request.json
  - Path to intelligence-dimensions.md reference
  - Instruction: "Pick 5 to 8 dimensions that matter for this brief. Extract with implications."
  - List of PMC directories and ClinicalTrials directories to read
  - Output path for extracted_cohorts.json
- [ ] On completion: read top cohorts, identify the strongest match
- [ ] Send user nugget naming the top find with a specific number: "ADNI has 1,517 participants with longitudinal plasma lipidomics. Looking strong for your request."
- [ ] Append to Notion: what the top cohorts look like, key numbers, implications
- [ ] Update run_state.json

## Phase 6: Contacts
- [ ] Spawn contacts subagent (Haiku) for top 5 cohorts
- [ ] Task includes PMC meta.json and access_and_ownership.txt paths
- [ ] On completion: note which have portals vs need PI contact
- [ ] No separate user message (folds into recommendation)
- [ ] Update run_state.json

## Phase 7: Provider intelligence
- [ ] Spawn provider intel subagent (Sonnet) IN PARALLEL with contacts
- [ ] Task includes: modality, indication, scope_notes
- [ ] Task references vcro-source SKILL.md
- [ ] On completion: save provider_intelligence.json to run folder
- [ ] Update run_state.json

## Phase 8: Signal extraction
- [ ] Spawn signal subagent (Sonnet) for top 5 cohort papers
- [ ] Task: read Results and Limitations sections, extract key findings, effect sizes, what worked, what did not, negative results
- [ ] Include scope_notes so signal focuses on what matters for this request
- [ ] On completion: save signal_summary.json to run folder
- [ ] Update run_state.json

## Phase 9: Assemble and deliver
- [ ] Run build_context_package.py (main session exec, fast)
- [ ] Read context package, extracted cohorts, contacts, provider intel, signal
- [ ] Compose the recommendation (main session, Opus reasoning):
  - For each top cohort: pick relevant intelligence dimensions based on scope_notes
  - Include exact quotes from section files (with PMC ID)
  - Include number breakdowns (headline vs usable)
  - Include implications for every fact
  - Include DOIs and portal links
  - Include access route with contact names
- [ ] Build Notion blocks with the full recommendation
- [ ] Append to Notion: full recommendation, access routes, provider landscape, provenance
- [ ] Append to Notion activity log: "Run complete" entry
- [ ] Send user the recommendation on Telegram/chat (condensed version, link to Notion for full detail)
- [ ] Update run_state.json: status=complete

## Anti-patterns (never do these during a run)
- Silence for more than 60 seconds
- Progress messages with counts but no named cohorts
- "Phase 2 complete" style updates
- Forgetting to update Notion before sending chat message
- Forgetting to include scope_notes in subagent tasks
- Running all 18 dimensions on every cohort
- Stating facts without implications
- Recommending by raw N instead of relevance to request
- Skipping provider intelligence or signal extraction
- Auto-resolving tangential results
- Running validation as one monolithic subagent
