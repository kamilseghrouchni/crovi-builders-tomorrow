"use client";
import { useEffect, useMemo, useState } from "react";
import { SponsorView } from "@/components/Sponsor/SponsorView";
import { buildSponsorPrompt, buildEvidenceLine } from "@/components/Sponsor/buildPrompt";
import type { AssayChoice, Provider } from "@/lib/bundle";

const SAMPLE_QUERIES = [
  "Breast cancer FFPE for DNA methylation and bulk RNA sequencing",
  "Pediatric brain tumor methylation classification",
  "Plasma metabolomics for Alzheimer biomarker discovery",
  "Liquid biopsy ctDNA monitoring in colorectal cancer",
  "PBMC immune profiling for autoimmune disease",
];

export default function SponsorPreviewPage() {
  const [query, setQuery] = useState<string>(SAMPLE_QUERIES[0]);
  const [assays, setAssays] = useState<AssayChoice[]>([]);
  const [selectedAssay, setSelectedAssay] = useState<string | null>(null);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [generationKey, setGenerationKey] = useState<number>(0);
  const [running, setRunning] = useState(false);

  // Resolve assays for the query (uses parse → providers chain)
  async function resolve() {
    setAssays([]);
    setSelectedAssay(null);
    setSelectedProviderId(null);
    // 1. parse the query to detect assays
    const pr = await fetch("/api/parse", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query }),
    }).then((r) => r.json());
    const detected: { assay: string; family: string }[] = pr.assays ?? [];
    if (!detected.length) return;
    // 2. fetch providers for those assays
    const list = detected.map((a) => a.assay).join(",");
    const pv = await fetch(`/api/providers?assays=${encodeURIComponent(list)}`).then((r) => r.json());
    setAssays(pv.assays);
    if (pv.assays?.[0]) {
      setSelectedAssay(pv.assays[0].assay);
      const top = pv.assays[0].candidates?.[0];
      if (top) setSelectedProviderId(top.id);
    }
  }

  useEffect(() => {
    void resolve();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentChoice = assays.find((a) => a.assay === selectedAssay) ?? null;
  const currentProvider: Provider | null =
    currentChoice?.candidates.find((c) => c.id === selectedProviderId) ?? null;

  const prompt = useMemo(() => {
    if (!currentChoice || !currentProvider) return "";
    return buildSponsorPrompt({
      query,
      assay: currentChoice.assay,
      family: currentChoice.family,
      provider: currentProvider,
      evidenceLine: buildEvidenceLine(currentProvider),
    });
  }, [query, currentChoice, currentProvider]);

  return (
    <div className="spx">
      <header className="spx-top">
        <div>
          <span className="status mono">Sponsor preview</span>
          <h1 className="serif spx-h">Sponsored pre-roll sandbox</h1>
          <p className="spx-sub mono-sm">
            Test the prompt → render → playback flow without touching the search.
            Each live render is ~90s and ~$0.61.
          </p>
        </div>
      </header>

      <div className="spx-grid">
        <section className="spx-controls">
          <div className="spx-section-h mono">1 · Pick a query</div>
          <textarea
            className="spx-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={2}
          />
          <div className="spx-presets">
            {SAMPLE_QUERIES.map((q) => (
              <button
                key={q}
                className={`spx-preset ${q === query ? "on" : ""}`}
                onClick={() => setQuery(q)}
              >
                {q}
              </button>
            ))}
          </div>
          <div className="spx-actions">
            <button
              className="btn-p brand"
              onClick={async () => {
                setRunning(true);
                await resolve();
                setRunning(false);
              }}
              disabled={running}
            >
              {running ? "Resolving…" : "Resolve assays + providers"}
            </button>
          </div>

          {assays.length > 0 && (
            <>
              <div className="spx-section-h mono">2 · Pick the assay</div>
              <div className="spx-chip-row">
                {assays.map((a) => (
                  <button
                    key={a.assay}
                    className={`bb-chip ${a.assay === selectedAssay ? "on" : ""}`}
                    onClick={() => {
                      setSelectedAssay(a.assay);
                      setSelectedProviderId(a.candidates[0]?.id ?? null);
                    }}
                  >
                    {a.assay}
                  </button>
                ))}
              </div>

              <div className="spx-section-h mono">3 · Pick the sponsor</div>
              {currentChoice && (
                <ul className="bb-prov-grid spx-prov-grid">
                  {currentChoice.candidates.slice(0, 6).map((p) => (
                    <li
                      key={p.id}
                      className={`bb-prov-card ${p.id === selectedProviderId ? "on" : ""}`}
                      onClick={() => setSelectedProviderId(p.id)}
                    >
                      <div className="bb-prov-head">
                        <span className={`bb-prov-tag t-${p.type}`}>{p.type.replace("_", " ")}</span>
                        <span className="bb-prov-country mono">{p.country}</span>
                      </div>
                      <div className="bb-prov-name">{p.name}</div>
                      <div className="bb-prov-meta mono">
                        {p.accreditation && p.accreditation !== "—" ? p.accreditation : ""}
                        {p.n_trials ? ` · ${p.n_trials} trials` : ""}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {currentProvider && (
            <div className="spx-actions">
              <button
                className="btn-p brand"
                onClick={() => setGenerationKey((k) => k + 1)}
              >
                Generate sponsor pre-roll →
              </button>
            </div>
          )}
        </section>

        <section className="spx-stage">
          {currentProvider && currentChoice && prompt && generationKey > 0 ? (
            <SponsorView
              key={`${generationKey}-${currentProvider.id}`}
              prompt={prompt}
              provider={currentProvider}
              assay={currentChoice.assay}
              autoStart
            />
          ) : (
            <div className="spx-empty">
              {!assays.length
                ? "Resolve a query first."
                : !currentProvider
                  ? "Pick an assay + provider, then hit Generate."
                  : "Hit Generate to render the pre-roll."}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
