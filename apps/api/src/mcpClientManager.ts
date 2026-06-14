import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { CallToolResultSchema, ListToolsResultSchema } from "@modelcontextprotocol/sdk/types.js";
import type { McpDomain, McpEndpoint, RegisteredTool, ToolExecutionResult } from "./types.js";

type ClientEntry = {
  endpoint: McpEndpoint;
  client?: Client;
  connected: boolean;
  lastError?: string;
};

const parseToolText = (value: unknown) => {
  if (!value || typeof value !== "object") return value;
  const content = (value as { content?: Array<{ type?: string; text?: string }> }).content;
  const text = content?.find((entry) => entry.type === "text")?.text;
  if (!text) return value;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

export class McpClientManager {
  private clients = new Map<McpDomain, ClientEntry>();

  constructor(endpoints: McpEndpoint[]) {
    for (const endpoint of endpoints) {
      this.clients.set(endpoint.domain, {
        endpoint,
        connected: false
      });
    }
  }

  async listTools() {
    const allTools: RegisteredTool[] = [];
    const unavailableServers: string[] = [];

    for (const entry of this.clients.values()) {
      try {
        const client = await this.ensureClient(entry);
        const result = await client.request({ method: "tools/list", params: {} }, ListToolsResultSchema);
        for (const tool of result.tools) {
          allTools.push({
            domain: entry.endpoint.domain,
            name: tool.name,
            qualifiedName: `${entry.endpoint.domain}__${tool.name}`,
            description: tool.description,
            inputSchema: (tool.inputSchema ?? { type: "object", properties: {} }) as Record<string, unknown>
          });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown MCP connection error";
        entry.lastError = message;
        entry.connected = false;
        unavailableServers.push(`${entry.endpoint.label}: ${message}`);
      }
    }

    return { tools: allTools, unavailableServers };
  }

  async callQualifiedTool(qualifiedName: string, args: Record<string, unknown>): Promise<ToolExecutionResult> {
    const [domain, ...toolParts] = qualifiedName.split("__");
    const toolName = toolParts.join("__");
    const entry = this.clients.get(domain as McpDomain);

    if (!entry || !toolName) {
      return {
        qualifiedName,
        arguments: args,
        reason: "Tool name did not match a known MCP domain.",
        domain: (domain || "library") as McpDomain,
        toolName: toolName || qualifiedName,
        ok: false,
        error: "Unknown MCP tool"
      };
    }

    try {
      const client = await this.ensureClient(entry);
      const result = await client.request(
        {
          method: "tools/call",
          params: {
            name: toolName,
            arguments: args
          }
        },
        CallToolResultSchema
      );

      return {
        qualifiedName,
        arguments: args,
        reason: "Selected by AI or fallback router.",
        domain: entry.endpoint.domain,
        toolName,
        ok: true,
        data: parseToolText(result)
      };
    } catch (error) {
      entry.connected = false;
      return {
        qualifiedName,
        arguments: args,
        reason: "Selected by AI or fallback router.",
        domain: entry.endpoint.domain,
        toolName,
        ok: false,
        error: error instanceof Error ? error.message : "Tool execution failed"
      };
    }
  }

  private async ensureClient(entry: ClientEntry) {
    if (entry.client && entry.connected) return entry.client;

    const client = new Client({
      name: "campus-ai-backend",
      version: "0.1.0"
    });
    const transport = new StreamableHTTPClientTransport(new URL(entry.endpoint.url));
    await client.connect(transport);

    entry.client = client;
    entry.connected = true;
    entry.lastError = undefined;
    return client;
  }
}
