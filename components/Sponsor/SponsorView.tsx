"use client";
import { useEffect, useRef, useState } from "react";
import type { Provider } from "@/lib/bundle";

type Phase = "idle" | "submitting" | "polling" | "ready" | "playing" | "done" | "error";

type Props = {
  /** Pre-built Seedance prompt (use buildSponsorPrompt). */
  prompt: string;
  /** The provider being sponsored — drives the title block + tagline. */
  provider: Provider;
  /** Display label for the assay being sourced. */
  assay: string;
  /** Optional pre-cached video URL — skips submit + poll, plays immediately. */
  cachedUrl?: string;
  /** Fires when the video finishes (or skip is pressed). Parent advances flow. */
  onDone?: () => void;
  /** Auto-start the request. Default true. Set false for a "tap to play" demo. */
  autoStart?: boolean;
};

export function SponsorView({
  prompt,
  provider,
  assay,
  cachedUrl,
  onDone,
  autoStart = true,
}: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(cachedUrl ?? null);
  const [costUsd, setCostUsd] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef<number>(0);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (cachedUrl) {
      setVideoUrl(cachedUrl);
      setPhase("ready");
      return;
    }
    if (autoStart) {
      void start();
    }
    return () => {
      if (pollTimer.current) clearTimeout(pollTimer.current);
      if (tickTimer.current) clearInterval(tickTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Elapsed-time ticker while we wait
  useEffect(() => {
    if (phase === "submitting" || phase === "polling") {
      if (!tickTimer.current) {
        startedAt.current = Date.now();
        tickTimer.current = setInterval(() => {
          setElapsed(Math.floor((Date.now() - startedAt.current) / 1000));
        }, 250);
      }
    } else if (tickTimer.current) {
      clearInterval(tickTimer.current);
      tickTimer.current = null;
    }
  }, [phase]);

  async function start() {
    setError(null);
    setPhase("submitting");
    try {
      const r = await fetch("/api/seedance/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt, duration: 10, resolution: "720p" }),
      });
      const data = await r.json();
      if (!r.ok || !data.task_id) {
        throw new Error(data?.error ?? `submit ${r.status}`);
      }
      setTaskId(data.task_id);
      setPhase("polling");
      poll(data.task_id);
    } catch (e: unknown) {
      setError((e as Error).message ?? String(e));
      setPhase("error");
    }
  }

  async function poll(id: string) {
    try {
      const r = await fetch(`/api/seedance/status?task_id=${encodeURIComponent(id)}`);
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error ?? `status ${r.status}`);

      if (typeof data.progress === "number") setProgress(data.progress);

      if (data.status === "completed" && data.url) {
        setVideoUrl(data.url);
        setCostUsd(data.cost_usd ?? null);
        setPhase("ready");
        return;
      }
      if (data.status === "failed" || data.status === "error") {
        throw new Error("seedance reported failure");
      }
      pollTimer.current = setTimeout(() => poll(id), 4000);
    } catch (e: unknown) {
      setError((e as Error).message ?? String(e));
      setPhase("error");
    }
  }

  const headline = `Sponsored by ${provider.name}`;
  const subline = providerSubline(provider, assay);

  return (
    <div className="sv-frame">
      <div className="sv-eyebrow mono">Sponsored pre-roll</div>
      <h2 className="sv-headline serif">{headline}</h2>
      <div className="sv-subline mono-sm">{subline}</div>

      <div className="sv-stage">
        {phase === "idle" && (
          <button className="sv-cta btn-p brand" onClick={start}>
            Generate sponsor video (~90s · $0.61)
          </button>
        )}

        {(phase === "submitting" || phase === "polling") && (
          <Loading
            phase={phase}
            elapsed={elapsed}
            progress={progress}
            taskId={taskId}
          />
        )}

        {phase === "error" && (
          <div className="sv-error">
            <div className="sv-error-h">Couldn't generate the pre-roll.</div>
            <div className="sv-error-msg mono-sm">{error}</div>
            <button className="sv-cta btn-p" onClick={start}>Retry</button>
            {onDone && (
              <button className="sv-skip" onClick={onDone}>Skip ad</button>
            )}
          </div>
        )}

        {(phase === "ready" || phase === "playing" || phase === "done") && videoUrl && (
          <Playback
            url={videoUrl}
            costUsd={costUsd}
            onPlay={() => setPhase("playing")}
            onEnded={() => {
              setPhase("done");
              onDone?.();
            }}
            onSkip={() => {
              setPhase("done");
              onDone?.();
            }}
          />
        )}
      </div>

      <details className="sv-prompt-toggle">
        <summary className="mono-sm">Show prompt sent to Seedance</summary>
        <pre className="sv-prompt">{prompt}</pre>
      </details>
    </div>
  );
}

function Loading({
  phase,
  elapsed,
  progress,
  taskId,
}: {
  phase: Phase;
  elapsed: number;
  progress: number;
  taskId: string | null;
}) {
  const pct = Math.max(2, Math.min(100, progress * 100));
  return (
    <div className="sv-loading">
      <div className="sv-loading-text">
        {phase === "submitting" ? "Queueing Seedance render…" : "Rendering 5-second clip…"}
      </div>
      <div className="sv-bar">
        <div className="sv-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="sv-loading-meta mono-sm">
        elapsed {elapsed}s · expect ~90s
        {taskId && <span> · task {taskId.slice(0, 12)}…</span>}
      </div>
    </div>
  );
}

function Playback({
  url,
  costUsd,
  onPlay,
  onEnded,
  onSkip,
}: {
  url: string;
  costUsd: number | null;
  onPlay: () => void;
  onEnded: () => void;
  onSkip: () => void;
}) {
  const [showSkip, setShowSkip] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShowSkip(true), 3000);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="sv-playback">
      <video
        className="sv-video"
        src={url}
        autoPlay
        muted
        playsInline
        onPlay={onPlay}
        onEnded={onEnded}
      />
      <div className="sv-playback-bar">
        {costUsd != null && (
          <span className="sv-cost mono-sm">render ${costUsd.toFixed(2)}</span>
        )}
        {showSkip && (
          <button className="sv-skip" onClick={onSkip}>Skip ad →</button>
        )}
      </div>
    </div>
  );
}

function providerSubline(p: Provider, assay: string): string {
  const country = p.country && p.country !== "—" ? p.country : null;
  const accred = p.accreditation && p.accreditation !== "—" ? p.accreditation : null;
  const parts = [assay];
  if (country) parts.push(country);
  if (accred) parts.push(accred);
  return parts.join(" · ");
}
