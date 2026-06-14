import "dotenv/config";
import cors from "cors";
import express from "express";
import { z } from "zod";
import { composeFallbackAnswer } from "./answerComposer.js";
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
  message: z.string().min(1),
  student: z
    .object({
      studentId: z.string().optional(),
      name: z.string().optional(),
      department: z.string().optional(),
      semester: z.number().optional(),
      dietaryPreference: z.enum(["veg", "non-veg", "jain", "vegan"]).optional(),
      interests: z.array(z.string()).optional()
    })
    .optional()
});

const manager = new McpClientManager(endpoints);
const ollama = new OllamaClient(ollamaBaseUrl, ollamaModel);
const app = express();

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

app.get("/api/tools", async (_req, res) => {
  const result = await manager.listTools();
  res.json(result);
});

app.get("/api/dashboard", async (_req, res) => {
  const calls: ToolCallPlan[] = [
    { qualifiedName: "library__get_popular_books", arguments: { limit: 3 }, reason: "Dashboard card." },
    { qualifiedName: "cafeteria__get_today_menu", arguments: {}, reason: "Dashboard card." },
    { qualifiedName: "events__get_upcoming_events", arguments: { limit: 4 }, reason: "Dashboard card." },
    { qualifiedName: "academics__get_department_notices", arguments: {}, reason: "Dashboard card." }
  ];
  const toolResults = await Promise.all(calls.map((call) => manager.callQualifiedTool(call.qualifiedName, call.arguments)));
  res.json({ cards: toolResults });
});

app.post("/api/chat", async (req, res) => {
  const parsed = chatSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { message, student } = parsed.data;
  const { tools, unavailableServers } = await manager.listTools();

  let usedOllama = false;
  let usedFallbackRouter = false;
  let toolCalls: ToolCallPlan[] = [];
  let ollamaPlanningContent = "";

  if (tools.length > 0) {
    try {
      const plan = await ollama.planToolCalls(message, tools);
      usedOllama = true;
      ollamaPlanningContent = plan.content;
      toolCalls = plan.toolCalls.filter((call) => tools.some((tool) => tool.qualifiedName === call.qualifiedName));
    } catch {
      usedOllama = false;
    }
  }

  if (toolCalls.length === 0) {
    usedFallbackRouter = true;
    toolCalls = fallbackRoute(message, student?.studentId);
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
});

app.listen(port, () => {
  console.log(`Campus AI backend listening on http://localhost:${port}`);
});
