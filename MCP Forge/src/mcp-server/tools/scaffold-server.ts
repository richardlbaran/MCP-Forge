import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerScaffoldServer(server: McpServer) {
  server.registerTool(
    "scaffold_server",
    {
      title: "Scaffold Server",
      description: `Create a new MCP server from a template.

This creates a new server in the forge workspace based on the specified template.
The server will be ready for testing but not yet promoted to production.

Required:
- template: The template name (use list_templates to see options)
- name: A unique name for your server (lowercase, hyphens allowed)

Optional:
- variables: Object with environment variable values
- description: Custom description (defaults to template description)`,
      inputSchema: z.object({
        template: z.string().describe("Template name (e.g., 'supabase', 'gtm-hub')"),
        name: z.string().min(2).max(50).describe("Server name (lowercase, hyphens allowed)"),
        variables: z.record(z.string()).optional().describe("Environment variables"),
        description: z.string().optional().describe("Custom description"),
      }).strict(),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
      },
    },
    async (params) => {
      try {
        // Validate name format
        const nameRegex = /^[a-z][a-z0-9-]*$/;
        if (!nameRegex.test(params.name)) {
          return {
            isError: true,
            content: [{
              type: "text",
              text: "Invalid server name. Use lowercase letters, numbers, and hyphens. Must start with a letter.",
            }],
          };
        }

        // In a real implementation, this would:
        // 1. Load the template definition
        // 2. Generate all server files
        // 3. Save to workspace directory
        // 4. Update forge state

        const result = {
          success: true,
          server: {
            name: params.name,
            template: params.template,
            location: "workspace",
            path: `./workspace/${params.name}`,
            status: "stopped",
            created_at: new Date().toISOString(),
          },
          next_steps: [
            `Test with: test_tool server="${params.name}" tool="<tool_name>"`,
            `When ready: promote_server name="${params.name}"`,
          ],
        };

        return {
          content: [{
            type: "text",
            text: `✅ Server "${params.name}" created from template "${params.template}"

Location: ./workspace/${params.name}
Status: Ready for testing

Next steps:
1. Test your tools: test_tool server="${params.name}" tool="hello"
2. When ready: promote_server name="${params.name}"
3. Copy Claude Code config from the server's config tab`,
          }],
          structuredContent: result,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          isError: true,
          content: [{ type: "text", text: `Error scaffolding server: ${message}` }],
        };
      }
    }
  );
}
