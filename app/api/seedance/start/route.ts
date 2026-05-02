import { NextResponse } from "next/server";
import { providersForAssay } from "@/lib/catalogs";
import { buildSponsorPrompt, buildEvidenceLine } from "@/components/Sponsor/buildPrompt";
import { findSponsorFixture } from "@/lib/seedance-fixtures";
import type { Provider } from "@/lib/bundle";

export const runtime = "nodejs";
export const maxDuration = 30;

const ENDPOINT = "https://api.imarouter.com/v1/videos";

type StartBody = {
  query: string;
  assays: { assay: string; family: string }[];
  duration?: number;
  /** Bypass the fixture cache and always render live. */
  force_live?: boolean;
};

/**
 * Pick the top sponsor for the parsed assays. Prefer a multi-assay clinical
 * CRO when the query spans 2+ assays (one CRO covers them all); otherwise
 * pick the highest-ranked provider for the first assay.
 */
function pickSponsor(
  assays: { assay: string; family: string }[],
): { provider: Provider; assay: string; family: string } | null {
  if (!assays.length) return null;
  if (assays.length >= 2) {
    for (const a of assays) {
      const cands = providersForAssay(a.assay);
      const cro = cands.find((p) => p.type === "service_cro");
      if (cro) return { provider: cro, assay: a.assay, family: a.family };
    }
  }
  for (const a of assays) {
    const cands = providersForAssay(a.assay);
    if (cands.length > 0) return { provider: cands[0], assay: a.assay, family: a.family };
  }
  return null;
}

export async function POST(req: Request) {
  const body = (await req.json()) as StartBody;
  if (!body.query || !Array.isArray(body.assays) || body.assays.length === 0) {
    return NextResponse.json({ error: "query and assays[] required" }, { status: 400 });
  }

  // 1. Cache-first: serve a cached fixture instantly when it matches.
  if (!body.force_live) {
    const fixture = findSponsorFixture({ query: body.query, assays: body.assays });
    if (fixture) {
      return NextResponse.json({
        task_id: fixture.task_id,
        status: "queued",
        sponsor: fixture.sponsor,
        assay: fixture.assay,
        family: fixture.family,
        fixture: fixture.id,
      });
    }
  }

  // 2. Fixtures-only mode: refuse to render live (offline demo).
  if (process.env.SEEDANCE_FIXTURES_ONLY === "1") {
    return NextResponse.json({ error: "no fixture matched and live disabled" }, { status: 404 });
  }

  // 3. Live render via imarouter.
  const key = process.env.IMAROUTER_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "IMAROUTER_API_KEY not set" }, { status: 503 });
  }

  const sel = pickSponsor(body.assays);
  if (!sel) {
    return NextResponse.json({ error: "no provider matched the assays", assays: body.assays }, { status: 404 });
  }

  const prompt = buildSponsorPrompt({
    query: body.query,
    assay: sel.assay,
    family: sel.family,
    provider: sel.provider,
    evidenceLine: buildEvidenceLine(sel.provider),
    duration: body.duration ?? 10,
  });

  const r = await fetch(ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "seedance-2.0-fast",
      prompt,
      duration: body.duration ?? 10,
      metadata: { resolution: "720p" },
    }),
  });
  const data = await r.json();
  if (!r.ok) {
    return NextResponse.json({ error: data?.error ?? "seedance submit failed", raw: data }, { status: r.status });
  }

  return NextResponse.json({
    task_id: data.task_id ?? data.id,
    status: data.status ?? "queued",
    sponsor: {
      name: sel.provider.name,
      country: sel.provider.country,
      type: sel.provider.type,
      url: sel.provider.url,
    },
    assay: sel.assay,
    family: sel.family,
    prompt_excerpt: prompt.slice(0, 160),
  });
}
