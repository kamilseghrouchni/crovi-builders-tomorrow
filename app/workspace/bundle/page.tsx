"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ParseResult } from "@/app/api/parse/types";
import type { QuerySpecimensResult, InstituteEntry } from "@/lib/tools/query_specimens";
import type { AssayChoice, Bundle, Provider } from "@/lib/bundle";
import { HandoffModal } from "@/components/Handoff/HandoffModal";
import { KickoffOverlay } from "@/components/Sponsor/KickoffOverlay";

type StoredCtx = {
  rawQuery: string;
  parsed: ParseResult | null;
  result: QuerySpecimensResult | null;
};

export default function BundlePage() {
  const router = useRouter();
  const [ctx, setCtx] = useState<StoredCtx | null>(null);
  const [pickedInstitutes, setPickedInstitutes] = useState<Set<string>>(new Set());
  const [assayChoices, setAssayChoices] = useState<AssayChoice[]>([]);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [handoffOpen, setHandoffOpen] = useState(false);
  const [kickoffOpen, setKickoffOpen] = useState(false);

  // Read context dropped by the workspace page on navigation
  useEffect(() => {
    const raw = sessionStorage.getItem("crovi_bundle_ctx");
    if (!raw) {
      router.replace("/workspace");
      return;
    }
    try {
      const c = JSON.parse(raw) as StoredCtx;
      setCtx(c);
      if (c.result?.institutes) {
        setPickedInstitutes(new Set(c.result.institutes.map((i) => i.organization_id)));
      }
    } catch {
      router.replace("/workspace");
    }
  }, [router]);

  // Fetch providers for the parsed assays once ctx is loaded
  useEffect(() => {
    if (!ctx?.parsed?.assays?.length) {
      if (ctx) setLoading(false);
      return;
    }
    const list = ctx.parsed.assays.map((a) => a.assay).join(",");
    fetch(`/api/providers?assays=${encodeURIComponent(list)}`)
      .then((r) => r.json())
      .then((d) => setAssayChoices(d.assays))
      .finally(() => setLoading(false));
  }, [ctx]);

  const institutes = ctx?.result?.institutes ?? [];
  const selectedInstitutes = institutes.filter((i) => pickedInstitutes.has(i.organization_id));
  const totalSpecimens = selectedInstitutes.reduce((s, i) => s + (i.specimen_count ?? 0), 0);
  const totalDonors = selectedInstitutes.reduce((s, i) => s + (i.donor_count ?? 0), 0);

  const allAssaysPicked = assayChoices.every(
    (a) => a.candidates.length === 0 || selected[a.assay],
  );
  const canLaunch = pickedInstitutes.size > 0 && allAssaysPicked && assayChoices.length > 0;

  const bundle: Bundle | null = useMemo(() => {
    if (!ctx) return null;
    return {
      query: ctx.rawQuery,
      samples: {
        institute_ids: Array.from(pickedInstitutes),
        specimen_ids: [],
        totals: {
          specimens: totalSpecimens,
          donors: totalDonors,
          institutes: selectedInstitutes.length,
        },
      },
      assays: assayChoices.map((a) => ({
        ...a,
        selected: a.candidates.find((c) => c.id === selected[a.assay]) ?? null,
      })),
      selected_provider_ids: selected,
    };
  }, [ctx, pickedInstitutes, totalSpecimens, totalDonors, selectedInstitutes.length, assayChoices, selected]);

  if (!ctx) return null;

  return (
    <div className="bp">
      <header className="bp-top">
        <div className="bp-lead">
          <button className="bp-back" onClick={() => router.push("/workspace")}>← Back to results</button>
          <div className="bp-title-row">
            <span className="status mono">Bundle</span>
          </div>
          <h1 className="bp-title serif">{ctx.rawQuery}</h1>
          <div className="bp-meta mono-sm">
            {selectedInstitutes.length} institutes · {totalSpecimens.toLocaleString()} specimens · {totalDonors.toLocaleString()} donors · {assayChoices.length} assays
          </div>
        </div>
        <div className="bp-actions">
          <button
            className="btn-p brand"
            onClick={() => setKickoffOpen(true)}
            disabled={!canLaunch}
            title={!canLaunch ? "Pick institutes and a provider for each assay" : undefined}
          >
            Launch agent →
          </button>
        </div>
      </header>

      <div className="bp-body">
        <aside className="bp-rail">
          <SamplesRail
            institutes={institutes}
            picked={pickedInstitutes}
            onToggle={(id) => {
              const next = new Set(pickedInstitutes);
              next.has(id) ? next.delete(id) : next.add(id);
              setPickedInstitutes(next);
            }}
            onSelectAll={() => setPickedInstitutes(new Set(institutes.map((i) => i.organization_id)))}
            onClear={() => setPickedInstitutes(new Set())}
          />
        </aside>

        <main className="bp-main">
          {loading ? (
            <div className="bp-empty">Loading providers…</div>
          ) : assayChoices.length === 0 ? (
            <div className="bp-empty">
              No assays detected. Go back to refine the request — the parse step picks them up from the query.
            </div>
          ) : (
            <div className="bp-assays">
              {assayChoices.map((a) => (
                <AssaySection
                  key={a.assay}
                  choice={a}
                  selectedId={selected[a.assay]}
                  onPick={(pid) => setSelected({ ...selected, [a.assay]: pid })}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      <HandoffModal
        open={handoffOpen}
        onClose={() => setHandoffOpen(false)}
        rawQuery={ctx.rawQuery}
        parsed={ctx.parsed}
        result={ctx.result}
        bundle={bundle}
      />

      {kickoffOpen && bundle && (() => {
        const topProvider = bundle.assays.find((a) => a.selected)?.selected ?? null;
        return (
          <KickoffOverlay
            query={ctx.rawQuery}
            pitch={{
              provider_name: topProvider?.name ?? null,
              provider_country: topProvider?.country ?? null,
              assays: bundle.assays.map((a) => a.assay),
              n_specimens: bundle.samples.totals.specimens,
              n_donors: bundle.samples.totals.donors,
              n_institutes: bundle.samples.totals.institutes,
            }}
            onClose={() => {
              setKickoffOpen(false);
              setHandoffOpen(true);
            }}
          />
        );
      })()}
    </div>
  );
}

function SamplesRail({
  institutes,
  picked,
  onToggle,
  onSelectAll,
  onClear,
}: {
  institutes: InstituteEntry[];
  picked: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onClear: () => void;
}) {
  return (
    <div className="bp-rail-inner">
      <div className="bp-section-h mono">Sample set</div>
      <div className="bb-toolbar">
        <span className="bb-count mono">
          {picked.size}/{institutes.length} institutes
        </span>
        <div className="bb-tool-actions">
          <button className="hf-btn-secondary sm" onClick={onSelectAll}>All</button>
          <button className="hf-btn-secondary sm" onClick={onClear}>None</button>
        </div>
      </div>
      <ul className="bb-inst-list" style={{ maxHeight: "none" }}>
        {institutes.map((i) => (
          <li key={i.organization_id} className={picked.has(i.organization_id) ? "on" : ""}>
            <label>
              <input
                type="checkbox"
                checked={picked.has(i.organization_id)}
                onChange={() => onToggle(i.organization_id)}
              />
              <span className="bb-inst-name">{i.name}</span>
              <span className="bb-inst-meta mono">
                {(i.specimen_count ?? 0).toLocaleString()} sp · {(i.donor_count ?? 0).toLocaleString()} d · {i.country ?? "—"}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AssaySection({
  choice,
  selectedId,
  onPick,
}: {
  choice: AssayChoice;
  selectedId?: string;
  onPick: (id: string) => void;
}) {
  return (
    <section className="bp-assay-block">
      <header className="bb-assay-head">
        <span className="bb-assay-fam mono">{choice.family}</span>
        <h3 className="bb-assay-name">{choice.assay}</h3>
        <span className="bb-assay-count mono">{choice.candidates.length} providers</span>
      </header>
      {choice.candidates.length === 0 ? (
        <div className="bb-empty">No providers indexed — outreach will be manual.</div>
      ) : (
        <ul className="bb-prov-grid">
          {choice.candidates.slice(0, 8).map((p) => (
            <li
              key={p.id}
              className={`bb-prov-card ${selectedId === p.id ? "on" : ""}`}
              onClick={() => onPick(p.id)}
            >
              <div className="bb-prov-head">
                <span className={`bb-prov-tag t-${p.type}`}>{providerTypeLabel(p.type)}</span>
                <span className="bb-prov-country mono">{p.country}</span>
              </div>
              <div className="bb-prov-name">{p.name}</div>
              {p.parent && <div className="bb-prov-parent mono">via {p.parent}</div>}
              <div className="bb-prov-meta mono">
                {p.accreditation && p.accreditation !== "—" ? p.accreditation : ""}
                {p.n_trials ? ` · ${p.n_trials} trials` : ""}
              </div>
              {p.url && (
                <a
                  className="bb-prov-link mono"
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  visit ↗
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function providerTypeLabel(t: Provider["type"]): string {
  switch (t) {
    case "service_cro": return "CRO";
    case "specialty_cro": return "Specialty CRO";
    case "ip_platform": return "IP platform";
    case "vendor": return "Vendor";
  }
}
