import "dotenv/config";
import { createCampusServer, startMcpHttpServer } from "@campus/mcp-common";
import { AcademicsRepository } from "./repository.js";
import { AcademicsService } from "./service.js";
import { registerAcademicsTools } from "./tools.js";

const port = Number(process.env.ACADEMICS_MCP_PORT ?? 4104);

startMcpHttpServer({
  port,
  label: "Academics",
  buildServer: () => {
    const server = createCampusServer("campus-academics-mcp");
    const repository = new AcademicsRepository();
    const service = new AcademicsService(repository);
    registerAcademicsTools(server, service);
    return server;
  }
});
