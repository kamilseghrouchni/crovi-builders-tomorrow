"use client";
import type { ParseResult, ParsedField } from "@/app/api/parse/types";

export function ParsedRequest({
  parsed,
  rawQuery,
}: {
  parsed: ParseResult;
  rawQuery: string;
}) {
  const fields = parsed.fields;
  return (
    <div className="parsed-request">
      <div className="pr-hd">
        <span className="pr-eyebrow">Here's what we heard</span>
        <span className="pr-meta mono-sm">
          {fields.length} field{fields.length === 1 ? "" : "s"} · {parsed.facets.total_specimens.toLocaleString()} specimens to draw from
        </span>
      </div>

      <div className="pr-prose serif">{parsed.parsed_text}</div>

      <div className="pr-fields">
        {fields.length === 0 && (
          <div className="pr-empty">Nothing structured yet — we'll lean on the prose and the clarifiers.</div>
        )}
        {fields.map((f) => (
          <FieldRow key={f.key} f={f} />
        ))}
      </div>

      {parsed.assays && parsed.assays.length > 0 && (
        <div className="pr-assays">
          <div className="pr-assays-h">
            <span className="pr-assays-eyebrow mono-sm">Assays for this request</span>
            <span className="pr-assays-meta mono-sm">
              {parsed.assays.length} · {parsed.assays.every((a) => a.source === "stated") ? "all stated" : "some inferred"}
            </span>
          </div>
          <ul className="pr-assays-list">
            {parsed.assays.map((a) => (
              <li key={a.assay} className={`pr-assay src-${a.source}`}>
                <span className="pr-assay-fam mono-sm">{a.family}</span>
                <span className="pr-assay-name">{a.assay}</span>
                <span className="pr-assay-tag mono-sm">
                  <span className={`pr-pip pr-pip-${a.source}`} />
                  {a.source === "stated" ? "STATED" : "INFERRED"}
                </span>
                {a.reason && <span className="pr-assay-reason">{a.reason}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <details className="pr-raw">
        <summary>Original phrasing</summary>
        <div className="pr-raw-body">{rawQuery}</div>
      </details>
    </div>
  );
}

function FieldRow({ f }: { f: ParsedField }) {
  return (
    <div className={`pr-row src-${f.source}`}>
      <div className="pr-row-k mono-sm">{f.label}</div>
      <div className="pr-row-v">{f.value}</div>
      <div className="pr-row-tag mono-sm">
        <span className={`pr-pip pr-pip-${f.source}`} />
        {f.source === "stated" ? "STATED" : f.source === "inferred" ? "INFERRED" : "DEFAULT"}
      </div>
    </div>
  );
}
