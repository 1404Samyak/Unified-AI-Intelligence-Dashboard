import "dotenv/config";
import { createCampusServer, startMcpHttpServer } from "@campus/mcp-common";
import { EventsRepository } from "./repository.js";
import { EventsService } from "./service.js";
import { registerEventsTools } from "./tools.js";

const port = Number(process.env.EVENTS_MCP_PORT ?? 4103);

startMcpHttpServer({
  port,
  label: "Events",
  buildServer: async () => {
    const server = createCampusServer("campus-events-mcp");
    const repository = new EventsRepository();
    await repository.loadFromDatabase();
    const service = new EventsService(repository);
    registerEventsTools(server, service);
    return server;
  }
});
