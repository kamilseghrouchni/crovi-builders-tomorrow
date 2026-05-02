"use client";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { QuerySpecimensResult, InstituteEntry } from "@/lib/tools/query_specimens";
import type { FindPublicationsResult } from "@/lib/tools/find_publications";
import { EventLog } from "@/components/ChatRail/EventLog";
import { Composer } from "@/components/ChatRail/Composer";
import { RankedList } from "@/components/Outcome/RankedList";
import { InstituteDetail } from "@/components/Outcome/InstituteDetail";
import { SecondaryStack } from "@/components/Outcome/SecondaryStack";
import { SpecimensTable } from "@/components/Outcome/SpecimensTable";
import { SpecimenDrawer } from "@/components/Outcome/SpecimenDrawer";
import type { SpecimenRow } from "@/lib/tools/query_specimens";
import type { ParseResult, ClarifierAnswer } from "@/app/api/parse/types";
import { ParsedRequest } from "@/components/Understand/ParsedRequest";
import { Clarifiers } from "@/components/Understand/Clarifiers";
import { RunningView } from "@/components/Running/RunningView";
import { HandoffModal } from "@/components/Handoff/HandoffModal";
import { SponsorOverlay } from "@/components/Sponsor/SponsorOverlay";

type Step = "parse" | "clarify" | "running" | "results";

export default function WorkspacePage() {
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/agent" }),
  });

  const [step, setStep] = useState<Step>("parse");
  const [rawQuery, setRawQuery] = useState<string>("");
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<ClarifierAnswer[]>([]);
  const [runStartedAt, setRunStartedAt] = useState<number>(0);
  const startedParse = useRef(false);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [autoSelected, setAutoSelected] = useState<string | null>(null);
  const [view, setView] = useState<"institute" | "table">("institute");
  const [drawerRow, setDrawerRow] = useState<SpecimenRow | null>(null);
  const [handoffOpen, setHandoffOpen] = useState(false);
  const router = useRouter();

  // Sponsor pre-roll: kicked off at search start, shown over results once both ready.
  type SponsorState = {
    taskId: string;
    sponsor: { name: string; country?: string | null; url?: string | null };
    assay: string;
    family: string;
    videoUrl: string | null;
    error: string | null;
    startedAt: number;
  };
  const [sponsor, setSponsor] = useState<SponsorState | null>(null);
  const [sponsorShown, setSponsorShown] = useState(false);
  const [sponsorOverlayOpen, setSponsorOverlayOpen] = useState(false);

  // Step 1: read the initial query and parse it
  useEffect(() => {
    if (startedParse.current) return;
    const initial = sessionStorage.getItem("crovi_initial_query");
    if (!initial) {
      setStep("clarify"); // direct nav with no query — show empty clarify
      return;
    }
    sessionStorage.removeItem("crovi_initial_query");
    startedParse.current = true;
    setRawQuery(initial);
    parseQuery(initial)
      .then((p) => {
        setParsed(p);
        setStep("clarify");
      })
      .catch((e) => {
        setParseError(e?.message ?? String(e));
        setStep("clarify");
      });
  }, []);

  // Step 3 → 4: when first query_specimens output lands, hold the running view
  // briefly so the deliver beat is visible, then transition.
  const { latestQuery, latestPubs, firstUserText } = useMemo(() => deriveState(messages), [messages]);
  const institutes: InstituteEntry[] = latestQuery?.institutes ?? [];
  const isStreaming = status === "streaming" || status === "submitted";
  const [runComplete, setRunComplete] = useState(false);

  useEffect(() => {
    if (step !== "running") return;
    if (!latestQuery || isStreaming) return;
    setRunComplete(true);
  }, [step, latestQuery, isStreaming]);

  // Auto-select top institute on first results
  useEffect(() => {
    if (!institutes.length) return;
    if (selectedId && institutes.find((i) => i.organization_id === selectedId)) return;
    if (autoSelected !== institutes[0].organization_id) {
      setSelectedId(institutes[0].organization_id);
      setAutoSelected(institutes[0].organization_id);
    }
  }, [institutes, selectedId, autoSelected]);

  const selected = institutes.find((i) => i.organization_id === selectedId) ?? null;

  function launch() {
    if (!parsed) return;
    const finalText = composeFinalText(rawQuery, parsed, answers);
    setRunStartedAt(Date.now());
    setStep("running");
    sendMessage({ text: finalText });
    // Kick off sponsor video in parallel with the search (silent — never
    // shown until search completes too). No-op if no assays were detected.
    void startSponsorVideo(rawQuery, parsed.assays);
  }

  async function startSponsorVideo(query: string, assays: { assay: string; family: string }[]) {
    if (!assays || assays.length === 0) return;
    setSponsor(null);
    setSponsorShown(false);
    try {
      const r = await fetch("/api/seedance/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query, assays, duration: 10 }),
      });
      const d = await r.json();
      if (!r.ok || !d.task_id) {
        return; // silent: ad never appears
      }
      setSponsor({
        taskId: d.task_id,
        sponsor: d.sponsor,
        assay: d.assay,
        family: d.family,
        videoUrl: null,
        error: null,
        startedAt: Date.now(),
      });
    } catch {
      // silent failure
    }
  }

  // Poll sponsor task in the background until url lands or 3 minutes pass.
  useEffect(() => {
    if (!sponsor || sponsor.videoUrl || sponsor.error) return;
    let cancelled = false;
    const tick = async () => {
      if (cancelled) return;
      try {
        const r = await fetch(`/api/seedance/status?task_id=${encodeURIComponent(sponsor.taskId)}`);
        const d = await r.json();
        if (cancelled) return;
        if (d.status === "completed" && d.url) {
          setSponsor((s) => (s ? { ...s, videoUrl: d.url } : s));
          return;
        }
        if (d.status === "failed" || d.status === "error") {
          setSponsor((s) => (s ? { ...s, error: d.error ?? "failed" } : s));
          return;
        }
        if (Date.now() - sponsor.startedAt > 180_000) {
          setSponsor((s) => (s ? { ...s, error: "timeout" } : s));
          return;
        }
        setTimeout(tick, 4000);
      } catch {
        // retry until timeout
        if (!cancelled) setTimeout(tick, 4000);
      }
    };
    tick();
    return () => { cancelled = true; };
  }, [sponsor]);

  // Once results are ready and the video is too, pop the overlay.
  useEffect(() => {
    if (sponsorShown) return;
    if (step !== "results") return;
    if (!sponsor?.videoUrl) return;
    setSponsorShown(true);
    setSponsorOverlayOpen(true);
  }, [step, sponsor, sponsorShown]);

  // Reflow when running but no parsed (e.g., direct nav typing in composer post-results)
  if (step === "parse" || (step === "clarify" && !parsed && !parseError)) {
    return (
      <div className="ws">
        <header className="ws-top">
          <div className="lead">
            <div className="status-line">
              <span className="status">
                <span className="live-dot" />
                Reading your request
              </span>
              <span className="thread-id">CROVI · PARSE</span>
            </div>
            {rawQuery && <h1 className="req-title serif">{rawQuery}</h1>}
          </div>
        </header>
        <main className="step-main">
          <div className="parse-loader">
            <div className="parse-loader-bar" />
            <div className="parse-loader-text mono">Parsing — pulling out indication, specimen, format…</div>
          </div>
        </main>
      </div>
    );
  }

  if (step === "clarify") {
    return (
      <div className="ws">
        <header className="ws-top">
          <div className="lead">
            <div className="status-line">
              <span className="status">Clarify before sourcing</span>
              <span className="thread-id">CROVI · STEP 1 OF 2</span>
            </div>
            {rawQuery && <h1 className="req-title serif">{rawQuery}</h1>}
            {parseError && <div className="parse-error mono-sm">PARSE ERROR · {parseError}</div>}
          </div>
        </header>

        <main className="step-main clarify-grid">
          {parsed && (
            <>
              <section className="clarify-left">
                <ParsedRequest parsed={parsed} rawQuery={rawQuery} />
              </section>
              <section className="clarify-right">
                <Clarifiers
                  clarifiers={parsed.clarifiers}
                  onAnswersChange={setAnswers}
                />
              </section>
            </>
          )}
          {!parsed && (
            <div className="parse-empty">
              <p>No request to parse. Go back to the home page and start one.</p>
            </div>
          )}
        </main>

        {parsed && (
          <div className="clarify-foot">
            <div className="cf-meta mono-sm">
              {parsed.fields.length} field{parsed.fields.length === 1 ? "" : "s"} parsed ·{" "}
              {parsed.fields.filter((f) => f.source === "inferred").length} inferred ·{" "}
              {parsed.clarifiers.length} clarifier{parsed.clarifiers.length === 1 ? "" : "s"} — answer or run with our defaults
            </div>
            <div className="cf-actions">
              <button className="btn-o" onClick={() => history.back()}>← Edit request</button>
              <button className="btn-p brand cf-run" onClick={launch}>
                Run search →
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (step === "running" && parsed) {
    return (
      <div className="ws">
        <header className="ws-top">
          <div className="lead">
            <div className="status-line">
              <span className="status">
                {!runComplete && <span className="live-dot" />}
                {runComplete ? "Sourcing complete" : "Sourcing"}
              </span>
              <span className="thread-id">CROVI · STEP 2 OF 2</span>
            </div>
            {rawQuery && <h1 className="req-title serif">{rawQuery}</h1>}
          </div>
          {runComplete && (
            <div className="actions">
              <button className="btn-p brand" onClick={() => setStep("results")}>
                View results →
              </button>
            </div>
          )}
        </header>
        <main className="step-main">
          <RunningView
            parsed={parsed}
            messages={messages}
            startedAt={runStartedAt}
            done={runComplete}
          />
        </main>
      </div>
    );
  }

  // results step (existing layout)
  return (
    <div className="ws">
      <header className="ws-top">
        <div className="lead">
          <div className="status-line">
            <span className="status">
              {isStreaming ? <span className="live-dot" /> : null}
              {isStreaming ? "Run in progress" : "Run complete"}
            </span>
            <span className="thread-id">CROVI · THREAD-{(messages[0]?.id ?? "00000").slice(-5).toUpperCase()}</span>
          </div>
          {(firstUserText || rawQuery) && <h1 className="req-title serif">{rawQuery || firstUserText}</h1>}
          {latestQuery && (
            <div className="meta">
              <span>{latestQuery.totals.specimens.toLocaleString()} specimens</span>
              <span>{latestQuery.totals.donors.toLocaleString()} donors</span>
              <span>{latestQuery.totals.institutes} institutes</span>
              {latestQuery.totals.longitudinal_donors > 0 && <span>{latestQuery.totals.longitudinal_donors.toLocaleString()} longitudinal</span>}
            </div>
          )}
        </div>
        {latestQuery && (
          <div className="actions">
            <div className="view-toggle">
              <button className={view === "institute" ? "on" : ""} onClick={() => setView("institute")}>By institute</button>
              <button className={view === "table" ? "on" : ""} onClick={() => setView("table")}>Table view</button>
            </div>
            <button
              className="btn-p brand handoff-cta"
              onClick={() => {
                sessionStorage.setItem(
                  "crovi_bundle_ctx",
                  JSON.stringify({
                    rawQuery: rawQuery || firstUserText,
                    parsed,
                    result: latestQuery,
                  }),
                );
                router.push("/workspace/bundle");
              }}
            >
              Build bundle →
            </button>
          </div>
        )}
      </header>

      <div className="ws-body">
        {view === "institute" && (
          <aside className="rail">
            <RailContent
              institutes={institutes}
              selectedId={selectedId}
              onSelect={setSelectedId}
              messages={messages}
              error={error}
              isStreaming={isStreaming}
            />
          </aside>
        )}

        <main className="detail" style={view === "table" ? { gridColumn: "1 / span 2" } : undefined}>
          {view === "table" && latestQuery ? (
            <section className="det-section" style={{ paddingTop: 0, borderBottom: 0 }}>
              <div className="sect-lbl">Matching specimens · table</div>
              <SpecimensTable data={latestQuery} onOpen={setDrawerRow} />
            </section>
          ) : selected ? (
            <InstituteDetail
              inst={selected}
              query={latestQuery!}
              pubs={latestPubs ?? null}
              onAuditDeeper={() => sendMessage({ text: `Open an audit-deeper request form for ${selected.name}.` })}
              onCommissionWider={() => sendMessage({ text: `Open a wider-sourcing request form.` })}
              onOpenSpecimen={setDrawerRow}
            />
          ) : (
            <SecondaryStack messages={messages} onUserIntent={(intent) => handleIntent(intent, sendMessage)} />
          )}
        </main>
      </div>

      <Composer
        disabled={isStreaming}
        onSubmit={(text) => sendMessage({ text })}
      />

      {drawerRow && (
        <SpecimenDrawer
          row={drawerRow}
          instituteName={institutes.find((i) => i.organization_id === drawerRow.organization_id)?.name}
          onClose={() => setDrawerRow(null)}
        />
      )}

      <HandoffModal
        open={handoffOpen}
        onClose={() => setHandoffOpen(false)}
        rawQuery={rawQuery || firstUserText}
        parsed={parsed}
        result={latestQuery}
      />

      {sponsorOverlayOpen && sponsor?.videoUrl && (
        <SponsorOverlay
          videoUrl={sponsor.videoUrl}
          sponsor={sponsor.sponsor}
          assay={sponsor.assay}
          skipAvailableAfter={5}
          onClose={() => setSponsorOverlayOpen(false)}
        />
      )}
    </div>
  );
}

async function parseQuery(query: string): Promise<ParseResult> {
  const r = await fetch("/api/parse", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!r.ok) throw new Error(`parse failed: ${r.status}`);
  return r.json();
}

function composeFinalText(rawQuery: string, parsed: ParseResult, answers: ClarifierAnswer[]): string {
  if (!answers.length) return rawQuery;
  const addOns: string[] = [];
  for (const a of answers) {
    const c = parsed.clarifiers.find((x) => x.id === a.id);
    if (!c) continue;
    if (a.value === null && !a.custom_text) continue; // skipped
    if (a.custom_text) {
      addOns.push(`${c.question} → ${a.custom_text}`);
      continue;
    }
    // Translate the answer into instructional text
    const v = a.value;
    if (c.target_field === "min_n" && typeof v === "number") {
      addOns.push(`Need at least ${v} samples.`);
    } else if (c.target_field === "has_contact_email" && typeof v === "boolean") {
      if (v) addOns.push("Only include institutes with a direct contact email.");
    } else if (c.target_field === "treatment_status") {
      if (v === "naive") addOns.push("Treatment-naive donors only.");
    } else if (c.target_field === "countries") {
      if (v === "USA") addOns.push("USA only.");
      else if (v === "non-USA") addOns.push("Outside USA only.");
    }
  }
  if (!addOns.length) return rawQuery;
  return `${rawQuery}\n\n${addOns.join(" ")}`;
}

function RailContent({
  institutes,
  selectedId,
  onSelect,
  messages,
  error,
  isStreaming,
}: {
  institutes: InstituteEntry[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  messages: UIMessage[];
  error?: Error | undefined;
  isStreaming: boolean;
}) {
  const [tab, setTab] = useState<"ranked" | "events">("ranked");
  useEffect(() => {
    if (institutes.length > 0 && !isStreaming) setTab("ranked");
  }, [isStreaming, institutes.length]);
  return (
    <>
      <div className="rail-tabs">
        <button className={`rail-tab ${tab === "ranked" ? "on" : ""}`} onClick={() => setTab("ranked")}>
          Ranked <span className="count">· {institutes.length}</span>
        </button>
        <button className={`rail-tab ${tab === "events" ? "on" : ""}`} onClick={() => setTab("events")}>
          Events <span className="count">· {messages.length}</span>
        </button>
      </div>
      <div className="rail-body">
        {tab === "ranked" ? (
          <RankedList institutes={institutes} selectedId={selectedId} onSelect={onSelect} />
        ) : (
          <EventLog messages={messages} error={error} streaming={isStreaming} />
        )}
      </div>
    </>
  );
}

function handleIntent(intent: string, sendMessage: (m: { text: string }) => void) {
  if (intent.startsWith("dismiss:")) return;
  if (intent === "open_request_form:source_wider") return sendMessage({ text: "Open a request form for broader sourcing." });
  if (intent === "open_request_form:audit_deeper") return sendMessage({ text: "Open an audit-deeper request form." });
  if (intent === "filter:has_contact_email=true") return sendMessage({ text: "Drop institutes without contact emails." });
  if (intent === "find_publications") return sendMessage({ text: "Look up curated literature for this." });
}

function deriveState(messages: UIMessage[]): {
  latestQuery: QuerySpecimensResult | null;
  latestPubs: FindPublicationsResult | null;
  firstUserText: string;
} {
  let latestQuery: QuerySpecimensResult | null = null;
  let latestPubs: FindPublicationsResult | null = null;
  let firstUserText = "";
  for (const m of messages) {
    if (m.role === "user" && !firstUserText) {
      firstUserText = (m.parts ?? []).filter((p: any) => p.type === "text").map((p: any) => p.text).join(" ").trim();
    }
    if (m.role !== "assistant") continue;
    for (const p of (m.parts ?? []) as any[]) {
      if (!p.type?.startsWith("tool-") || !p.output) continue;
      const toolName = p.type.replace("tool-", "");
      if (toolName === "query_specimens") latestQuery = p.output;
      if (toolName === "find_publications") latestPubs = p.output;
    }
  }
  return { latestQuery, latestPubs, firstUserText };
}
