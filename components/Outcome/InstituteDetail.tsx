"use client";
import { useMemo, useState } from "react";
import type { InstituteEntry, QuerySpecimensResult } from "@/lib/tools/query_specimens";
import type { Publication } from "@/lib/publications";
import type { FindPublicationsResult } from "@/lib/tools/find_publications";
import { DonorCard, groupRowsByDonor } from "./DonorCard";

export function InstituteDetail({
  inst,
  query,
  pubs,
  onAuditDeeper,
  onCommissionWider,
  onOpenSpecimen,
}: {
  inst: InstituteEntry;
  query: QuerySpecimensResult;
  pubs: FindPublicationsResult | null;
  onAuditDeeper: () => void;
  onCommissionWider: () => void;
  onOpenSpecimen?: (row: import("@/lib/tools/query_specimens").SpecimenRow) => void;
}) {
  const matchingPubs = ((pubs?.papers ?? []) as Publication[]).filter((p) => paperTouchesInstitute(p, inst.name)).slice(0, 3);
  const sampleN = inst.sample_rows.length;

  return (
    <>
      <div className="det-title-row">
        <div style={{ flex: 1 }}>
          <div className="lbl">Institution</div>
          <div className="det-title">{inst.name}</div>
          <div className="det-sub">
            {inst.country ?? "—"} · {sampleN} matching{inst.specimen_count > sampleN ? ` of ${inst.specimen_count.toLocaleString()} cataloged` : ""} sp · {inst.donor_count.toLocaleString()} donors
            {inst.longitudinal_donor_count > 0 ? ` · ${inst.longitudinal_donor_count.toLocaleString()} longitudinal` : ""}
          </div>
        </div>
      </div>

      {inst.description && (
        <section className="det-section">
          <div className="sect-lbl">About</div>
          <div style={{ fontSize: 13.5, lineHeight: 1.55, color: "var(--text)" }}>{inst.description}</div>
        </section>
      )}

      <SpecimensSection inst={inst} onOpen={onOpenSpecimen} />

      <section className="det-section">
        <div className="sect-lbl">Contact & access</div>
        <div className="kv-grid">
          <div className="kv-card">
            <div className="k">Contact</div>
            <div className="v">
              {inst.contact_email ? (
                <a href={`mailto:${inst.contact_email}`} style={{ color: "var(--brand-ink)", textDecoration: "none" }}>{inst.contact_email}</a>
              ) : (
                <span className="tag warn">No public contact</span>
              )}
            </div>
          </div>
          <div className="kv-card">
            <div className="k muted">Web</div>
            <div className="v">
              {inst.website ? <a href={inst.website} target="_blank" rel="noreferrer" style={{ color: "var(--brand-ink)", textDecoration: "none" }}>{inst.website}</a> : <span style={{ color: "var(--text-3)" }}>—</span>}
            </div>
          </div>
        </div>
      </section>

      {matchingPubs.length > 0 && (
        <section className="det-section">
          <div className="sect-lbl">Literature</div>
          <div className="pubs">
            {matchingPubs.map((p: Publication) => (
              <div key={(p.pmid ?? p.title) || ""} className="pub">
                <div className="title">{p.title}</div>
                <div className="meta">{p.journal ?? "—"} · {p.year ?? "—"}</div>
                <div className="pmid">{p.pmid ? `PMID:${p.pmid}` : ""} {p.pmc_id ? `· ${p.pmc_id}` : ""}</div>
                {p.notes && <div className="notes">{p.notes}</div>}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="det-section">
        <div className="sect-lbl">Next steps</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn-p brand" onClick={onAuditDeeper}>Audit deeper</button>
          <button className="btn-o" onClick={onCommissionWider}>Commission wider</button>
        </div>
      </section>
    </>
  );
}

function SpecimensSection({ inst, onOpen }: { inst: InstituteEntry; onOpen?: (row: import("@/lib/tools/query_specimens").SpecimenRow) => void }) {
  const [showAll, setShowAll] = useState(false);
  const rows = inst.sample_rows;
  const groups = useMemo(() => groupRowsByDonor(rows), [rows]);
  const visible = showAll ? groups : groups.slice(0, 8);
  if (rows.length === 0) {
    return (
      <section className="det-section">
        <div className="sect-lbl">Matching donors</div>
        <div style={{ color: "var(--text-3)", fontSize: 13 }}>No matching specimens surfaced for this institute under the current filters.</div>
      </section>
    );
  }
  return (
    <section className="det-section">
      <div className="sect-lbl">
        Matching donors · {groups.length}
        <span style={{ color: "var(--text-3)", marginLeft: 8 }}>
          {rows.length} specimens{inst.specimen_count > rows.length ? ` of ${inst.specimen_count.toLocaleString()} cataloged` : ""}
        </span>
      </div>
      <div className="specimen-mix">
        {visible.map((g) => <DonorCard key={g.donorKey} group={g} onOpen={onOpen} />)}
      </div>
      {groups.length > 8 && (
        <button className="show-more" style={{ marginTop: 10 }} onClick={() => setShowAll((s) => !s)}>
          {showAll ? `Collapse to first 8` : `Show all ${groups.length}`}
        </button>
      )}
    </section>
  );
}

function paperTouchesInstitute(p: Publication, name: string): boolean {
  const inst = (p.institution ?? "").toLowerCase();
  const n = name.toLowerCase();
  if (!inst || !n) return false;
  const words = n.split(/\s+/).filter((w) => w.length >= 4);
  return words.some((w) => inst.includes(w));
}
