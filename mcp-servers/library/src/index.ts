import "dotenv/config";
import { createCampusServer, startMcpHttpServer } from "@campus/mcp-common";
import { LibraryRepository } from "./repository.js";
import { LibraryService } from "./service.js";
import { registerLibraryTools } from "./tools.js";

const port = Number(process.env.LIBRARY_MCP_PORT ?? 4101);

startMcpHttpServer({
  port,
  label: "Library",
  buildServer: () => {
    const server = createCampusServer("campus-library-mcp");
    const repository = new LibraryRepository();
    const service = new LibraryService(repository);
    registerLibraryTools(server, service);
    return server;
  }
});
