import "dotenv/config";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import { composeFallbackAnswer } from "./answerComposer.js";
import { filterToolsForRole, hasAdminIntent, partitionToolCallsByRole } from "./authorization.js";
import { authenticate, initializeAuth, login, me, register, type AuthenticatedRequest } from "./auth.js";
import { fallbackRoute } from "./fallbackRouter.js";
import { McpClientManager } from "./mcpClientManager.js";
import { OllamaClient } from "./ollamaClient.js";
import type { ChatResponse, McpEndpoint, ToolCallPlan } from "./types.js";

const port = Number(process.env.API_PORT ?? 4000);
const ollamaBaseUrl = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
const ollamaModel = process.env.OLLAMA_MODEL ?? "gpt-oss:20b";

const endpoints: McpEndpoint[] = [
  { domain: "library", label: "Library", url: process.env.LIBRARY_MCP_URL ?? "http://localhost:4101/mcp" },
  { domain: "cafeteria", label: "Cafeteria", url: process.env.CAFETERIA_MCP_URL ?? "http://localhost:4102/mcp" },
  { domain: "events", label: "Events", url: process.env.EVENTS_MCP_URL ?? "http://localhost:4103/mcp" },
  { domain: "academics", label: "Academics", url: process.env.ACADEMICS_MCP_URL ?? "http://localhost:4104/mcp" }
];

const chatSchema = z.object({
  message: z.string().min(1)
});

const manager = new McpClientManager(endpoints);
const ollama = new OllamaClient(ollamaBaseUrl, ollamaModel);
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
    ollama: { baseUrl: ollamaBaseUrl, model: ollamaModel },
    mcpServers: endpoints
  });
});

app.post("/api/auth/register", asyncHandler(register));
app.post("/api/auth/login", asyncHandler(login));
app.get("/api/auth/me", requireAuth, asyncHandler(me as unknown as (req: Request, res: Response, next: NextFunction) => Promise<void>));

app.get("/api/tools", requireAuth, asyncHandler(async (req, res) => {
  const result = await manager.listTools();
  const user = (req as AuthenticatedRequest).user;
  res.json({
    tools: filterToolsForRole(result.tools, user.role),
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
  const allowedTools = filterToolsForRole(tools, user.role);

  if (user.role === "student" && hasAdminIntent(message)) {
    const response: ChatResponse = {
      answer: "You are signed in as a student, so you cannot perform admin actions like creating, updating, deleting, publishing, or marking campus records. You can still ask to view books, menus, events, policies, schedules, and your own student-related information.",
      model: ollamaModel,
      usedOllama: false,
      usedFallbackRouter: false,
      toolCalls: [],
      toolResults: [],
      unavailableServers
    };
    res.json(response);
    return;
  }

  let usedOllama = false;
  let usedFallbackRouter = false;
  let toolCalls: ToolCallPlan[] = [];
  let ollamaPlanningContent = "";

  if (allowedTools.length > 0) {
    try {
      const plan = await ollama.planToolCalls(message, allowedTools);
      usedOllama = true;
      ollamaPlanningContent = plan.content;
      toolCalls = plan.toolCalls.filter((call) => allowedTools.some((tool) => tool.qualifiedName === call.qualifiedName));
    } catch {
      usedOllama = false;
    }
  }

  if (toolCalls.length === 0) {
    usedFallbackRouter = true;
    toolCalls = fallbackRoute(message, user.id);
  }

  const partitioned = partitionToolCallsByRole(toolCalls, tools, user.role);
  toolCalls = partitioned.allowed;

  if (toolCalls.length === 0 && partitioned.denied.length > 0) {
    const response: ChatResponse = {
      answer: "You are signed in as a student, so you cannot perform that admin action. Please ask an admin user to make changes to campus records.",
      model: ollamaModel,
      usedOllama,
      usedFallbackRouter,
      toolCalls: [],
      toolResults: [],
      unavailableServers
    };
    res.json(response);
    return;
  }

  const toolResults = await Promise.all(
    toolCalls.map(async (call) => {
      const result = await manager.callQualifiedTool(call.qualifiedName, call.arguments);
      result.reason = call.reason;
      return result;
    })
  );

  let answer = "";
  if (usedOllama && toolResults.some((result) => result.ok)) {
    try {
      answer = await ollama.synthesizeAnswer(message, toolResults);
    } catch {
      answer = composeFallbackAnswer(message, toolResults);
    }
  } else if (ollamaPlanningContent && toolResults.length === 0) {
    answer = ollamaPlanningContent;
  } else {
    answer = composeFallbackAnswer(message, toolResults);
  }

  const response: ChatResponse = {
    answer,
    model: ollamaModel,
    usedOllama,
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
