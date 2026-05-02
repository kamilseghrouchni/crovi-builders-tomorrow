"use client";
import { useEffect, useState } from "react";

type Sponsor = {
  name: string;
  country?: string | null;
  url?: string | null;
};

type Props = {
  videoUrl: string;
  sponsor: Sponsor;
  assay: string;
  /** Auto-skip after N seconds even if video keeps going. Defaults to no auto-skip. */
  autoSkipAfterSeconds?: number;
  /** Min seconds before the Skip button appears. Defaults to 5. */
  skipAvailableAfter?: number;
  onClose: () => void;
};

export function SponsorOverlay({
  videoUrl,
  sponsor,
  assay,
  autoSkipAfterSeconds,
  skipAvailableAfter = 5,
  onClose,
}: Props) {
  const [elapsed, setElapsed] = useState(0);

  // Track elapsed seconds since mount
  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 200);
    return () => clearInterval(id);
  }, []);

  // Auto-close hard cap (defensive in case onEnded never fires)
  useEffect(() => {
    if (!autoSkipAfterSeconds) return;
    const t = setTimeout(onClose, autoSkipAfterSeconds * 1000);
    return () => clearTimeout(t);
  }, [autoSkipAfterSeconds, onClose]);

  const skipReady = elapsed >= skipAvailableAfter;
  const remaining = Math.max(0, skipAvailableAfter - elapsed);

  return (
    <div className="so-scrim" role="dialog" aria-modal="true">
      <div className="so-tag mono">
        Sponsored · {sponsor.name}
        {sponsor.country && sponsor.country !== "—" ? ` · ${sponsor.country}` : ""}
      </div>

      <div className="so-stage">
        <video
          className="so-video"
          src={videoUrl}
          autoPlay
          muted
          playsInline
          onEnded={onClose}
        />
      </div>

      <div className="so-foot">
        <div className="so-foot-line">
          <span className="so-foot-label mono-sm">Pre-roll for</span>
          <span className="so-foot-assay">{assay}</span>
        </div>
        <div className="so-foot-actions">
          {sponsor.url && (
            <a
              className="so-link mono-sm"
              href={sponsor.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Visit ↗
            </a>
          )}
          <button
            className="so-skip"
            onClick={onClose}
            disabled={!skipReady}
            aria-label={skipReady ? "Skip ad" : `Skip available in ${remaining}s`}
          >
            {skipReady ? "Skip ad →" : `Skip in ${remaining}s`}
          </button>
        </div>
      </div>
    </div>
  );
}
