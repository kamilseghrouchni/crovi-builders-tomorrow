import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const ENDPOINT = "https://api.imarouter.com/v1/videos";

export async function POST(req: Request) {
  const key = process.env.IMAROUTER_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "IMAROUTER_API_KEY not set in .env.local" },
      { status: 503 },
    );
  }

  const { prompt, duration = 5, resolution = "720p" } = await req.json();
  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json({ error: "prompt required" }, { status: 400 });
  }

  const r = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "seedance-2.0-fast",
      prompt,
      duration,
      metadata: { resolution },
    }),
  });

  const data = await r.json();
  if (!r.ok) {
    return NextResponse.json({ error: data?.error ?? "seedance submit failed", raw: data }, { status: r.status });
  }
  return NextResponse.json({
    task_id: data.task_id ?? data.id,
    status: data.status ?? "queued",
    progress: data.progress ?? 0,
  });
}
