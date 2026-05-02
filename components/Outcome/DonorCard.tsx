"use client";
import type { SpecimenRow } from "@/lib/tools/query_specimens";

function shortDx(s: string | null): string {
  if (!s) return "";
  try {
    const parsed = JSON.parse(s);
    if (Array.isArray(parsed)) return parsed.filter(Boolean).join("; ").slice(0, 180);
  } catch {}
  return s.replace(/\s+/g, " ").slice(0, 180);
}

export type DonorGroup = {
  donorKey: string;
  donorIdLabel: string | null;
  rows: SpecimenRow[];
};

export function groupRowsByDonor(rows: SpecimenRow[]): DonorGroup[] {
  const m = new Map<string, SpecimenRow[]>();
  for (const r of rows) {
    const key = r.external_donor_id ?? r.donor_id ?? r.specimen_id;
    const arr = m.get(key);
    if (arr) arr.push(r);
    else m.set(key, [r]);
  }
  return Array.from(m.entries()).map(([k, rs]) => ({
    donorKey: k,
    donorIdLabel: rs[0].external_donor_id ?? (rs[0].donor_id ? rs[0].donor_id.slice(0, 12) + "…" : null),
    rows: rs,
  }));
}

export function DonorCard({ group, onOpen }: { group: DonorGroup; onOpen?: (row: SpecimenRow) => void }) {
  const rows = group.rows;
  const head = rows[0];
  const dx = shortDx(head.donor_diagnoses) || shortDx(head.specimen_diagnoses) || shortDx(head.unstructured_pathology);

  const typeCounts = new Map<string, number>();
  for (const r of rows) {
    const t = r.specimen_type ?? "—";
    typeCounts.set(t, (typeCounts.get(t) ?? 0) + 1);
  }
  const typesLine = Array.from(typeCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([t, n]) => (n > 1 ? `${t} ×${n}` : t))
    .join(" · ");

  const years = rows.map((r) => r.year).filter((y): y is number => y != null);
  const yearLbl = years.length === 0
    ? null
    : Math.min(...years) === Math.max(...years)
      ? String(years[0])
      : `${Math.min(...years)}–${Math.max(...years)}`;

  const ages = rows.map((r) => r.age).filter((a): a is number => a != null);
  const ageLbl = ages.length === 0
    ? null
    : Math.min(...ages) === Math.max(...ages)
      ? String(ages[0])
      : `${Math.min(...ages)}–${Math.max(...ages)}`;

  const presSet = new Set(rows.map((r) => r.preservation_category).filter(Boolean) as string[]);
  const presLbl = presSet.size === 1 ? Array.from(presSet)[0] : presSet.size > 1 ? "mixed" : null;

  return (
    <div className="specimen" onClick={() => onOpen?.(head)} role="button" tabIndex={0}>
      <div className="head">
        <span className="id">
          {group.donorIdLabel ?? head.specimen_id.slice(0, 12) + "…"}
          {rows.length > 1 && (
            <span style={{ marginLeft: 8, color: "var(--text-2)" }}>· {rows.length} visits</span>
          )}
        </span>
        <span className="mono-sm" style={{ color: "var(--text-3)" }}>{typesLine}</span>
      </div>
      <div className="demo">
        {head.sex && <span><span className="k">Sex</span>{head.sex[0]}</span>}
        {ageLbl && <span><span className="k">Age</span>{ageLbl}</span>}
        {head.country && <span><span className="k">Cty</span>{head.country}</span>}
        {yearLbl && <span><span className="k">Yr</span>{yearLbl}</span>}
        {presLbl && <span><span className="k">Pres</span>{presLbl}</span>}
      </div>
      {dx && <div className="dx">{dx}</div>}
    </div>
  );
}
