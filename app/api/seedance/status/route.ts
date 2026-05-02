import { NextRequest, NextResponse } from "next/server";
import { fixtureUrlForTask } from "@/lib/seedance-fixtures";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const taskId = req.nextUrl.searchParams.get("task_id");
  if (!taskId) {
    return NextResponse.json({ error: "task_id required" }, { status: 400 });
  }

  // Cache short-circuit — fixtures registered in lib/seedance-fixtures.ts.
  if (taskId.startsWith("demo:")) {
    const url = fixtureUrlForTask(taskId);
    if (!url) {
      return NextResponse.json({ error: "unknown fixture" }, { status: 404 });
    }
    return NextResponse.json({
      task_id: taskId,
      status: "completed",
      progress: 1,
      url,
      cost_usd: 0,
    });
  }

  const key = process.env.IMAROUTER_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "IMAROUTER_API_KEY not set" }, { status: 503 });
  }

  const r = await fetch(`https://api.imarouter.com/v1/videos/${taskId}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  const data = await r.json();
  if (!r.ok) {
    return NextResponse.json({ error: data?.error ?? "status fetch failed", raw: data }, { status: r.status });
  }

  const url =
    data?.metadata?.url ??
    data?.results?.find((res: any) => res?.content_type === "video")?.url ??
    null;

  return NextResponse.json({
    task_id: taskId,
    status: data.status ?? "running",
    progress: data.progress ?? 0,
    url,
    cost_usd: data.amount_usd ?? null,
  });
}
