// MCP Forge Server
// This MCP server exposes the forge itself to Claude
// So Claude can create, test, and manage MCP servers through the forge

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// Import tools
import { registerListTemplates } from "./tools/list-templates.js";
import { registerScaffoldServer } from "./tools/scaffold-server.js";
import { registerListServers } from "./tools/list-servers.js";
import { registerTestTool } from "./tools/test-tool.js";
import { registerPromoteServer } from "./tools/promote-server.js";

const server = new McpServer({
  name: "mcp-forge",
  version: "2.0.0",
});

// Register all tools
registerListTemplates(server);
registerScaffoldServer(server);
registerListServers(server);
registerTestTool(server);
registerPromoteServer(server);

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Forge server running on stdio");
  console.error("Tools: list_templates, scaffold_server, list_servers, list_workspace, test_tool, promote_server");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
