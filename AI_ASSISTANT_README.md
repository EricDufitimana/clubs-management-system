# AI Assistant — Clubs Management System

A conversational AI tab embedded in the dashboard that answers natural-language questions
about clubs, members, and attendance — and generates downloadable PDF reports on demand.

---

## How it works

```
User types a message
       │
       ▼
tRPC mutation  ─── clubs-assistant.ts (server-only)
       │
       ▼
OpenAI gpt-4o (function calling)
       │
   ┌───┴─────────────────────────┐
   │  Tool: query_database       │  ←── Prisma $queryRawUnsafe (SELECT only)
   │  Tool: generate_report      │  ←── Returns structured data to client
   └─────────────────────────────┘
       │
       ▼
Final assistant text + optional reportData
       │
       ▼
Chat UI renders markdown ─── "Download PDF" button generates PDF client-side (jsPDF)
```

The agent runs a **multi-step tool loop** (up to 8 iterations): it may call
`query_database` to fetch data, then call `generate_report` to package it,
then return a final natural-language answer — all in a single tRPC request.

---

## Where the schema lives

**`src/lib/clubs-schema.ts`** — single file. It exports `CLUBS_DB_SCHEMA`, a multi-line
string injected as the agent's system prompt. It describes every table, column, type, and
relationship, plus example SQL queries.

**When to update it:** any time you add/rename/remove a Prisma model, column, or enum.
Restart the dev server after editing — the string is evaluated at module load time.

---

## Swapping the model

In `.env.local`, change:

```
OPENAI_MODEL="gpt-4o"
```

to any OpenAI chat model ID (e.g. `gpt-4o-mini`, `gpt-4-turbo`). The default is `gpt-4o`.

The variable is read in `src/trpc/routers/clubs-assistant.ts`:

```typescript
const MODEL = process.env.OPENAI_MODEL ?? 'gpt-4o';
```

No code change needed — environment variable only.

---

## Adding the OpenAI key

The key must be set in `.env.local` (never committed to git):

```
OPENAI_API_KEY="sk-..."
```

The router checks for a missing/placeholder key and returns a `PRECONDITION_FAILED`
tRPC error with a clear message before calling OpenAI.

---

## SQL safety

`query_database` runs `prisma.$queryRawUnsafe` with four guards:

| Guard | What it blocks |
|-------|----------------|
| Must start with `SELECT` | INSERT, UPDATE, DELETE, DROP, etc. |
| No semicolons | Multi-statement injection |
| Keyword blocklist | ALTER, TRUNCATE, GRANT, EXEC, COPY, … |
| Auto-appended `LIMIT 1000` | Runaway full-table scans |

All keys stay server-side — the OpenAI key and database credentials never reach the browser.

---

## PDF reports

Reports are generated **client-side** using `jspdf` + `jspdf-autotable` (already in
`package.json`). The server returns structured data; the browser renders the PDF and
triggers a download without any file storage required.

The PDF layout includes:
- Full-width blue header band with system name and timestamp
- Title, subtitle, and date range block
- Summary stat cards (computed from the data)
- Zebra-striped data table with repeating headers across page breaks
- Footer with page numbers and generation date

---

## File map

| File | Purpose |
|------|---------|
| `src/lib/clubs-schema.ts` | Schema description fed to the AI agent — update this when the DB changes |
| `src/trpc/routers/clubs-assistant.ts` | Server-side agent: OpenAI tool loop, SQL safety, tRPC procedures |
| `src/sections/ai-assistant/view/ai-assistant-view.tsx` | Chat UI component |
| `src/app/dashboard/ai-assistant/page.tsx` | Next.js App Router page |
| `src/layouts/nav-config-dashboard.tsx` | Sidebar nav — AI Assistant item added to both admin and super-admin |

---

## Extending

- **Add a tool:** define it in the `tools` array in `clubs-assistant.ts` and add a
  matching branch in `runTool()`.
- **Persist reports:** create a `reports` Prisma model, write to it in `generate_report`,
  and update `getReports` to query it.
- **Streaming:** add a `/api/clubs-assistant/stream` App Router route handler that
  uses `openai.chat.completions.stream()` and returns a `ReadableStream` — then swap
  the tRPC mutation for a `fetch` call in the UI.
