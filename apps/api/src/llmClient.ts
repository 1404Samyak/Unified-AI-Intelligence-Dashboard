import type { RegisteredTool, ToolCallPlan, ToolExecutionResult } from "./types.js";

type ApiToolCall = {
  function?: {
    name?: string;
    arguments?: Record<string, unknown> | string;
  };
};

type ChatMessage = {
  role: "system" | "user";
  content: string;
};

export type LlmConfig = {
  baseUrl: string;
  apiKey: string;
  model: string;
};

const asArgs = (value: unknown): Record<string, unknown> => {
  if (!value) return {};
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return typeof parsed === "object" && parsed ? (parsed as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }
  return typeof value === "object" ? (value as Record<string, unknown>) : {};
};

export class LlmClient {
  constructor(private readonly config: LlmConfig) {}

  get model() {
    return this.config.model;
  }

  get baseUrl() {
    return this.config.baseUrl;
  }

  private async chat(body: Record<string, unknown>) {
    if (!this.config.apiKey) {
      throw new Error("LLM API key is not configured");
    }

    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${this.config.apiKey}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: this.config.model,
        ...body
      })
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`LLM API responded with ${response.status}${detail ? `: ${detail.slice(0, 240)}` : ""}`);
    }

    return response.json() as Promise<{
      choices?: Array<{
        message?: {
          content?: string;
          tool_calls?: ApiToolCall[];
        };
      }>;
    }>;
  }

  async planToolCalls(message: string, tools: RegisteredTool[]): Promise<{ content: string; toolCalls: ToolCallPlan[] }> {
    const messages: ChatMessage[] = [
      {
        role: "system",
        content:
          "You route student campus questions to tools. Always call the best provided tool when campus data is needed. Use the smallest useful set of tools. Prefer exact filters: for books by course, use search_books with query \"\" and course like \"CS\", \"CS305\", \"ECE\", or \"IT\"; for known book titles, use the title as bookIdOrTitle; for menus/events/policies, pick the matching domain tool. Do not answer from memory when a tool can answer."
      },
      {
        role: "user",
        content: message
      }
    ];

    const payload = await this.chat({
      messages,
      tools: tools.map((tool) => ({
        type: "function",
        function: {
          name: tool.qualifiedName,
          description: `${tool.domain}: ${tool.description ?? tool.name}`,
          parameters: tool.inputSchema
        }
      })),
      tool_choice: "auto"
    });

    const selectedMessage = payload.choices?.[0]?.message;
    const toolCalls =
      selectedMessage?.tool_calls?.flatMap((call): ToolCallPlan[] => {
        const qualifiedName = call.function?.name;
        if (!qualifiedName) return [];
        return [
          {
            qualifiedName,
            arguments: asArgs(call.function?.arguments),
            reason: "LLM selected this MCP tool."
          }
        ];
      }) ?? [];

    return {
      content: selectedMessage?.content ?? "",
      toolCalls
    };
  }

  async synthesizeAnswer(message: string, results: ToolExecutionResult[]) {
    const payload = await this.chat({
      messages: [
        {
          role: "system",
          content:
            "You are a student-facing campus assistant. Use only the provided results. If a result contains books, menus, events, courses, policies, notices, due dates, or registrations, list the useful items directly. Never say you could not find information when the results contain matching data. Do not mention MCP, tools, tool calls, JSON, routing, backend systems, or internal source names unless the student explicitly asks how the system works. Be concise and natural."
        },
        {
          role: "user",
          content: `Student question: ${message}\n\nTool results JSON:\n${JSON.stringify(results, null, 2)}`
        }
      ]
    });

    return payload.choices?.[0]?.message?.content?.trim() ?? "";
  }
}
