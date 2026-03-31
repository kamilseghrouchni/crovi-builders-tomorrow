# Run State Tracking

`run_state.json` is a progress ledger and crash recovery tool.
It records what happened — it does not drive orchestration.
The orchestrator (vcro-os skill or webapp backend) owns the sequence.

If a run is interrupted, a new session reads `run_state.json` to see
which phases completed and resumes from the first incomplete one.

## Schema

```json
{
  "run_id": "20260328_cfdna_v4",
  "phase": "validate",
  "phase_status": "complete",
  "started_at": "2026-03-28T20:00:00Z",
  "phases": {
    "understand": {"status": "complete", "completed_at": "..."},
    "notion_create": {"status": "complete", "page_id": "...", "url": "..."},
    "search": {"status": "complete", "subagent_key": "...", "results": {"pubmed": 30, "epmc": 42, "ct": 15}},
    "validate": {"status": "complete", "relevant": 16, "tangential": 10, "discarded": 55},
    "tangential_question": {"status": "skipped" | "asked" | "resolved", "user_decision": "strict"},
    "pmid_mapping": {"status": "complete", "mapped": 14, "missing": 2},
    "pmc_fetch": {"status": "complete", "fetched": 6},
    "extract": {"status": "pending", "subagent_key": null},
    "contacts": {"status": "pending"},
    "provider": {"status": "pending"},
    "context_package": {"status": "pending"},
    "notion_update": {"status": "pending"},
    "deliver": {"status": "pending"}
  }
}
```

## Rules

- Write run_state.json after EVERY phase completes
- On session start, if a run_state.json exists, read it and resume
  from the first "pending" phase
- Never re-run a "complete" phase unless explicitly asked
- If a phase has status "running" and the subagent is gone, mark
  it as "failed" and retry
