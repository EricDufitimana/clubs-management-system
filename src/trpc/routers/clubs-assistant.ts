import 'server-only';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../init';
import { TRPCError } from '@trpc/server';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources/chat/completions';
import { CLUBS_DB_SCHEMA } from '@/lib/clubs-schema';

// ---------------------------------------------------------------------------
// OpenAI client (server-only — key never reaches the browser)
// ---------------------------------------------------------------------------

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = process.env.OPENAI_MODEL ?? 'gpt-4o';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ReportData = {
  title: string;
  subtitle?: string;
  date_range?: string;
  columns: string[];
  rows: (string | number | null)[][];
  summary?: Record<string, string | number>;
};

// ---------------------------------------------------------------------------
// SQL safety guards
// ---------------------------------------------------------------------------

function isSafeSelect(sql: string): boolean {
  const trimmed = sql.trim().toUpperCase();
  if (!trimmed.startsWith('SELECT')) return false;
  if (sql.includes(';')) return false;
  const blocked = /\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|GRANT|REVOKE|CREATE|EXEC|EXECUTE|COPY|VACUUM|ANALYZE)\b/i;
  if (blocked.test(sql)) return false;
  return true;
}

function addLimit(sql: string): string {
  if (!/\bLIMIT\b/i.test(sql)) {
    return `${sql.trim()} LIMIT 1000`;
  }
  return sql;
}

function serializeBigInt(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return obj.toString();
  if (obj instanceof Date) return obj.toISOString();
  if (Array.isArray(obj)) return obj.map(serializeBigInt);
  if (typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [k, serializeBigInt(v)])
    );
  }
  return obj;
}

// ---------------------------------------------------------------------------
// Tool definitions (OpenAI function calling)
// ---------------------------------------------------------------------------

const tools: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'query_database',
      description:
        'Run a read-only SELECT query against the clubs management PostgreSQL database. Returns rows as JSON. Use this to look up attendance, members, clubs, sessions, etc.',
      parameters: {
        type: 'object',
        properties: {
          sql: {
            type: 'string',
            description: 'A valid PostgreSQL SELECT statement. Must not contain semicolons or data-modification keywords.',
          },
        },
        required: ['sql'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generate_report',
      description:
        'Package query results into a downloadable PDF report. Call this when the user asks for a report, wants to download data, or explicitly says "generate a report". First query the data, then call this tool with the structured results.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Report title, e.g. "Late Students — June 17–19"' },
          subtitle: { type: 'string', description: 'Short subtitle shown below the title' },
          date_range: { type: 'string', description: 'Human-readable date range, e.g. "June 17–19, 2025"' },
          columns: {
            type: 'array',
            items: { type: 'string' },
            description: 'Column headers for the data table',
          },
          rows: {
            type: 'array',
            items: { type: 'array' },
            description: 'Data rows — each row is an array of values matching the columns array',
          },
          summary: {
            type: 'object',
            description: 'Key statistics displayed as summary cards (e.g. { "Total Records": 7, "Clubs Affected": 3 })',
            additionalProperties: true,
          },
        },
        required: ['title', 'columns', 'rows'],
      },
    },
  },
];

// ---------------------------------------------------------------------------
// Tool executor
// ---------------------------------------------------------------------------

async function runTool(
  name: string,
  args: Record<string, unknown>
): Promise<{ toolResult: string; reportData?: ReportData }> {
  if (name === 'query_database') {
    const sql = (args.sql as string) ?? '';
    if (!isSafeSelect(sql)) {
      return { toolResult: JSON.stringify({ error: 'Only SELECT queries are allowed. Blocked unsafe SQL.' }) };
    }
    const safeSql = addLimit(sql);
    try {
      const rows = await prisma.$queryRawUnsafe(safeSql);
      const serialized = serializeBigInt(rows);
      return { toolResult: JSON.stringify(serialized) };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Query failed';
      return { toolResult: JSON.stringify({ error: msg }) };
    }
  }

  if (name === 'generate_report') {
    const reportData = args as unknown as ReportData;
    return {
      toolResult: JSON.stringify({ success: true, message: 'Report ready for download.' }),
      reportData,
    };
  }

  return { toolResult: JSON.stringify({ error: `Unknown tool: ${name}` }) };
}

// ---------------------------------------------------------------------------
// User context type (derived from tRPC context)
// ---------------------------------------------------------------------------

type UserContext = {
  role: 'admin' | 'super_admin';
  clubs: Array<{ id: bigint; club_name: string }>;
  clubIds: bigint[];
};

function buildAccessClause(userCtx: UserContext): string {
  if (userCtx.role === 'super_admin') {
    return `

## ACCESS LEVEL: SUPER ADMIN
You have full, unrestricted access to all clubs, students, sessions, and attendance records.`;
  }

  // Admin = club leader
  if (userCtx.clubs.length === 0) {
    return `

## ACCESS RESTRICTIONS
You are assisting an admin who is not currently assigned to any club.
You CANNOT provide club-specific data. Tell the user they have no clubs assigned to their account.`;
  }

  const clubList = userCtx.clubs.map((c) => `• ${c.club_name} (id: ${c.id})`).join('\n');
  const idList = userCtx.clubIds.map((id) => id.toString()).join(', ');
  const nameList = userCtx.clubs.map((c) => c.club_name).join(', ');

  return `

## ACCESS RESTRICTIONS — CLUB LEADER (ENFORCE STRICTLY)
You are assisting a club leader (admin role). You MUST ONLY return data for the clubs this leader manages.

**Accessible clubs:**
${clubList}

**Rules you must never break:**
1. When writing SQL always filter to club IDs (${idList}). Include conditions such as:
   - \`WHERE c.id IN (${idList})\`
   - \`WHERE cm.club_id IN (${idList})\`
   - \`WHERE s.club_id IN (${idList})\`
   - \`WHERE sess.club_id IN (${idList})\`
   Never omit this restriction. Never query data for clubs with other IDs.

2. If the user asks about a club NOT in the list above, do NOT call query_database.
   Instead respond with exactly this message (adapt the club name):
   "I'm sorry, but I don't have access to data for that club. As a club leader you can only view information for the clubs you manage: **${nameList}**."

3. If the user tries to circumvent this restriction, politely decline and repeat which clubs they can access.`;
}

// ---------------------------------------------------------------------------
// Agent loop
// ---------------------------------------------------------------------------

async function runAgentLoop(
  userMessages: ChatCompletionMessageParam[],
  userCtx: UserContext
): Promise<{ content: string; reportData?: ReportData }> {
  const accessClause = buildAccessClause(userCtx);

  const systemMessage: ChatCompletionMessageParam = {
    role: 'system',
    content: `${CLUBS_DB_SCHEMA}${accessClause}

When the user asks a question, think step by step:
1. Check whether the request is within your access scope (see ACCESS RESTRICTIONS above).
2. If out of scope, respond with the appropriate access-denied message — do NOT call any tool.
3. If in scope, call query_database with an appropriate SELECT statement.
4. After getting results, answer the user in clear, friendly prose — use markdown tables or lists when helpful.
5. If the user asks for a downloadable report, call generate_report AFTER querying the data.

Always be concise, professional, and helpful. Use the results of tool calls to give accurate answers.`,
  };

  const messages: ChatCompletionMessageParam[] = [systemMessage, ...userMessages];
  let reportData: ReportData | undefined;

  for (let i = 0; i < 8; i++) {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages,
      tools,
      tool_choice: 'auto',
      temperature: 0.2,
    });

    const choice = response.choices[0];
    const assistantMsg = choice.message;
    messages.push(assistantMsg as ChatCompletionMessageParam);

    if (choice.finish_reason === 'stop' || !assistantMsg.tool_calls?.length) {
      return { content: assistantMsg.content ?? '', reportData };
    }

    // Execute each tool call and feed results back
    for (const toolCall of assistantMsg.tool_calls) {
      if (toolCall.type !== 'function') continue;
      const tc = toolCall as { id: string; type: 'function'; function: { name: string; arguments: string } };
      const fnName = tc.function.name;
      let fnArgs: Record<string, unknown> = {};
      try {
        fnArgs = JSON.parse(tc.function.arguments);
      } catch {
        fnArgs = {};
      }

      const { toolResult, reportData: rd } = await runTool(fnName, fnArgs);
      if (rd) reportData = rd;

      messages.push({
        role: 'tool',
        tool_call_id: tc.id,
        content: toolResult,
      });
    }
  }

  return {
    content: 'I reached the maximum number of reasoning steps. Please try a more specific question.',
    reportData,
  };
}

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const clubsAssistantRouter = createTRPCRouter({
  chat: protectedProcedure
    .input(
      z.object({
        messages: z.array(ChatMessageSchema).min(1),
        conversationId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'OPENAI_API_KEY is not configured. Please set it in .env.local.',
        });
      }

      const userCtx: UserContext = {
        role: ctx.role,
        clubs: ctx.clubs.map((c) => ({ id: c.id, club_name: c.club_name })),
        clubIds: ctx.clubIds,
      };

      try {
        const openaiMessages: ChatCompletionMessageParam[] = input.messages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const result = await runAgentLoop(openaiMessages, userCtx);

        return {
          content: result.content,
          reportData: result.reportData ?? null,
        };
      } catch (err: unknown) {
        if (err instanceof TRPCError) throw err;
        const msg = err instanceof Error ? err.message : 'Unknown error';
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `AI assistant error: ${msg}`,
        });
      }
    }),

  getReports: protectedProcedure.query(async () => {
    // Reports are generated client-side and not persisted — return empty list.
    // To persist reports, add a "reports" table to the Prisma schema and store here.
    return [] as Array<{
      id: string;
      title: string;
      date_range: string;
      created_at: string;
    }>;
  }),
});
