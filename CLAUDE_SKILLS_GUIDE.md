# Claude Skills Guide — Key Rules for vCRO Migration

Extracted from "The Complete Guide to Building Skills for Claude" (Anthropic, Jan 2026)

## Skill Structure

A skill is a folder with instruction files that teach Claude how to handle specific tasks.

### Required file: CLAUDE.md
- Place at project root
- Claude reads this automatically as project context
- Contains: system prompt, project structure, key rules

### Skill files
- Plain markdown files in the project
- Claude reads them when referenced or when the task matches
- No special format required, just clear instructions

## Key Patterns

### 1. Tools as bash commands
Claude Code has native bash/exec. Python scripts become tools:
```
# In your CLAUDE.md or skill file:
To search PubMed, run:
python3 scripts/pubmed_api.py --queries "..." --retmax 20

To query extracted data, run:
python3 scripts/store_query.py extracted_cohorts.json --search "statin"
```

### 2. Multi-step workflows
Use `stopWhen` and step counting for agent loops.
Claude Code handles tool calling loops automatically.
Each tool call is visible in the stream.

### 3. File-based state
Skills work with files on disk. Write JSON artifacts.
Use filesystem as the IPC mechanism between phases.

### 4. Streaming and visibility
With Vercel AI SDK:
- `streamText` streams token by token
- Data parts stream arbitrary typed data
- `useChat` hook consumes streams in React
- Tool invocations are visible to the frontend

## Adapting OpenClaw Skills to Claude Code

### What changes:
1. **SKILL.md files** → become reference docs Claude reads when needed
2. **Subagent spawning** → becomes multi-step tool calling loops
3. **Model selection** → Claude Code uses your Pro Max subscription model
4. **Progress messaging** → becomes streamed data parts to frontend
5. **Notion delivery** → same script, called via bash tool
6. **run_state.py** → same script, called via bash tool

### What stays the same:
1. All Python scripts (pure stdlib, no dependencies)
2. All reference docs (intelligence dimensions, pricing data)
3. All skill instructions (just rename SKILL.md to descriptive names)
4. Store structure (filesystem-based, same paths)
5. JSON schemas (extracted_cohorts, signal_summary, etc.)

## Project Layout for Claude Code

```
vcro/
├── CLAUDE.md                    # System prompt (was vcro-os SKILL)
├── skills/                      # Instruction docs
│   ├── vcro-understand.md
│   ├── vcro-cohort-map.md
│   ├── vcro-validate.md
│   ├── vcro-signal.md
│   ├── vcro-contacts.md
│   ├── vcro-source.md
│   ├── vcro-access.md
│   ├── vcro-rank.md
│   ├── vcro-deliver.md
│   └── vcro-pricing.md
├── scripts/                     # Bash-callable Python tools
│   ├── pubmed_api.py
│   ├── europepmc_api.py
│   ├── clinicaltrials_api.py
│   ├── pmc_fetch.py
│   ├── pmid_to_pmc.py
│   ├── store_query.py
│   ├── store_search.py
│   ├── md_to_notion.py
│   └── run_state.py
├── references/                  # Domain knowledge
│   ├── intelligence-dimensions.md
│   ├── pricing-data.md
│   ├── context-package-schema.md
│   └── run-checklist.md
└── store/                       # Runtime data
    ├── sources/
    │   ├── pmc/
    │   └── clinicaltrials/
    ├── cohorts/
    ├── runs/
    └── index/
```

## For Vercel AI SDK Integration

Your Next.js API route acts as the orchestrator:
1. Receives user query
2. Calls Anthropic API via AI SDK `streamText`
3. Claude reads CLAUDE.md, follows skill instructions
4. Each tool call (script execution) streams to frontend
5. Frontend renders progress via `useChat` hook
6. Final output: Notion page + chat summary

The skill files become the system prompt context.
The scripts become the tools.
The store is the filesystem state.
