import type { RegisteredTool, ToolCallPlan, ToolExecutionResult } from "./types.js";

type OllamaToolCall = {
  function?: {
    name?: string;
    arguments?: Record<string, unknown> | string;
  };
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

export class OllamaClient {
  constructor(
    private readonly baseUrl: string,
    private readonly model: string
  ) {}

  async planToolCalls(message: string, tools: RegisteredTool[]): Promise<{ content: string; toolCalls: ToolCallPlan[] }> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        stream: false,
        messages: [
          {
            role: "system",
            content:
              "You route student campus questions to tools. Always call the best provided tool when campus data is needed. Use the smallest useful set of tools. Prefer exact filters: for books by course, use search_books with query \"\" and course like \"CS\", \"CS305\", \"ECE\", or \"IT\"; for known book titles, use the title as bookIdOrTitle; for menus/events/policies, pick the matching domain tool. Do not answer from memory when a tool can answer."
          },
          {
            role: "user",
            content: message
          }
        ],
        tools: tools.map((tool) => ({
          type: "function",
          function: {
            name: tool.qualifiedName,
            description: `${tool.domain}: ${tool.description ?? tool.name}`,
            parameters: tool.inputSchema
          }
        }))
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama responded with ${response.status}`);
    }

    const payload = (await response.json()) as {
      message?: {
        content?: string;
        tool_calls?: OllamaToolCall[];
      };
    };

    const toolCalls =
      payload.message?.tool_calls?.flatMap((call): ToolCallPlan[] => {
        const qualifiedName = call.function?.name;
        if (!qualifiedName) return [];
        return [
          {
            qualifiedName,
            arguments: asArgs(call.function?.arguments),
            reason: "Ollama selected this MCP tool."
          }
        ];
      }) ?? [];

    return {
      content: payload.message?.content ?? "",
      toolCalls
    };
  }

  async synthesizeAnswer(message: string, results: ToolExecutionResult[]) {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        stream: false,
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
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama responded with ${response.status}`);
    }

    const payload = (await response.json()) as { message?: { content?: string } };
    return payload.message?.content?.trim() ?? "";
  }
}
