"use client";
import type { InstituteEntry } from "@/lib/tools/query_specimens";

const PILLAR_ORDER = ["specimens", "donors", "longitudinal", "matched_pairs"] as const;

function pillarsForInstitute(i: InstituteEntry): { k: string; v: number }[] {
  const matched = i.matched_pair_donor_count;
  const long = i.longitudinal_donor_count;
  // 0..1 normalized signals
  const specimens01 = Math.min(1, Math.log10(i.specimen_count + 1) / 4); // log scale ~10K
  const donors01 = Math.min(1, Math.log10(i.donor_count + 1) / 3.5);
  const long01 = Math.min(1, Math.log10(long + 1) / 2.5);
  const contact01 = i.contact_email ? 1 : 0;
  return [
    { k: "SP", v: specimens01 },
    { k: "DR", v: donors01 },
    { k: "LG", v: long01 },
    { k: "CT", v: contact01 },
  ];
}

export function RankedList({
  institutes,
  selectedId,
  onSelect,
}: {
  institutes: InstituteEntry[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  if (!institutes.length) {
    return <div style={{ padding: "30px 20px", color: "var(--text-3)", fontFamily: "var(--mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: ".1em" }}>No institutes yet — ask a question below.</div>;
  }

  return (
    <div className="ranked">
      {institutes.map((i) => {
        const ready = !!i.contact_email && i.specimen_count >= 50;
        const pillars = pillarsForInstitute(i);
        const sampleN = i.sample_rows.length;
        return (
          <div
            key={i.organization_id}
            className={`ranked-row ${selectedId === i.organization_id ? "sel" : ""}`}
            onClick={() => onSelect(i.organization_id)}
          >
            <div className="ranked-top">
              <div className="ranked-name">{i.name}</div>
              <span className="mono-sm" style={{ color: "var(--text-3)" }}>{i.country ?? "—"}</span>
            </div>
            <div className="ranked-meta">
              {sampleN} matching{i.specimen_count > sampleN ? ` of ${i.specimen_count.toLocaleString()}` : ""} sp · {i.donor_count.toLocaleString()} donors
              {i.longitudinal_donor_count > 0 ? ` · ${i.longitudinal_donor_count.toLocaleString()} long.` : ""}
            </div>
            <div className="ranked-bottom">
              <div className="ranked-bars">
                {pillars.map((p) => (
                  <div key={p.k} className="ranked-bar" title={`${p.k}: ${(p.v * 100).toFixed(0)}%`}>
                    <span style={{ width: `${Math.max(6, p.v * 100)}%` }} />
                  </div>
                ))}
              </div>
              {!i.contact_email && <span className="tag warn" style={{ fontSize: 8.5, padding: "1px 6px" }}>no contact</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
