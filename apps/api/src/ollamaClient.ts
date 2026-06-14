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
              "You are a campus AI router. Choose only the provided tools needed to answer the student's message. Use precise arguments. If multiple campus domains are needed, call multiple tools."
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
              "You are a helpful campus assistant. Answer using only the tool results. Be concise, mention the source domain names, and say when a tool failed."
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
