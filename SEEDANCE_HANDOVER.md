# Seedance handover — sponsor pre-roll video

Origin: prototyped in `crovi-mvp-hack` on 2026-05-02. This doc carries the work
into `vcro-mvp-biobanks` so the next session can wire the video into the
existing `Running` → `Outcome` flow.

---

## What this is

Generate a ~5s "sponsored by X" pre-roll video, tailored to the user's query,
that plays **after the search completes and before the results unlock**. The
"sponsor" is the top-ranked candidate (biobank / hospital / platform) the
agent surfaced. The video makes the wait feel intentional and adds a memorable
hackathon moment.

Hackathon constraint: Seedance model must be used. We're using it via the
imarouter gateway.

---

## API surface (verified by smoke test)

| Aspect | Value |
| --- | --- |
| Endpoint (submit) | `POST https://api.imarouter.com/v1/videos` |
| Endpoint (poll) | `GET https://api.imarouter.com/v1/videos/{task_id}` |
| Auth | `Authorization: Bearer $IMAROUTER_API_KEY` |
| Model | `seedance-2.0-fast` |
| Body knobs | `prompt`, `duration` (s), `metadata.resolution` (`720p`) |
| Response (submit) | `{ id, task_id, status: "", progress: 0, ... }` |
| Response (poll, complete) | adds `results: [{ content_type: "video", url }]`, `metadata.url`, `amount_usd`, `usage` |
| Async? | Yes. Submit returns task_id immediately; poll until `status="completed"` |
| Latency | ~86s end-to-end for 5s @ 720p |
| Cost | **$0.60984 per 5s/720p clip** (returned in `amount_usd`) |
| Output | mp4, ~3 MB, presigned URL (expires in 24h) |

Full smoke-test log lives in `crovi-mvp-hack/data/seedance-tests/20260502T171637Z.log.json`.

---

## Auth / where the key lives

The key is stored in **`.env.local`** (gitignored — see `.gitignore`):

```
IMAROUTER_API_KEY=sk-...
```

`.env.example` documents the var. If `.env.local` is missing, the user can
paste the key from their hackathon account at imarouter.com — there's nothing
machine-specific about it.

For Next.js routes, read it via `process.env.IMAROUTER_API_KEY` (server-side
only — never expose to the client).

---

## Quick verify (run this first to confirm key works)

```bash
cd vcro-mvp-biobanks
python3 scripts/seedance_smoke.py
```

Expected: ~90s wait, then an mp4 saved under `/tmp/seedance-tests/`. Cost
~$0.61. Custom prompt:

```bash
python3 scripts/seedance_smoke.py --prompt "Documentary style: clinical biobank in Lyon, France, freezer racks, sample tubes, warm lighting" --duration 5
```

---

## The integration plan (not yet built)

### Where it slots in the flow

The app today has these phases (see `app/workspace/page.tsx`):

1. `LandingForm` — user enters query.
2. `Understand` — clarification step.
3. `Running` (`components/Running/RunningView.tsx`) — agent search loop.
4. `Outcome` (`components/Outcome/RankedList.tsx` etc.) — results revealed.

**Insertion point: between `Running` (terminal "search done") and the moment
`Outcome` mounts.** New phase: `Sponsor`. Plays the pre-roll, then advances
to `Outcome`.

### Trigger timing (the timing puzzle)

Video gen is ~86s. Search is faster (10–30s typical). So:

- **Option A (simpler, matches user's intent):** kick off video generation
  the moment search completes. Show "Sponsored message loading…" with the
  candidate name + a progress UI. When task hits `completed`, play the 5s
  clip, then unlock results. **User waits ~90s after search.**
- **Option B (faster perceived):** kick off video gen at query-submit time
  (in parallel with search), using the *query* (not the result) for prompt
  synthesis — the ad becomes about the *space* the user is sourcing in, not
  the specific winner. By the time search ends, video is ready or close.
  Lower personalization, much shorter wait.

User picked Option A in conversation — but flag the wait honestly. For the
demo, **pre-cache one canned video** for the planned demo query so judges
see instant playback (live-generate only for off-script queries).

### What goes into the prompt

The "sponsor" is whichever entity ends up at the top of `RankedList`. We
have these fields per candidate (see `data/butterbase-batches/hospitals_*.json`
in `crovi-mvp-hack`, mirrored / queryable in this repo's data layer):

- `provider_name`, `state`, `region`
- `category` (`amc` / community), `final_tier`, `bed_tier`, `funding_tier`
- `beds`, `total_nih_matched`, `nih_hosp_award`
- `biobank_signal_count` + signals (CTSA / NCORP / NCI cancer center / NIH biorepo grants)
- For some: a cohort-probe markdown (e.g. EvergreenHealth COVID story)

The video prompt template (draft, not finalized — Step 3 in the original
todo list):

```
Cinematic 5-second sponsor reel, documentary style.
Subject: {provider_name} in {city}, {state} — {category} ({tier} tier).
Visuals: {modality_visuals_for_query}, freezer racks, sample tubes,
clinical interior, warm professional tone.
Tagline overlay: "Sourced for {query.condition} — {biobank_signal_count}
network signals."
```

`{modality_visuals_for_query}` is a small lookup (e.g. ctDNA → centrifuge +
plasma vials; tissue → frozen blocks; whole-blood → tube racks).

**No CRO and no assay catalog exists in this repo yet.** Plan B is to keep
the sponsor as the hospital/biobank itself. If you want CRO/assay framing,
seed `data/sponsors/sponsors.json` with 5–10 demo entries first.

### Suggested file layout

```
app/api/seedance/
  submit/route.ts      # POST: takes prompt, returns { task_id }
  status/route.ts      # GET: { task_id } -> { status, progress, url? }
components/Sponsor/
  SponsorView.tsx      # the loading + playback UI
  buildPrompt.ts       # candidate + query -> prompt string
scripts/
  seedance_smoke.py    # already added
  seedance_precache.py # TODO: pre-generate canned demo videos
```

### Integration sketch (server-side)

```ts
// app/api/seedance/submit/route.ts
export async function POST(req: Request) {
  const { prompt, duration = 5 } = await req.json();
  const r = await fetch("https://api.imarouter.com/v1/videos", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.IMAROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "seedance-2.0-fast",
      prompt,
      duration,
      metadata: { resolution: "720p" },
    }),
  });
  const data = await r.json();
  return Response.json({ task_id: data.task_id });
}
```

The status route polls; the client polls `/api/seedance/status?task_id=...`
every ~5s. Return the `results[0].url` once `status === "completed"`. Pipe
that into a `<video autoplay muted playsInline>` tag.

---

## Open decisions for the next session

1. **Sponsor content source.** Hospital-as-sponsor (data we have) vs. seed a
   tiny CRO/assay catalog (synthetic, demo-only).
2. **Pre-cache strategy.** One canned demo video per planned query? Or live
   every time? Recommend: pre-cache the demo path, live for off-script.
3. **Skip button.** Add a "Skip ad" after 3s for politeness, or force the
   full 5s for the bit?
4. **Prompt template freeze.** Decide visual vocabulary per modality
   (ctDNA / tissue / plasma / WGS) and per region (US / EU / APAC).
5. **Cost guardrail.** Where does the budget cap live? Per-session counter?
   Per-day env var? At $0.61/clip, 100 demos = $61.

---

## Where the original prototype work lives

- Smoke-test script: `crovi-mvp-hack/scripts/seedance_smoke.py`
- Smoke-test artifacts: `crovi-mvp-hack/data/seedance-tests/20260502T171637Z.{mp4,log.json}`
- Conversation context: this handover was triggered after the 2026-05-02
  smoke test confirmed the API surface. No code in `vcro-mvp-biobanks` has
  been wired up yet — only the script + env entry + this doc.

---

## Status of original todo list

- [x] Smoke-test Seedance API — confirmed 200, async, ~86s, $0.61
- [x] Inspect response shape — see table above
- [ ] Draft bundle-tutorial prompt template — superseded by the sponsor
      pre-roll concept; see "What goes into the prompt" above
- [ ] Pick MVP integration point — chosen: between `Running` and `Outcome`,
      new `Sponsor` phase
