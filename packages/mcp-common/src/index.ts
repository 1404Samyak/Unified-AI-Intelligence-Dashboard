import { randomUUID } from "node:crypto";
import cors from "cors";
import express, { type Request, type Response } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import type { z } from "zod";

type JsonToolHandler<TArgs> = (args: TArgs) => Promise<unknown> | unknown;

export const createCampusServer = (name: string, version = "0.1.0") =>
  new McpServer({
    name,
    version
  });

export function registerJsonTool<TShape extends z.ZodRawShape>(
  server: McpServer,
  name: string,
  description: string,
  inputSchema: TShape,
  handler: JsonToolHandler<z.objectOutputType<TShape, z.ZodTypeAny>>
) {
  const registerTool = server.tool.bind(server) as unknown as (
    toolName: string,
    toolDescription: string,
    schema: TShape,
    callback: (args: unknown) => Promise<{ content: Array<{ type: "text"; text: string }> }>
  ) => void;

  registerTool(name, description, inputSchema, async (args) => {
    const payload = await handler(args as z.objectOutputType<TShape, z.ZodTypeAny>);
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(payload, null, 2)
        }
      ]
    };
  });
}

export function startMcpHttpServer(options: {
  port: number;
  label: string;
  buildServer: () => McpServer | Promise<McpServer>;
}) {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "2mb" }));

  const transports = new Map<string, StreamableHTTPServerTransport>();

  app.post("/mcp", async (req: Request, res: Response) => {
    try {
      const sessionId = req.headers["mcp-session-id"];
      let transport =
        typeof sessionId === "string" ? transports.get(sessionId) : undefined;

      if (!transport && isInitializeRequest(req.body)) {
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (newSessionId) => {
            if (transport) {
              transports.set(newSessionId, transport);
            }
          }
        });

        transport.onclose = () => {
          if (transport?.sessionId) {
            transports.delete(transport.sessionId);
          }
        };

        const server = await options.buildServer();
        await server.connect(transport);
      }

      if (!transport) {
        res.status(400).json({
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: "Bad Request: No valid MCP session"
          },
          id: null
        });
        return;
      }

      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message: error instanceof Error ? error.message : "Internal server error"
          },
          id: null
        });
      }
    }
  });

  const handleSessionRequest = async (req: Request, res: Response) => {
    const sessionId = req.headers["mcp-session-id"];
    if (typeof sessionId !== "string" || !transports.has(sessionId)) {
      res.status(400).send("Invalid or missing MCP session id");
      return;
    }

    const transport = transports.get(sessionId);
    await transport?.handleRequest(req, res);
  };

  app.get("/mcp", handleSessionRequest);
  app.delete("/mcp", handleSessionRequest);

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: options.label });
  });

  app.listen(options.port, () => {
    console.log(`${options.label} MCP server listening on http://localhost:${options.port}/mcp`);
  });
}
