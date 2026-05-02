"use client";
import { useMemo, useState } from "react";
import type { QuerySpecimensResult, SpecimenRow } from "@/lib/tools/query_specimens";

type SortKey = "year" | "age" | "type" | "preservation" | "country";

export function SpecimensTable({ data, onOpen }: { data: QuerySpecimensResult; onOpen?: (row: SpecimenRow) => void }) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("year");
  const [dir, setDir] = useState<"asc" | "desc">("desc");

  const orgNameById = useMemo(() => {
    const m: Record<string, string> = {};
    for (const i of data.institutes) m[i.organization_id] = i.name;
    return m;
  }, [data.institutes]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = data.table_rows;
    if (q) {
      rows = rows.filter((r) => {
        const blob = [
          r.specimen_type, r.raw_anatomy, r.source_site, r.country, r.preservation_category,
          r.donor_diagnoses, r.specimen_diagnoses, r.unstructured_pathology,
          r.tnm?.T, r.tnm?.N, r.tnm?.M, r.grade, r.stage,
          r.organization_id ? orgNameById[r.organization_id] : "",
        ].filter(Boolean).join(" ").toLowerCase();
        return blob.includes(q);
      });
    }
    const cmp = (a: SpecimenRow, b: SpecimenRow): number => {
      let av: any, bv: any;
      switch (sort) {
        case "year": av = a.year ?? -1; bv = b.year ?? -1; break;
        case "age": av = a.age ?? -1; bv = b.age ?? -1; break;
        case "type": av = a.specimen_type ?? ""; bv = b.specimen_type ?? ""; break;
        case "preservation": av = a.preservation_category ?? ""; bv = b.preservation_category ?? ""; break;
        case "country": av = a.country ?? ""; bv = b.country ?? ""; break;
      }
      if (av < bv) return dir === "asc" ? -1 : 1;
      if (av > bv) return dir === "asc" ? 1 : -1;
      return 0;
    };
    return [...rows].sort(cmp);
  }, [data.table_rows, search, sort, dir, orgNameById]);

  const Th = ({ k, children }: { k: SortKey; children: React.ReactNode }) => (
    <th
      style={{ cursor: "pointer", userSelect: "none" }}
      onClick={() => {
        if (sort === k) setDir(dir === "asc" ? "desc" : "asc");
        else { setSort(k); setDir("desc"); }
      }}
    >
      {children}{sort === k ? (dir === "asc" ? " ↑" : " ↓") : ""}
    </th>
  );

  return (
    <>
      <div className="table-controls">
        <input
          className="table-search"
          type="search"
          placeholder="search within results — diagnosis, country, T/N/M, anatomy…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: ".1em", color: "var(--text-3)", textTransform: "uppercase" }}>
          {filtered.length.toLocaleString()} of {data.table_rows.length.toLocaleString()} sampled · {data.totals.specimens.toLocaleString()} total matched
        </span>
      </div>
      <div style={{ overflowX: "auto", border: "1px solid var(--bg-sunk)", borderRadius: 10, background: "#FBF9F4" }}>
        <table className="spec-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Institute</th>
              <Th k="type">Type</Th>
              <th>Anatomy / Dx</th>
              <Th k="preservation">Preservation</Th>
              <Th k="age">Age / Sex</Th>
              <Th k="country">Country</Th>
              <Th k="year">Year</Th>
              <th>T/N/M · Grade</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.specimen_id + (r.donor_id ?? "")} onClick={() => onOpen?.(r)} style={{ cursor: onOpen ? "pointer" : "default" }}>
                <td className="sid">{r.external_specimen_id ?? r.specimen_id.slice(0, 10) + "…"}</td>
                <td className="inst">{r.organization_id ? orgNameById[r.organization_id] ?? "—" : "—"}</td>
                <td>{r.specimen_type ?? "—"}</td>
                <td>
                  <div>{shortAnat(r.raw_anatomy, r.source_site) || "—"}</div>
                  {dxShort(r) && <div style={{ color: "var(--text-2)", fontSize: 11 }}>{dxShort(r)}</div>}
                </td>
                <td className="nowrap">
                  {r.preservation_category ?? "—"}
                  {r.storage_temp ? <span style={{ color: "var(--text-3)", marginLeft: 6 }}>{r.storage_temp}</span> : null}
                </td>
                <td className="nowrap">{r.age ?? "—"} · {r.sex?.[0] ?? "—"}</td>
                <td>{r.country ?? "—"}</td>
                <td>{r.year ?? "—"}</td>
                <td className="nowrap">
                  {r.tnm ? `T${r.tnm.T ?? "?"}N${r.tnm.N ?? "?"}M${r.tnm.M ?? "?"}` : "—"}
                  {r.grade ? ` · G${r.grade}` : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function shortAnat(raw: string | null, fallback: string | null): string {
  const s = raw ?? fallback ?? "";
  return s.replace(/^anatomic_site:\s*/i, "").trim();
}

function dxShort(r: SpecimenRow): string {
  const try1 = (s: string | null | undefined): string => {
    if (!s) return "";
    try {
      const p = JSON.parse(s);
      if (Array.isArray(p)) return p.filter(Boolean).join("; ");
    } catch {}
    return s;
  };
  return (try1(r.donor_diagnoses) || try1(r.specimen_diagnoses) || try1(r.unstructured_pathology)).slice(0, 90);
}

