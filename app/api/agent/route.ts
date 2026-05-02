import { anthropic } from "@ai-sdk/anthropic";
import { streamText, tool, convertToModelMessages, type UIMessage } from "ai";
import { z } from "zod";
import { queryspecimens } from "@/lib/tools/query_specimens";
import { findpublications } from "@/lib/tools/find_publications";
import { compareinstitutes } from "@/lib/tools/compare_institutes";
import { openrequestform } from "@/lib/tools/open_request_form";
import { mergeDelta, type SpecimenFilters } from "@/lib/filters";
import { mockAgentResponse } from "@/lib/tools/mock_agent";

export const runtime = "nodejs";
export const maxDuration = 60;

const filtersSchema = z.object({
  indication: z.array(z.string()).optional().describe("indications, e.g. ['multiple myeloma']"),
  specimen_types: z.array(z.string()).optional().describe("e.g. ['Plasma','Tissue (FFPE)']"),
  anatomy: z.array(z.string()).optional(),
  preservation: z.union([z.string(), z.array(z.string())]).optional()
    .describe("Fresh | Frozen | Fixed. Pass a single value when one fits; pass an array only when the user explicitly wants multiple preservations (uncommon — prefer matched_pairs_required for matched-pair queries)."),
  treatment_status: z.enum(["naive", "any", "post"]).optional(),
  age_range: z.tuple([z.number().nullable(), z.number().nullable()]).optional(),
  countries: z.array(z.string()).optional(),
  matched_pairs_required: z.boolean().optional(),
  longitudinal: z.boolean().optional().describe("set true when query implies multiple time points / progression"),
  has_contact_email: z.boolean().optional().describe("set true on follow-ups like 'drop ones without contact emails'"),
  min_n: z.number().nullable().optional(),
  free_text: z.string().optional().describe("any leftover query phrase that doesn't fit other fields"),
  display_grouping: z.enum(["country", "specimen_type", "treatment_status"]).nullable().optional()
    .describe("UI hint, NOT a filter; same data, different projection"),
});

const SYSTEM_PROMPT = `You are Crovi, an agent that helps researchers source biological specimens from a network of biobanks.

You have four tools:
- query_specimens: search the catalog. ALWAYS pass FILTER DELTAS, not full filters — the server merges with the prior turn's state. The first turn's "delta" is the full filter set extracted from the user's query.
- find_publications: look up curated literature backing the current intent. Call this once per new query when results merit literature backing.
- compare_institutes: when the user asks to compare two or more institutes.
- open_request_form: when the user wants to commission deeper auditing (scope: audit_deeper) or wider sourcing (scope: source_wider).

Filter extraction rules:
- "FFPE" → preservation: "Fixed", AND specimen_types should include "Tissue" (the DB doesn't have "Tissue (FFPE)" as a separate type — preservation lives on the preservation field).
- Avoid passing preservation as an array unless the user explicitly wants two separately preserved cohorts. For matched-pair queries (FFPE tissue + frozen plasma), set matched_pairs_required: true and DO NOT set preservation — the matched-pair flag handles it.
- "MM" → indication: "multiple myeloma". "BMMC" → specimen_types: "bone marrow". The server resolves synonyms.
- "longitudinal", "multi-timepoint", "progression" → longitudinal: true.
- Follow-ups: "drop ones without contact emails" → has_contact_email: true. "Group by country" → display_grouping: "country" (display hint, NOT a filter — same data, different projection).

NARRATION RULES — read carefully:
- HARD LIMIT: at most TWO sentences total per assistant turn, combined across all narration text. Each sentence ≤180 characters.
- NEVER produce markdown tables, bulleted lists, headings (no ###), or numbered lists.
- NEVER repeat data the canvas already shows: institute names, specimen counts, contact emails, scores, paper titles, PMIDs.
- DO surface ONE judgment or anomaly the user might miss — e.g. "Ukraine cluster has the strongest matched-pair coverage" or "the longitudinal requirement is the binding constraint here."
- If you have nothing useful to add, say one short sentence ("11 institutes, all with contacts — Ukraine is the strongest cluster.") and stop.
- Good: "11 institutes — Ukraine has the strongest matched-pair coverage."
- Good: "All 11 already have contact emails — nothing changed."
- Good: "No commercial hits. Curated literature points to two academic leads."
- Bad: any markdown table, any bullet list, any "###" heading, listing institute names and counts inline, "as high-confidence supporting literature includes…", any sentence over 180 chars.

When the user's query produces no commercial results, call find_publications (one short sentence) then suggest open_request_form with scope source_wider.`;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  if (process.env.CROVI_MOCK === "1") {
    return mockAgentResponse(messages);
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({
        error: "ANTHROPIC_API_KEY not set",
        hint: "Add it to .env.local and restart `npm run dev` — or set CROVI_MOCK=1 for the local demo without an API key.",
      }),
      { status: 503, headers: { "content-type": "application/json" } },
    );
  }

  // Track per-tool last filters across the conversation so the LLM can pass deltas.
  // Reconstructed by walking prior tool inputs in messages.
  const lastFilters: Record<string, SpecimenFilters> = {};
  for (const m of messages) {
    if (m.role !== "assistant" || !m.parts) continue;
    for (const p of m.parts as any[]) {
      if (p.type?.startsWith("tool-") && p.input) {
        const toolName = p.type.replace("tool-", "");
        if (toolName === "query_specimens" || toolName === "find_publications") {
          lastFilters[toolName] = mergeDelta(lastFilters[toolName], p.input);
        }
      }
    }
  }

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    system: SYSTEM_PROMPT,
    messages: convertToModelMessages(messages),
    providerOptions: {
      anthropic: {
        cacheControl: { type: "ephemeral" },
      },
    },
    tools: {
      query_specimens: tool({
        description: "Search specimens. Pass a FILTER DELTA — server merges with prior state for this tool.",
        inputSchema: filtersSchema,
        execute: async (delta: SpecimenFilters) => {
          const merged = mergeDelta(lastFilters.query_specimens, delta);
          lastFilters.query_specimens = merged;
          return queryspecimens(merged);
        },
      }),
      find_publications: tool({
        description: "Look up curated literature for the current intent.",
        inputSchema: filtersSchema,
        execute: async (delta: SpecimenFilters) => {
          const merged = mergeDelta(lastFilters.find_publications ?? lastFilters.query_specimens, delta);
          lastFilters.find_publications = merged;
          return findpublications(merged);
        },
      }),
      compare_institutes: tool({
        description: "Compare two or more institutes by ID.",
        inputSchema: z.object({ institute_ids: z.array(z.string()).min(2) }),
        execute: async ({ institute_ids }: { institute_ids: string[] }) => compareinstitutes(institute_ids),
      }),
      open_request_form: tool({
        description: "Open the unified request form. Use scope: 'audit_deeper' for deep verification of a specific institute, 'source_wider' for commissioning broader sourcing.",
        inputSchema: z.object({
          institute_ids: z.array(z.string()).optional(),
          query_text: z.string().optional(),
          specifics: z.string().optional(),
          scope: z.enum(["audit_deeper", "source_wider"]),
        }),
        execute: async (prefill: any) => openrequestform(prefill),
      }),
    },
    stopWhen: ({ steps }: any) => steps.length >= 6,
  });

  return result.toUIMessageStreamResponse();
}
