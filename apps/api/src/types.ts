import type { StudentContext } from "@campus/shared";

export type McpDomain = "library" | "cafeteria" | "events" | "academics";

export type McpEndpoint = {
  domain: McpDomain;
  label: string;
  url: string;
};

export type RegisteredTool = {
  domain: McpDomain;
  name: string;
  qualifiedName: string;
  description?: string;
  inputSchema: Record<string, unknown>;
};

export type ToolCallPlan = {
  qualifiedName: string;
  arguments: Record<string, unknown>;
  reason: string;
};

export type ToolExecutionResult = ToolCallPlan & {
  domain: McpDomain;
  toolName: string;
  ok: boolean;
  data?: unknown;
  error?: string;
};

export type ChatRequest = {
  message: string;
  student?: StudentContext;
};

export type ChatResponse = {
  answer: string;
  model: string;
  usedOllama: boolean;
  usedFallbackRouter: boolean;
  toolCalls: ToolCallPlan[];
  toolResults: ToolExecutionResult[];
  unavailableServers: string[];
};
