import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerListServers(server: McpServer) {
  // List all servers (deployed)
  server.registerTool(
    "list_servers",
    {
      title: "List Deployed Servers",
      description: `List all deployed (production-ready) MCP servers.

These servers have been promoted from workspace and are ready for use with Claude.
Use this to see what servers are available for testing or to get their configurations.`,
      inputSchema: z.object({}).strict(),
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
      },
    },
    async () => {
      try {
        // In real implementation, this reads from storage
        const servers: Array<{
          name: string;
          template: string;
          tools_count: number;
          promoted_at: string;
        }> = [];

        if (servers.length === 0) {
          return {
            content: [{
              type: "text",
              text: "No deployed servers yet. Promote a workspace server with promote_server.",
            }],
            structuredContent: { count: 0, servers: [] },
          };
        }

        const formatted = servers
          .map((s) => `• ${s.name} (${s.template}) - ${s.tools_count} tools`)
          .join("\n");

        return {
          content: [{
            type: "text",
            text: `${servers.length} deployed servers:\n\n${formatted}`,
          }],
          structuredContent: { count: servers.length, servers },
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          isError: true,
          content: [{ type: "text", text: `Error listing servers: ${message}` }],
        };
      }
    }
  );

  // List workspace servers
  server.registerTool(
    "list_workspace",
    {
      title: "List Workspace Servers",
      description: `List all servers currently in the workspace (not yet promoted).

These are servers being developed/tested but not yet production-ready.
Use this to see what you're working on and what needs to be promoted.`,
      inputSchema: z.object({}).strict(),
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
      },
    },
    async () => {
      try {
        // In real implementation, this reads from storage
        const servers: Array<{
          name: string;
          template: string;
          tools_count: number;
          created_at: string;
        }> = [];

        if (servers.length === 0) {
          return {
            content: [{
              type: "text",
              text: "Workspace is empty. Create a server with scaffold_server.",
            }],
            structuredContent: { count: 0, servers: [] },
          };
        }

        const formatted = servers
          .map((s) => `• ${s.name} (${s.template}) - ${s.tools_count} tools`)
          .join("\n");

        return {
          content: [{
            type: "text",
            text: `${servers.length} workspace servers:\n\n${formatted}`,
          }],
          structuredContent: { count: servers.length, servers },
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          isError: true,
          content: [{ type: "text", text: `Error listing workspace: ${message}` }],
        };
      }
    }
  );
}
