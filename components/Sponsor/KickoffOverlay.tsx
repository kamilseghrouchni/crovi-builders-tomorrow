"use client";
import { useEffect, useState } from "react";

type Pitch = {
  provider_name: string | null;
  provider_country?: string | null;
  assays: string[];
  n_specimens: number;
  n_donors: number;
  n_institutes: number;
};

type Phase = "starting" | "polling" | "playing" | "done" | "error";

type Props = {
  query: string;
  pitch: Pitch;
  /** When true, fires a live render even if a fixture would match. */
  forceLive?: boolean;
  onClose: () => void;
};

/**
 * Plays the kickoff brief video sent to the chosen provider + institutes.
 * Owns its own submit + poll cycle so the bundle page just hands it the
 * pitch and unmounts when the user moves on.
 */
export function KickoffOverlay({ query, pitch, forceLive, onClose }: Props) {
  const [phase, setPhase] = useState<Phase>("starting");
  const [taskId, setTaskId] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const tick = setInterval(() => setElapsed((s) => s + 1), 1000);

    (async () => {
      try {
        const r = await fetch("/api/seedance/kickoff", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            query,
            assays: pitch.assays,
            provider_name: pitch.provider_name,
            provider_country: pitch.provider_country ?? null,
            n_specimens: pitch.n_specimens,
            n_donors: pitch.n_donors,
            n_institutes: pitch.n_institutes,
            duration: 15,
            force_live: !!forceLive,
          }),
        });
        const d = await r.json();
        if (cancelled) return;
        if (!r.ok || !d.task_id) {
          throw new Error(d?.error ?? `kickoff submit ${r.status}`);
        }
        setTaskId(d.task_id);
        setPhase("polling");

        // poll
        const poll = async () => {
          if (cancelled) return;
          const ps = await fetch(`/api/seedance/status?task_id=${encodeURIComponent(d.task_id)}`);
          const pd = await ps.json();
          if (cancelled) return;
          if (pd.status === "completed" && pd.url) {
            setVideoUrl(pd.url);
            setPhase("playing");
            return;
          }
          if (pd.status === "failed" || pd.status === "error") {
            throw new Error(pd.error ?? "render failed");
          }
          setTimeout(poll, 4000);
        };
        poll();
      } catch (e: unknown) {
        if (cancelled) return;
        setError((e as Error).message);
        setPhase("error");
      }
    })();

    return () => {
      cancelled = true;
      clearInterval(tick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const subline = [
    `${pitch.n_specimens.toLocaleString()} specimens`,
    `${pitch.n_donors.toLocaleString()} donors`,
    `${pitch.n_institutes} institute${pitch.n_institutes === 1 ? "" : "s"}`,
  ].join(" · ");

  return (
    <div className="ko-scrim" role="dialog" aria-modal="true">
      <div className="ko-tag mono">
        Brief preview · {pitch.provider_name ?? "provider"}
        {pitch.provider_country && pitch.provider_country !== "—" ? ` · ${pitch.provider_country}` : ""}
      </div>

      <div className="ko-stage">
        {phase === "starting" || phase === "polling" ? (
          <div className="ko-loading">
            <div className="ko-loading-h serif">Composing your brief video</div>
            <div className="ko-loading-sub">
              This is the kickoff that goes to <em>{pitch.provider_name}</em> and the contributing institutes.
            </div>
            <div className="ko-bar"><div className="ko-bar-fill" /></div>
            <div className="ko-loading-meta mono-sm">
              elapsed {elapsed}s · {phase === "starting" ? "queueing render…" : "rendering 15-second clip…"}
              {taskId && <span> · task {taskId.slice(0, 14)}…</span>}
            </div>
          </div>
        ) : phase === "error" ? (
          <div className="ko-loading">
            <div className="ko-loading-h serif">Couldn't render the brief.</div>
            <div className="ko-loading-sub mono-sm">{error}</div>
            <button className="so-skip" onClick={onClose}>Continue without preview</button>
          </div>
        ) : (
          videoUrl && (
            <video
              className="ko-video"
              src={videoUrl}
              autoPlay
              muted
              playsInline
              onEnded={() => {
                setPhase("done");
                onClose();
              }}
            />
          )
        )}
      </div>

      <div className="so-foot">
        <div className="so-foot-line">
          <span className="so-foot-label mono-sm">Brief for</span>
          <span className="so-foot-assay">{pitch.provider_name ?? "provider"}</span>
          <span className="so-foot-label mono-sm" style={{ marginLeft: 12 }}>{subline}</span>
        </div>
        <div className="so-foot-actions">
          <button className="so-skip" onClick={onClose}>
            {phase === "playing" ? "Skip preview →" : "Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}
