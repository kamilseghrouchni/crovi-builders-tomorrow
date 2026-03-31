---
name: nextjs-vercel-ai-webapp
description: Bootstrap a Next.js 16 + Vercel AI SDK v6 + Claude agent webapp with tool-loop streaming, custom neo-brutalism UI, and optional LanceDB integration. Use when starting a new AI-powered web application, building a chat interface with tool calls, or setting up a Next.js project with Claude as the backend model.
metadata:
    skill-author: K-Dense Inc.
---

# Next.js + Vercel AI SDK + Claude Webapp

## Purpose
Reusable blueprint for building AI agent webapps using Next.js App Router, Vercel AI SDK v6 (`ai` package), and Anthropic Claude. Covers project scaffolding, the agent tool-loop pattern, streaming chat UI, tool result rendering, database integration (LanceDB), and a custom neo-brutalism design system -- all patterns proven in production.

## When to Use
- Starting a new AI-powered webapp from scratch
- Adding a chat-with-tools interface to an existing Next.js project
- Integrating Claude as a backend agent with structured tool calls
- Building a streaming UI that renders tool results as rich components
- Setting up LanceDB (S3-backed) as a vector/scalar database in Next.js

## Stack (Tested Version Pins)

| Package | Version | Notes |
|---------|---------|-------|
| `next` | 16.1.6 | App Router only, no Pages Router |
| `react` / `react-dom` | 19.2.3 | Required for React Compiler |
| `ai` | ^6.0.116 | Vercel AI SDK v6 -- breaking changes from v5 |
| `@ai-sdk/anthropic` | ^3.0.58 | Claude model provider |
| `@ai-sdk/react` | ^3.0.118 | Client-side hooks (`useChat`) |
| `zod` | ^4.3.6 | v4 -- some breaking changes from v3 |
| `tailwindcss` | ^4 | v4 with PostCSS plugin, NOT v3 |
| `@tailwindcss/postcss` | ^4 | Required PostCSS plugin for Tailwind v4 |
| `babel-plugin-react-compiler` | 1.0.0 | devDep for React Compiler |
| `typescript` | ^5 | Strict mode recommended |

### Optional Database
| Package | Version | Notes |
|---------|---------|-------|
| `@lancedb/lancedb` | ^0.26.2 | Native module -- see serverExternalPackages |
| `apache-arrow` | ^18.1.0 | Native module -- see serverExternalPackages |

## Project Structure

```
src/
  app/
    api/chat/route.ts       # Agent endpoint (POST)
    layout.tsx               # Root layout with fonts
    page.tsx                 # Entry page
    globals.css              # Tailwind + neo-brutalism utilities
  components/
    chat/
      ChatContainer.tsx      # useChat hook, message list, input
      ChatMessage.tsx        # Renders UIMessage parts (text vs tools)
      ChatInput.tsx          # Textarea with send/stop buttons
    workflow/
      WorkflowTerminal.tsx   # Terminal-style tool result display
      WorkflowPhaseSection.tsx
      WorkflowStepLine.tsx
  lib/
    ai/
      prompts.ts             # System prompt(s)
      tools.ts               # All tool definitions + allTools map
      skills.ts              # Optional: skill discovery/loading
    lancedb/
      client.ts              # Singleton connection, query helpers
      types.ts               # Database types
    workflow/
      phases.ts              # Maps tool parts to UI workflow phases
  types/
    workflow.ts              # WorkflowPhase, WorkflowStep, etc.
```

## Step-by-Step Setup

### 1. Scaffold Project

```bash
npx create-next-app@latest my-app --typescript --tailwind --app --src-dir
cd my-app
```

### 2. Install Dependencies

```bash
npm install ai @ai-sdk/anthropic @ai-sdk/react zod
npm install -D babel-plugin-react-compiler
```

### 3. Configure next.config.ts

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // CRITICAL: Add native modules here or builds will fail
  // serverExternalPackages: ["@lancedb/lancedb", "apache-arrow"],
};

export default nextConfig;
```

### 4. Configure PostCSS (Tailwind v4)

```javascript
// postcss.config.mjs
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
export default config;
```

### 5. Configure TypeScript

```jsonc
// tsconfig.json -- key settings
{
  "compilerOptions": {
    "target": "ES2017",
    "module": "esnext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "react-jsx",
    "paths": { "@/*": ["./src/*"] }
  }
}
```

## Core Pattern: Agent Tool Loop (Server)

This is the single most important pattern. The entire backend is ~15 lines.

```typescript
// src/app/api/chat/route.ts
import { ToolLoopAgent, createAgentUIStreamResponse, stepCountIs } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { allTools } from "@/lib/ai/tools";

const orchestrator = new ToolLoopAgent({
  id: "my-agent",
  model: anthropic("claude-sonnet-4-20250514"),
  instructions: "Your system prompt here...",
  tools: allTools,
  stopWhen: stepCountIs(15), // Safety cap on tool loop iterations
});

export async function POST(req: Request) {
  const body = await req.json();

  return createAgentUIStreamResponse({
    agent: orchestrator,
    uiMessages: body.messages,
    onError: (error) => {
      console.error("[chat/route] Streaming error:", error);
      return String(error);
    },
  });
}
```

Key points:
- `ToolLoopAgent` runs tools in a loop until the model stops calling them or hits `stopWhen`
- `createAgentUIStreamResponse` handles streaming the response as SSE with tool call/result parts
- The agent is instantiated ONCE at module scope (singleton), not per-request
- `uiMessages` accepts the messages array from the client `useChat` hook directly
- Environment variable `ANTHROPIC_API_KEY` must be set (the SDK reads it automatically)

## Core Pattern: Tool Definitions

```typescript
// src/lib/ai/tools.ts
import { tool } from "ai";
import { z } from "zod";

export const myTool = tool({
  description: "What this tool does -- the LLM reads this to decide when to call it",
  inputSchema: z.object({
    query: z.string().describe("Description for the LLM"),
    limit: z.number().optional().default(10).describe("Max results"),
  }),
  execute: async ({ query, limit }) => {
    // Do work here. Return a plain object -- it's auto-serialized to JSON.
    return { results: [], total: 0 };
  },
});

// Export ALL tools as a single flat map
export const allTools = {
  myTool,
  anotherTool,
  // ...
};
```

Key points:
- Zod schemas serve dual duty: runtime validation AND LLM function-calling schema generation
- `z.describe()` on each field helps the LLM fill in arguments correctly
- Tool execute functions run server-side only; they can access databases, filesystems, APIs
- Return errors as `{ error: "message" }` objects rather than throwing -- the LLM can read and react to them
- Tool names in `allTools` become the function names the LLM sees

## Core Pattern: Client-Side Chat

```tsx
// src/components/chat/ChatContainer.tsx
"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useMemo, useState, useCallback } from "react";

export function ChatContainer() {
  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat" }),
    []
  );
  const { messages, sendMessage, status, stop, error } = useChat({
    transport,
    onError: (err) => console.error("Chat error:", err),
  });
  const [input, setInput] = useState("");
  const isStreaming = status === "streaming" || status === "submitted";

  const handleSend = useCallback((text: string) => {
    setInput("");
    sendMessage({ text });
  }, [sendMessage]);

  return (
    <div>
      {messages.map((msg) => (
        <ChatMessage key={msg.id} message={msg} />
      ))}
      <input value={input} onChange={(e) => setInput(e.target.value)} />
      {isStreaming ? (
        <button onClick={stop}>Stop</button>
      ) : (
        <button onClick={() => handleSend(input)}>Send</button>
      )}
    </div>
  );
}
```

Key points:
- `DefaultChatTransport` is required in AI SDK v6 (replaces the old `api` prop)
- `status` values: `"streaming"` (receiving chunks), `"submitted"` (sent, awaiting first chunk), `"idle"`
- `sendMessage({ text })` sends a user message -- NOT `sendMessage(text)`
- Messages are `UIMessage[]` -- each has a `.parts` array, NOT a `.content` string
- `stop()` aborts the current stream
- Memoize `transport` to avoid re-creating the SSE connection on every render

## Core Pattern: Rendering Tool Results

```tsx
// src/components/chat/ChatMessage.tsx
"use client";

import type { UIMessage } from "ai";
import { isToolUIPart } from "ai";

export function ChatMessage({ message }: { message: UIMessage }) {
  const hasTools = message.parts.some((p) => isToolUIPart(p));

  return (
    <div>
      {message.parts.map((part, i) => {
        if (part.type === "text") {
          return <p key={i}>{part.text}</p>;
        }
        if (isToolUIPart(part)) {
          // part.toolName, part.input, part.output, part.state
          // state: "partial-call" | "call" | "output-available" | "output-error"
          return (
            <div key={i}>
              <span>Tool: {part.toolName}</span>
              {part.state === "output-available" && (
                <pre>{JSON.stringify(part.output, null, 2)}</pre>
              )}
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}
```

Key points:
- `UIMessage.parts` is an array of `{ type: "text", text: string }` and tool parts
- Use `isToolUIPart(part)` to detect tool-related parts (covers all tool states)
- Tool part states: `"partial-call"` (streaming args), `"call"` (args complete, executing), `"output-available"` (done), `"output-error"` (failed)
- Access `part.toolName`, `part.input`, `part.output` after casting
- For rich UI: map tool names to custom components (workflow phases, cards, tables)

## Pattern: Workflow Phase Mapping

Map tool calls to UI phases for a terminal-style display:

```typescript
// src/lib/workflow/phases.ts
const TOOL_PHASE_MAP: Record<string, { phase: string; label: string }> = {
  planAnalysis: { phase: "planning", label: "Analysis Plan" },
  queryDatabase: { phase: "search", label: "Database Search" },
  assessPaper: { phase: "assessment", label: "Paper Assessment" },
};

// Walk through message.parts, group tool calls by phase
// Track status: "running" if state !== "output-available", "complete" if it is
// Group related tool calls (e.g., multiple assessPaper calls for same paper)
```

## Pattern: LanceDB Integration (Optional)

### Singleton Connection with Table Caching

```typescript
// src/lib/lancedb/client.ts
import * as lancedb from "@lancedb/lancedb";

let dbConnection: lancedb.Connection | null = null;
const tableCache = new Map<string, lancedb.Table>();

async function getConnection(): Promise<lancedb.Connection> {
  if (dbConnection) return dbConnection;
  const uri = process.env.LANCEDB_URI!;

  const storageOptions: Record<string, string> = {};
  if (uri.startsWith("s3://")) {
    storageOptions.region = process.env.AWS_DEFAULT_REGION || "us-east-2";
    if (process.env.AWS_ACCESS_KEY_ID)
      storageOptions.access_key_id = process.env.AWS_ACCESS_KEY_ID;
    if (process.env.AWS_SECRET_ACCESS_KEY)
      storageOptions.secret_access_key = process.env.AWS_SECRET_ACCESS_KEY;
  }

  dbConnection = await lancedb.connect(uri, { storageOptions });
  return dbConnection;
}

async function getTable(name: string): Promise<lancedb.Table> {
  if (tableCache.has(name)) return tableCache.get(name)!;
  const db = await getConnection();
  const table = await db.openTable(name);
  tableCache.set(name, table);
  return table;
}
```

### WHERE Clause Builder (handles Arrow type quirks)

```typescript
// Arrow List columns cannot use = operator. Use array_to_string() + LIKE.
const LIST_COLUMNS = new Set(["my_list_column"]);
const LIKE_COLUMNS = new Set(["search_string_column"]);

function buildWhereClause(filters: Record<string, unknown>): string {
  const clauses: string[] = [];
  for (const [key, value] of Object.entries(filters)) {
    if (value == null) continue;
    if (LIST_COLUMNS.has(key)) {
      clauses.push(`array_to_string(${key}, '||') LIKE '%${value}%'`);
    } else if (LIKE_COLUMNS.has(key)) {
      clauses.push(`${key} LIKE '%${value}%'`);
    } else if (typeof value === "string") {
      clauses.push(`${key} = '${value.replace(/'/g, "''")}'`);
    } else if (typeof value === "boolean") {
      clauses.push(`${key} = ${value}`);
    } else {
      clauses.push(`${key} = ${value}`);
    }
  }
  return clauses.join(" AND ");
}
```

### Query Timeout Wrapper

```typescript
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Query timed out after ${ms}ms: ${label}`)),
      ms
    );
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); },
    );
  });
}
```

### Binary Column Stripping

```typescript
const BINARY_COLUMNS = new Set(["gene_indices", "counts", "vector"]);

function cleanRow(row: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (BINARY_COLUMNS.has(key)) continue;
    if (value instanceof Date) cleaned[key] = value.toISOString();
    else if (typeof value === "bigint") cleaned[key] = Number(value);
    else cleaned[key] = value;
  }
  return cleaned;
}
```

## Pattern: Skill System (Runtime Knowledge Loading)

Allow the agent to discover and load specialized knowledge documents at runtime:

```typescript
// Skill registry: static array with name, description, tags, filesystem path
const SKILL_REGISTRY: SkillEntry[] = [
  { name: "my-skill", description: "...", tags: ["tag1"], path: ".claude/skills/my-skill/SKILL.md" },
];

// discoverSkills tool: keyword match against registry, return top matches
// loadSkill tool: read SKILL.md from disk, return content to the LLM

// Path resolution: walk up from process.cwd() to find repo root
// Fallback: hardcode absolute path as last resort
async function getRepoRoot(): Promise<string> {
  let dir = process.cwd();
  for (let i = 0; i < 10; i++) {
    try {
      await fs.access(path.join(dir, ".claude", "skills"));
      return dir;
    } catch {
      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  }
  return "/absolute/fallback/path";
}
```

## Pattern: Neo-Brutalism Design System (No Component Library)

### CSS Utilities (globals.css)

```css
@import "tailwindcss";

@theme inline {
  --color-primary: #0d6efd;
  --color-secondary: #f0f4f8;
  --color-accent: #ff6b35;
  --color-border: #000000;
  --color-muted: #94a3b8;
  --font-heading: "Archivo Black", sans-serif;
  --font-body: "Space Grotesk", sans-serif;
}

.neo-border { border: 3px solid #000; }
.neo-shadow { box-shadow: 4px 4px 0 #000; }
.neo-btn {
  border: 3px solid #000;
  box-shadow: 4px 4px 0 #000;
  transition: transform 0.1s, box-shadow 0.1s;
}
.neo-btn:hover { transform: translate(1px, 1px); box-shadow: 3px 3px 0 #000; }
.neo-btn:active { transform: translate(2px, 2px); box-shadow: 2px 2px 0 #000; }
```

### Google Fonts (layout.tsx)

```html
<head>
  <link
    href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Space+Grotesk:wght@300;400;500;600;700&display=swap"
    rel="stylesheet"
  />
</head>
```

### Terminal Spinner Animation

```css
@keyframes terminal-spin {
  0% { content: "\2807"; } 10% { content: "\2819"; } 20% { content: "\2839"; }
  30% { content: "\2838"; } 40% { content: "\283C"; } 50% { content: "\2834"; }
  60% { content: "\2826"; } 70% { content: "\2827"; } 80% { content: "\2807"; } 90% { content: "\280F"; }
}
.terminal-spinner { display: inline-block; font-size: 0; }
.terminal-spinner::before {
  content: "\2807";
  font-size: 14px;
  animation: terminal-spin 0.8s steps(1) infinite;
  color: var(--color-primary);
}
```

## Pattern: Monorepo via Git Worktree

When the webapp lives inside a larger project:

```bash
# From parent repo root
git worktree add .claude/worktrees/webapp -b webapp
cd .claude/worktrees/webapp
npx create-next-app@latest . --typescript --tailwind --app --src-dir
```

Benefits:
- Webapp has its own `node_modules`, `package.json`, `.next` -- no conflicts with parent
- Webapp can read parent repo files (skills, data) via `fs.readFile` with path walking
- Separate git branch keeps commits clean
- Parent `.gitignore` should include `.claude/worktrees/*/node_modules` and `.claude/worktrees/*/.next`

## Gotchas and Hard-Won Lessons

### 1. serverExternalPackages (CRITICAL for native modules)

LanceDB and Apache Arrow are native Node.js modules. They MUST be listed in `next.config.ts`:
```typescript
serverExternalPackages: ["@lancedb/lancedb", "apache-arrow"],
```
Without this, Next.js tries to bundle them with webpack and the build fails with cryptic native module errors. This applies to ANY native Node module.

### 2. React Compiler Setup

Requires BOTH:
- `babel-plugin-react-compiler` as a devDependency
- `reactCompiler: true` in `next.config.ts`

Missing either one silently disables it.

### 3. Vercel AI SDK v6 Breaking Changes from v5

- `useChat` no longer accepts `api` prop directly -- use `DefaultChatTransport`
- Messages are `UIMessage` with `.parts` array, not `Message` with `.content` string
- `sendMessage({ text })` not `sendMessage(text)` or `append()`
- `isToolUIPart()` replaces manual type checking
- `ToolLoopAgent` + `createAgentUIStreamResponse` replaces `streamText` + manual tool loop
- `getToolName(part)` extracts tool name from a tool UI part

### 4. Zod v4 Breaking Changes from v3

- Some schema methods renamed or have different behavior
- Check migration guide before assuming v3 patterns work

### 5. Tailwind v4 Setup

- Uses `@tailwindcss/postcss` plugin, NOT the v3 `tailwindcss` PostCSS plugin
- `@theme inline` block replaces `tailwind.config.ts` for theme customization
- `@import "tailwindcss"` replaces the old `@tailwind base/components/utilities` directives

### 6. LanceDB List Columns

Arrow List types (arrays) cannot use `=` in WHERE clauses. Use:
```sql
array_to_string(column_name, '||') LIKE '%value%'
```
NOT `column_name = 'value'` or `array_contains(column_name, 'value')`.

### 7. LanceDB FTS on S3

Full-text search indexes do NOT work on S3-backed LanceDB tables. Fall back to SQL LIKE queries or pull small tables to pandas.

### 8. Large Table Safety

For tables with millions of rows, enforce mandatory filters and row caps in the query layer:
```typescript
if (tableName === "large_table") {
  if (!filters || Object.keys(filters).length === 0) {
    return { error: "At least one filter required" };
  }
}
const effectiveLimit = Math.min(limit, 100);
```

### 9. Streaming State Management

Track `isStreaming` as `status === "streaming" || status === "submitted"` and use it for:
- Disabling the send button
- Showing the stop button
- Showing a spinner on the LAST message only (`isStreaming && index === messages.length - 1`)
- Auto-scrolling to bottom on new content

### 10. Path Resolution for Skills/Data

Walking up directories to find repo root is fragile in Next.js (cwd varies between dev/build/production). Always include a hardcoded fallback absolute path:
```typescript
// Last resort fallback
return "/absolute/path/to/repo";
```

### 11. Binary/BigInt in JSON Responses

Arrow binary columns and BigInt values crash `JSON.stringify`. Strip binary columns and convert BigInts before returning from tools.

## Environment Variables

```
ANTHROPIC_API_KEY=sk-ant-...     # Required for Claude
LANCEDB_URI=s3://bucket/path     # Or local path
AWS_ACCESS_KEY_ID=...            # If using S3
AWS_SECRET_ACCESS_KEY=...        # If using S3
AWS_DEFAULT_REGION=us-east-2     # If using S3
LANCEDB_QUERY_TIMEOUT_MS=60000  # Optional, default 60s
```

## Dependencies

- Used by: Any project needing an AI agent webapp
- Uses: Vercel AI SDK v6, Anthropic Claude API, Next.js App Router

## Testing Checklist

- `npm run dev` starts without errors
- Chat sends a message and receives a streaming response
- Tool calls appear in the UI with running/complete states
- Stop button aborts the stream
- Error states display correctly (API key missing, tool failure)
- LanceDB queries return results (if database integration enabled)
- `npm run build` succeeds (catches serverExternalPackages issues)
