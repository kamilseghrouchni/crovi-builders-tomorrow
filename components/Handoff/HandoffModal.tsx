"use client";
import { useEffect, useState } from "react";
import type { ParseResult } from "@/app/api/parse/types";
import type { QuerySpecimensResult } from "@/lib/tools/query_specimens";
import type { Bundle } from "@/lib/bundle";

type Step = "prompt" | "identity" | "dispatch";

type Props = {
  open: boolean;
  onClose: () => void;
  rawQuery: string;
  parsed: ParseResult | null;
  result: QuerySpecimensResult | null;
  bundle?: Bundle | null;
};

type Identity = {
  name: string;
  email: string;
  org: string;
  role: string;
};

const ROLES = ["Researcher / PI", "CRO / Sourcing", "Industry / Pharma", "Other"];

export function HandoffModal({ open, onClose, rawQuery, parsed, result, bundle }: Props) {
  const [step, setStep] = useState<Step>("prompt");
  const [prompt, setPrompt] = useState<string>(() => composePrompt(rawQuery, parsed, result, bundle));
  const [identity, setIdentity] = useState<Identity>({ name: "", email: "", org: "", role: "" });
  const [submitting, setSubmitting] = useState(false);

  // Reset prompt when reopening with new context
  useEffect(() => {
    if (open) {
      setPrompt(composePrompt(rawQuery, parsed, result, bundle));
      setStep("prompt");
    }
  }, [open, rawQuery, parsed, result, bundle]);

  // Esc closes
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const canContinuePrompt = prompt.trim().length > 10;
  const canSubmit = identity.name.trim() && /\S+@\S+\.\S+/.test(identity.email) && identity.org.trim();

  async function submit() {
    setSubmitting(true);
    // Mocked: pretend to enqueue the brief to the agent suite
    await new Promise((r) => setTimeout(r, 900));
    setSubmitting(false);
    setStep("dispatch");
  }

  return (
    <div className="hf-scrim" onClick={onClose}>
      <div
        className="hf-modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="hf-close" onClick={onClose} aria-label="Close">×</button>

        <Stepper current={step} />

        {step === "prompt" && (
          <StepPrompt
            value={prompt}
            onChange={setPrompt}
            onContinue={() => setStep("identity")}
            canContinue={canContinuePrompt}
          />
        )}

        {step === "identity" && (
          <StepIdentity
            identity={identity}
            onChange={setIdentity}
            onBack={() => setStep("prompt")}
            onSubmit={submit}
            canSubmit={!!canSubmit}
            submitting={submitting}
          />
        )}

        {step === "dispatch" && (
          <StepDispatch identity={identity} result={result} onClose={onClose} />
        )}
      </div>
    </div>
  );
}

function Stepper({ current }: { current: Step }) {
  const steps: { id: Step; label: string }[] = [
    { id: "prompt", label: "BRIEF" },
    { id: "identity", label: "IDENTITY" },
    { id: "dispatch", label: "DISPATCH" },
  ];
  const idx = steps.findIndex((s) => s.id === current);
  return (
    <ol className="hf-stepper">
      {steps.map((s, i) => {
        const state = i < idx ? "done" : i === idx ? "active" : "pending";
        return (
          <li key={s.id} className={`hf-step ${state}`}>
            <span className="hf-step-num">{i + 1}</span>
            <span className="hf-step-label mono">{s.label}</span>
            {i < steps.length - 1 && <span className="hf-step-sep">—</span>}
          </li>
        );
      })}
    </ol>
  );
}

function StepPrompt({
  value,
  onChange,
  onContinue,
  canContinue,
}: {
  value: string;
  onChange: (v: string) => void;
  onContinue: () => void;
  canContinue: boolean;
}) {
  return (
    <div className="hf-step-body">
      <h2 className="hf-h serif">
        Describe the dataset <em>in your own words.</em>
      </h2>
      <p className="hf-sub">
        Requirements, sample counts, assays, inclusion criteria, budget, timeline. Crovi's agents
        will parse it, enrich it, and source it on your behalf.
      </p>
      <textarea
        className="hf-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={8}
      />
      <div className="hf-actions">
        <button className="hf-btn-primary" disabled={!canContinue} onClick={onContinue}>
          Continue <span className="hf-arrow">→</span>
        </button>
      </div>
    </div>
  );
}

function StepIdentity({
  identity,
  onChange,
  onBack,
  onSubmit,
  canSubmit,
  submitting,
}: {
  identity: Identity;
  onChange: (i: Identity) => void;
  onBack: () => void;
  onSubmit: () => void;
  canSubmit: boolean;
  submitting: boolean;
}) {
  return (
    <div className="hf-step-body">
      <h2 className="hf-h serif">
        Who's <em>asking?</em>
      </h2>
      <p className="hf-sub">
        We pair every brief with a named sourcing lead before the agents reach out on your behalf —
        consent, MTAs, and lead times need a human to sign for them.
      </p>
      <div className="hf-form-grid">
        <Field label="Full name" value={identity.name} onChange={(v) => onChange({ ...identity, name: v })} />
        <Field label="Work email" value={identity.email} onChange={(v) => onChange({ ...identity, email: v })} type="email" />
        <Field label="Organization" value={identity.org} onChange={(v) => onChange({ ...identity, org: v })} />
        <div className="hf-field">
          <label className="hf-label mono">Role</label>
          <div className="hf-role-row">
            {ROLES.map((r) => (
              <button
                key={r}
                type="button"
                className={`hf-role ${identity.role === r ? "on" : ""}`}
                onClick={() => onChange({ ...identity, role: r })}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="hf-actions">
        <button className="hf-btn-secondary" onClick={onBack} disabled={submitting}>
          ← Back
        </button>
        <button
          className="hf-btn-primary"
          disabled={!canSubmit || submitting}
          onClick={onSubmit}
        >
          {submitting ? "Dispatching…" : "Dispatch to agents"} <span className="hf-arrow">→</span>
        </button>
      </div>
    </div>
  );
}

function StepDispatch({
  identity,
  result,
  onClose,
}: {
  identity: Identity;
  result: QuerySpecimensResult | null;
  onClose: () => void;
}) {
  const first = identity.name.split(" ")[0] || "there";
  const instituteCount = result?.totals.institutes ?? 0;
  const withContact = result?.institutes.filter((i) => !!i.contact_email).length ?? 0;

  return (
    <div className="hf-step-body hf-confirm">
      <div className="hf-tick">✓</div>
      <h2 className="hf-h serif">
        Brief dispatched, <em>{first}.</em>
      </h2>
      <p className="hf-sub">
        Your brief is in the agent suite queue. The first wave of outreach to{" "}
        {instituteCount > 0 ? `${instituteCount} candidate institute${instituteCount === 1 ? "" : "s"}` : "the matched institutes"}{" "}
        starts now. Your sourcing lead will email{" "}
        <span className="hf-email">{identity.email || "you"}</span> with the first-pass packet — validated
        contacts, consent scope, lead times — within 1 business day.
      </p>
      <ol className="hf-next">
        <li>
          <span className="hf-next-num mono">01</span>
          <div>
            <div className="hf-next-h">Outreach kicks off</div>
            <div className="hf-next-sub">
              Agents reach the {withContact > 0 ? `${withContact} institute${withContact === 1 ? "" : "s"} with verified contacts` : "matched institutes"} first
            </div>
          </div>
        </li>
        <li>
          <span className="hf-next-num mono">02</span>
          <div>
            <div className="hf-next-h">First-pass packet</div>
            <div className="hf-next-sub">Validated counts, consent scope, lead times — emailed to you</div>
          </div>
        </li>
        <li>
          <span className="hf-next-num mono">03</span>
          <div>
            <div className="hf-next-h">Confirm and arrange</div>
            <div className="hf-next-sub">MTAs, shipping, kickoff call — handled by your sourcing lead</div>
          </div>
        </li>
      </ol>
      <div className="hf-meta-grid">
        <Meta k="Brief" v="Dispatched" />
        <Meta
          k="Outreach"
          v={instituteCount > 0 ? `${instituteCount} institute${instituteCount === 1 ? "" : "s"}` : "Queued"}
        />
        <Meta k="First packet" v="≤ 1 business day" />
      </div>
      <div className="hf-actions">
        <button className="hf-btn-secondary" onClick={onClose}>
          Back to results
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="hf-field">
      <label className="hf-label mono">{label}</label>
      <input
        type={type}
        className="hf-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function Meta({ k, v }: { k: string; v: string }) {
  return (
    <div className="hf-meta">
      <div className="hf-meta-k mono">{k}</div>
      <div className="hf-meta-v">{v}</div>
    </div>
  );
}

function composePrompt(
  rawQuery: string,
  parsed: ParseResult | null,
  result: QuerySpecimensResult | null,
  bundle?: Bundle | null,
): string {
  const lines: string[] = [];
  lines.push(rawQuery.trim() || "—");
  if (parsed) {
    const stated = parsed.fields.filter((f) => f.source === "stated").map((f) => `${f.label}: ${f.value}`);
    const inferred = parsed.fields.filter((f) => f.source === "inferred").map((f) => `${f.label}: ${f.value}`);
    if (stated.length || inferred.length) {
      lines.push("");
      lines.push("Filters captured during demo:");
      stated.forEach((s) => lines.push(`• ${s} (stated)`));
      inferred.forEach((s) => lines.push(`• ${s} (inferred — please confirm)`));
    }
  }

  if (bundle) {
    lines.push("");
    lines.push("Bundle:");
    lines.push(
      `• Data: ${bundle.samples.totals.specimens.toLocaleString()} specimens across ` +
        `${bundle.samples.totals.institutes} institute${bundle.samples.totals.institutes === 1 ? "" : "s"}` +
        ` · ${bundle.samples.totals.donors.toLocaleString()} donors`,
    );
    for (const a of bundle.assays) {
      if (a.selected) {
        lines.push(`• ${a.assay} → ${a.selected.name} (${a.selected.country})`);
      } else {
        lines.push(`• ${a.assay} → not assigned`);
      }
    }
  } else if (result) {
    lines.push("");
    lines.push(
      `Demo run: ${result.totals.specimens.toLocaleString()} matching specimens across ${result.totals.institutes} institutes` +
        (result.totals.longitudinal_donors ? ` · ${result.totals.longitudinal_donors.toLocaleString()} longitudinal donors` : "")
    );
    if (result.institutes.length) {
      const top = result.institutes.slice(0, 3).map((i) => i.name).join(", ");
      lines.push(`Top matches: ${top}.`);
    }
  }

  lines.push("");
  lines.push("(Edit anything above — your sourcing lead will use this as the starting brief.)");
  return lines.join("\n");
}
