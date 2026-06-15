import "dotenv/config";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import { composeFallbackAnswer } from "./answerComposer.js";
import { authenticate, initializeAuth, login, me, register, type AuthenticatedRequest } from "./auth.js";
import { fallbackRoute } from "./fallbackRouter.js";
import { LlmClient } from "./llmClient.js";
import { McpClientManager } from "./mcpClientManager.js";
import type { ChatResponse, McpEndpoint, ToolCallPlan } from "./types.js";

const port = Number(process.env.API_PORT ?? 4000);
const llmBaseUrl = process.env.GROQ_BASE_URL ?? "https://api.groq.com/openai/v1";
const llmModel = process.env.GROQ_MODEL ?? "openai/gpt-oss-20b";
const llmApiKey = process.env.GROQ_API_KEY ?? "";

const endpoints: McpEndpoint[] = [
  { domain: "library", label: "Library", url: process.env.LIBRARY_MCP_URL ?? "http://localhost:4101/mcp" },
  { domain: "cafeteria", label: "Cafeteria", url: process.env.CAFETERIA_MCP_URL ?? "http://localhost:4102/mcp" },
  { domain: "events", label: "Events", url: process.env.EVENTS_MCP_URL ?? "http://localhost:4103/mcp" },
  { domain: "academics", label: "Academics", url: process.env.ACADEMICS_MCP_URL ?? "http://localhost:4104/mcp" }
];

const chatSchema = z.object({
  message: z.string().min(1)
});

const campusRecordWritePattern = /\b(create|add|insert|update|edit|delete|remove|mark|publish)\b/i;
const studentSelfServicePattern = /\b(register for|sign up|reserve|renew|cancel.*registration|cancel.*reservation|rate|feedback)\b/i;
const missingAnswerPattern = /\b(couldn'?t find|could not find|don'?t have|do not have|no information|not available|sorry)\b/i;

const isCampusRecordWriteRequest = (message: string) =>
  campusRecordWritePattern.test(message) && !studentSelfServicePattern.test(message);

const hasUsefulFallbackAnswer = (answer: string) =>
  answer.trim().length > 0 && !answer.startsWith("I could not");

const manager = new McpClientManager(endpoints);
const llm = new LlmClient({
  baseUrl: llmBaseUrl,
  apiKey: llmApiKey,
  model: llmModel
});
const app = express();

const asyncHandler =
  (handler: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    handler(req, res, next).catch(next);
  };

const requireAuth = asyncHandler(authenticate);

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "campus-ai-backend",
    llm: { baseUrl: llmBaseUrl, model: llmModel, apiKeyConfigured: Boolean(llmApiKey) },
    mcpServers: endpoints
  });
});

app.post("/api/auth/register", asyncHandler(register));
app.post("/api/auth/login", asyncHandler(login));
app.get("/api/auth/me", requireAuth, asyncHandler(me as unknown as (req: Request, res: Response, next: NextFunction) => Promise<void>));

app.get("/api/tools", requireAuth, asyncHandler(async (_req, res) => {
  const result = await manager.listTools();
  res.json({
    tools: result.tools,
    unavailableServers: result.unavailableServers
  });
}));

app.get("/api/dashboard", requireAuth, asyncHandler(async (_req, res) => {
  const calls: ToolCallPlan[] = [
    { qualifiedName: "library__get_popular_books", arguments: { limit: 3 }, reason: "Dashboard card." },
    { qualifiedName: "cafeteria__get_today_menu", arguments: {}, reason: "Dashboard card." },
    { qualifiedName: "events__get_upcoming_events", arguments: { limit: 4 }, reason: "Dashboard card." },
    { qualifiedName: "academics__get_department_notices", arguments: {}, reason: "Dashboard card." }
  ];
  const toolResults = await Promise.all(calls.map((call) => manager.callQualifiedTool(call.qualifiedName, call.arguments)));
  res.json({ cards: toolResults });
}));

app.post("/api/chat", requireAuth, asyncHandler(async (req, res) => {
  const parsed = chatSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { message } = parsed.data;
  const user = (req as AuthenticatedRequest).user;
  const { tools, unavailableServers } = await manager.listTools();

  if (isCampusRecordWriteRequest(message)) {
    const response: ChatResponse = {
      answer: "This student dashboard is read-only for campus records, so I cannot create, update, delete, publish, or mark official library, cafeteria, event, or academic data. You can still ask me to search books, check availability, view menus, find events, read policies, and use student actions like reservations or event registration.",
      model: llmModel,
      usedLlm: false,
      usedFallbackRouter: false,
      toolCalls: [],
      toolResults: [],
      unavailableServers
    };
    res.json(response);
    return;
  }

  let usedLlm = false;
  let usedFallbackRouter = false;
  let toolCalls: ToolCallPlan[] = [];
  let llmPlanningContent = "";

  if (tools.length > 0) {
    try {
      const plan = await llm.planToolCalls(message, tools);
      usedLlm = true;
      llmPlanningContent = plan.content;
      toolCalls = plan.toolCalls.filter((call) => tools.some((tool) => tool.qualifiedName === call.qualifiedName));
    } catch {
      usedLlm = false;
    }
  }

  if (toolCalls.length === 0) {
    usedFallbackRouter = true;
    toolCalls = fallbackRoute(message, user.id);
  }

  const toolResults = await Promise.all(
    toolCalls.map(async (call) => {
      const result = await manager.callQualifiedTool(call.qualifiedName, call.arguments);
      result.reason = call.reason;
      return result;
    })
  );

  let answer = "";
  const fallbackAnswer = composeFallbackAnswer(message, toolResults);
  if (usedLlm && toolResults.some((result) => result.ok)) {
    try {
      answer = await llm.synthesizeAnswer(message, toolResults);
      if (missingAnswerPattern.test(answer) && hasUsefulFallbackAnswer(fallbackAnswer)) {
        answer = fallbackAnswer;
      }
    } catch {
      answer = fallbackAnswer;
    }
  } else if (llmPlanningContent && toolResults.length === 0) {
    answer = llmPlanningContent;
  } else {
    answer = fallbackAnswer;
  }

  const response: ChatResponse = {
    answer,
    model: llmModel,
    usedLlm,
    usedFallbackRouter,
    toolCalls,
    toolResults,
    unavailableServers
  };

  res.json(response);
}));

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  res.status(500).json({
    error: error instanceof Error ? error.message : "Internal server error"
  });
});

initializeAuth()
  .catch((error) => {
    console.warn(
      `Auth table could not be verified. Register/login requires Postgres: ${
        error instanceof Error ? error.message : "unknown database error"
      }`
    );
  })
  .finally(() => {
    app.listen(port, () => {
      console.log(`Campus AI backend listening on http://localhost:${port}`);
    });
});
