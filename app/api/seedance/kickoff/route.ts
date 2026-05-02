import { NextResponse } from "next/server";
import { findKickoffFixture } from "@/lib/seedance-fixtures";

export const runtime = "nodejs";
export const maxDuration = 30;

const ENDPOINT = "https://api.imarouter.com/v1/videos";

type KickoffBody = {
  query: string;
  assays: string[];                 // names of assays in the bundle
  provider_name: string | null;     // top-selected provider for primary assay
  provider_country?: string | null;
  n_specimens: number;
  n_donors: number;
  n_institutes: number;
  institute_names?: string[];
  duration?: number;                // 4–15 on fast tier
  force_live?: boolean;
};

function buildKickoffPrompt(b: KickoffBody): string {
  const dur = Math.min(15, Math.max(8, b.duration ?? 15));
  const assayLine = b.assays.slice(0, 2).join(" + ");
  const insts = b.institute_names?.slice(0, 3).join(", ") ?? `${b.n_institutes} institutes`;
  const provider = b.provider_name ?? "the selected provider";
  const country = b.provider_country ?? "";
  return [
    `Polished ${dur}-second sourcing brief in the style of a high-end biotech kickoff video.`,
    `Subject: ${b.query} — ${b.n_specimens.toLocaleString()} specimens from ${b.n_donors.toLocaleString()} donors, sourced for ${provider}${country ? ` in ${country}` : ""}.`,
    "Pacing: 3 cuts at 5s each, smooth steady motion, modern cinematic score, sans-serif kinetic typography in clean white.",
    `Scene 1 (0-5s): SAMPLE PROVENANCE. Wide aerial drone shot transitioning between hospital exteriors — ${insts}. Subtle world-map overlay connecting them. On-screen text: "${b.n_specimens.toLocaleString()} SPECIMENS · ${b.n_donors.toLocaleString()} DONORS · ${b.n_institutes} INSTITUTES".`,
    `Scene 2 (5-10s): ASSAYS TO RUN. Macro shot of FFPE tissue blocks, cross-cut to BeadChip slide and Illumina flow cell, robotic pipettors. On-screen text cycles: "${b.assays.slice(0, 3).map((a) => a.toUpperCase()).join('" then "')}".`,
    `Scene 3 (10-${dur}s): PROVIDER CLOSE. Smooth dolly through a clean modern laboratory, scientists at instruments. Brand close card: serif headline "Sent to ${provider}", subline "${assayLine.toUpperCase()} · CAP/CLIA · KICK-OFF".`,
    "Look: warm clinical, slight teal-orange grade, anamorphic lens flares, premium briefing video. No narration, music-led.",
  ].join(" ");
}

export async function POST(req: Request) {
  const body = (await req.json()) as KickoffBody;
  if (!body.query || !Array.isArray(body.assays) || body.assays.length === 0) {
    return NextResponse.json({ error: "query and assays[] required" }, { status: 400 });
  }

  // 1. Cache-first
  if (!body.force_live) {
    const fixture = findKickoffFixture({
      provider_name: body.provider_name,
      assays: body.assays,
      n_specimens: body.n_specimens,
      n_donors: body.n_donors,
      n_institutes: body.n_institutes,
    });
    if (fixture) {
      return NextResponse.json({
        task_id: fixture.task_id,
        status: "queued",
        pitch: fixture.pitch,
        fixture: fixture.id,
      });
    }
  }

  // 2. Fixtures-only mode (offline demo)
  if (process.env.SEEDANCE_FIXTURES_ONLY === "1") {
    return NextResponse.json({ error: "no kickoff fixture matched and live disabled" }, { status: 404 });
  }

  // 3. Live render
  const key = process.env.IMAROUTER_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "IMAROUTER_API_KEY not set" }, { status: 503 });
  }

  const prompt = buildKickoffPrompt(body);
  const r = await fetch(ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "seedance-2.0-fast",
      prompt,
      duration: body.duration ?? 15,
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
    pitch: {
      provider_name: body.provider_name,
      provider_country: body.provider_country ?? null,
      assays: body.assays,
      n_specimens: body.n_specimens,
      n_donors: body.n_donors,
      n_institutes: body.n_institutes,
    },
    prompt_excerpt: prompt.slice(0, 160),
  });
}
