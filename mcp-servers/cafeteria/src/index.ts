import "dotenv/config";
import { createCampusServer, startMcpHttpServer } from "@campus/mcp-common";
import { CafeteriaRepository } from "./repository.js";
import { CafeteriaService } from "./service.js";
import { registerCafeteriaTools } from "./tools.js";

const port = Number(process.env.CAFETERIA_MCP_PORT ?? 4102);

startMcpHttpServer({
  port,
  label: "Cafeteria",
  buildServer: () => {
    const server = createCampusServer("campus-cafeteria-mcp");
    const repository = new CafeteriaRepository();
    const service = new CafeteriaService(repository);
    registerCafeteriaTools(server, service);
    return server;
  }
});
