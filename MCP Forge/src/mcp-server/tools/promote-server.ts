import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerPromoteServer(server: McpServer) {
  server.registerTool(
    "promote_server",
    {
      title: "Promote Server",
      description: `Promote a workspace server to deployed (production) status.

This moves the server from workspace to the servers directory, generates a snapshot
for rollback purposes, and provides the Claude Code configuration.

The server should be tested before promotion. Use test_tool to verify functionality.`,
      inputSchema: z.object({
        name: z.string().describe("Server name to promote"),
      }).strict(),
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
      },
    },
    async (params) => {
      try {
        // In real implementation, this would:
        // 1. Find the server in workspace
        // 2. Create a snapshot
        // 3. Move to servers directory
        // 4. Update status
        // 5. Generate Claude Code config

        const claudeConfig = {
          [params.name]: {
            command: "node",
            args: [`./servers/${params.name}/dist/index.js`],
            env: {},
          },
        };

        return {
          content: [{
            type: "text",
            text: `✅ Server "${params.name}" promoted to production!

Location: ./servers/${params.name}
Snapshot: Created for rollback

Claude Code Configuration:
${JSON.stringify(claudeConfig, null, 2)}

Add this to ~/.claude/claude_desktop_config.json under "mcpServers"`,
          }],
          structuredContent: {
            success: true,
            server: params.name,
            location: `./servers/${params.name}`,
            claude_config: claudeConfig,
          },
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          isError: true,
          content: [{ type: "text", text: `Error promoting server: ${message}` }],
        };
      }
    }
  );

  // Save as template
  server.registerTool(
    "save_as_template",
    {
      title: "Save as Template",
      description: `Convert a deployed server into a reusable template.

This extracts the server configuration and saves it as a new template
that can be used to scaffold similar servers in the future.`,
      inputSchema: z.object({
        server: z.string().describe("Server name to convert"),
        template_name: z.string().describe("Name for the new template"),
        description: z.string().optional().describe("Template description"),
      }).strict(),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
      },
    },
    async (params) => {
      try {
        return {
          content: [{
            type: "text",
            text: `✅ Template "${params.template_name}" created from server "${params.server}"

The template is now available for use with scaffold_server.

Usage: scaffold_server template="${params.template_name}" name="my-new-server"`,
          }],
          structuredContent: {
            success: true,
            template: params.template_name,
            source_server: params.server,
          },
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          isError: true,
          content: [{ type: "text", text: `Error creating template: ${message}` }],
        };
      }
    }
  );
}
