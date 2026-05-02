# Video generation — sponsor pre-roll + kickoff brief

## What this branch adds

Two videos run during a sourcing flow.

The first is a **10-second sponsor pre-roll** played over the results page while
the user reviews their cohort — a commercial for the analytical platform that
best fits the parsed assays. For an EPIC methylation query the system picks a
real provider from our 102-record catalog (AnchorDx, NanoString, Olink,
Eurofins, etc.) and renders an ad covering accreditation, trial validation, and
product capabilities.

The second is a **15-second kickoff brief**, generated after the user finalizes
a bundle (samples + provider choices). It summarizes who is sending what to
whom: sample counts, contributing institutes, assays to run, the receiving
provider. This brief is the dispatch document, replacing a text PDF with
something the receiving lab actually opens and watches.

The first turns wait time into provider discovery; the second turns dispatch
into a moving handshake.

---

## How it works

### Cache-first with live fallback

`lib/seedance-fixtures.ts` declares two cached videos with match logic:

| Fixture | Trigger | mp4 |
|---|---|---|
| `anchordx-commercial` (10s sponsor) | any Epigenomics-family assay detected | `public/sponsor-demos/anchordx-commercial.mp4` |
| `eurofins-methylation-rnaseq` (15s kickoff) | Eurofins is selected provider OR (methylation + RNA-seq combo in bundle) | `public/sponsor-demos/eurofins-kickoff.mp4` |

When `/api/seedance/start` (sponsor) or `/api/seedance/kickoff` (brief) is hit:
1. Check the fixture registry → if matched, return a synthetic `task_id` of
   the form `demo:<id>` and the response shape mirrors a real render.
2. `/api/seedance/status` recognises `demo:*` task IDs and returns the public
   mp4 URL with `status: completed` immediately.
3. If no fixture matches and `SEEDANCE_FIXTURES_ONLY` is unset, the route hits
   imarouter live — ~90s render, ~$0.61 (10s) or ~$1.82 (15s).

### Demo path that hits both caches

Query: **"Breast cancer FFPE for DNA methylation and bulk RNA sequencing"**

```
1. parse detects   → Methylation EPIC + Bulk RNA-seq
2. search starts   → /api/seedance/start  → AnchorDx fixture (instant)
3. results render  → SponsorOverlay plays AnchorDx 10s
4. Build bundle    → user picks Eurofins as provider
5. Launch agent    → /api/seedance/kickoff → Eurofins fixture (instant)
6. KickoffOverlay plays Eurofins 15s
7. HandoffModal    → identity + dispatch
```

### Modes

| Setting | Behavior |
|---|---|
| (default) | Cache-first; live fallback for unknown matches |
| `SEEDANCE_FIXTURES_ONLY=1` | Cache only; refuse live (offline demo) |
| `force_live: true` in body | Bypass cache for that one request |

---

## File map

```
app/api/seedance/
  start/route.ts     POST — sponsor pre-roll (cache-first, live fallback)
  kickoff/route.ts   POST — kickoff brief (cache-first, live fallback)
  status/route.ts    GET  — handles demo:* fixtures + live polling
  submit/route.ts    POST — raw passthrough used by /sponsor-preview sandbox

components/Sponsor/
  SponsorView.tsx       full-featured player used in /sponsor-preview
  SponsorOverlay.tsx    YouTube-style fullscreen overlay for the search flow
  KickoffOverlay.tsx    same chrome, with loading state for the bundle flow
  buildPrompt.ts        commercial-style prompts per assay-family + provider

lib/
  seedance-fixtures.ts  cache registry + match logic

app/sponsor-preview/page.tsx   standalone sandbox — pick query/provider, render

public/sponsor-demos/
  anchordx-commercial.mp4   2.9 MB — 10s sponsor pre-roll
  eurofins-kickoff.mp4      7.7 MB — 15s kickoff brief

scripts/seedance_smoke.py    CLI smoke test — single submit + poll + save
```

---

## Wired in

- `app/workspace/page.tsx` — kicks off `/api/seedance/start` at search start,
  polls in background, mounts `SponsorOverlay` over results once both ready.
- `app/workspace/bundle/page.tsx` — clicking "Launch agent →" mounts
  `KickoffOverlay`, which runs the kickoff render then chains into the existing
  `HandoffModal` flow on close.

---

## Costs (live tier)

`seedance-2.0-fast`, 720p (1080p not supported on fast tier):

| Duration | Render time | Cost |
|---|---|---|
| 5s  | ~90s  | $0.61 |
| 10s | ~90s  | $1.21 |
| 15s | ~135s | $1.82 |

Duration cap is 4–15s on fast tier.

---

## API surface

`POST /api/seedance/start` — sponsor pre-roll
```jsonc
{
  "query": "…",
  "assays": [{ "assay": "Methylation array (EPIC)", "family": "Epigenomics" }],
  "duration": 10,        // optional, default 10
  "force_live": false    // optional
}
```

`POST /api/seedance/kickoff` — bundle dispatch brief
```jsonc
{
  "query": "…",
  "assays": ["Methylation array (EPIC)", "Bulk RNA sequencing"],
  "provider_name": "Eurofins Genomics + Biopharma",
  "provider_country": "LU",
  "n_specimens": 1800,
  "n_donors": 1000,
  "n_institutes": 2,
  "institute_names": ["Lyon Cancer Center", "Mayo Clinic"],
  "duration": 15,        // optional, default 15
  "force_live": false
}
```

`GET /api/seedance/status?task_id=…` — poll for `{ status, progress, url, cost_usd }`.

Both endpoints return `{ task_id, ...metadata }` where `task_id` may be either
a real imarouter ID or `demo:<fixture_id>`. The status route abstracts the
difference.

---

## Adding a new fixture

1. Generate the mp4 via `scripts/seedance_smoke.py` or the `/sponsor-preview`
   sandbox (saves to `data/seedance-samples/`).
2. Copy into `public/sponsor-demos/<name>.mp4`.
3. Append a fixture entry to either `SPONSOR_FIXTURES` or `KICKOFF_FIXTURES`
   in `lib/seedance-fixtures.ts` with its match function.
4. The routes pick it up automatically.

---

## Source of the prototype

Original Seedance smoke test was prototyped in the `crovi-mvp-hack` worktree
on 2026-05-02. See `SEEDANCE_HANDOVER.md` for the original handover doc that
seeded this branch's plan.
