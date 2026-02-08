import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// In a real implementation, this would read from the templates directory
const builtInTemplates = [
  {
    name: "_blank",
    display_name: "Blank Server",
    description: "Minimal starting point for custom MCP servers",
    tags: ["starter", "minimal"],
    tools_count: 1,
  },
  {
    name: "supabase",
    display_name: "Supabase Database",
    description: "Full Supabase access with RLS-aware queries",
    tags: ["database", "supabase", "backend"],
    tools_count: 5,
  },
  {
    name: "api-wrapper",
    display_name: "REST API Wrapper",
    description: "Wrap any REST API with configurable endpoints",
    tags: ["api", "rest", "http"],
    tools_count: 4,
  },
  {
    name: "gtm-hub",
    display_name: "GTM Intelligence Hub",
    description: "Capture insights, track actions, manage go-to-market",
    tags: ["gtm", "marketing", "intelligence"],
    tools_count: 5,
  },
  {
    name: "health-monitor",
    display_name: "App Health Monitor",
    description: "Analyze code quality and suggest improvements",
    tags: ["monitoring", "code-quality"],
    tools_count: 4,
  },
  {
    name: "mantic-extractor",
    display_name: "MANTIC Extractor",
    description: "Run MANTIC delta extraction on text",
    tags: ["ai", "extraction", "analysis"],
    tools_count: 3,
  },
  {
    name: "file-system",
    display_name: "File System Operations",
    description: "Read, write, and manage local files",
    tags: ["files", "filesystem", "local"],
    tools_count: 5,
  },
];

export function registerListTemplates(server: McpServer) {
  server.registerTool(
    "list_templates",
    {
      title: "List Templates",
      description: `List all available MCP server templates in the forge.

Returns a list of templates with their names, descriptions, tags, and tool counts.
Use this to discover what templates are available before scaffolding a new server.

Filter by tag to narrow results (e.g., tag="database" returns only database templates).`,
      inputSchema: z.object({
        tag: z.string().optional().describe("Filter templates by tag"),
      }).strict(),
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
      },
    },
    async (params) => {
      try {
        let templates = builtInTemplates;

        if (params.tag) {
          templates = templates.filter((t) =>
            t.tags.some((tag) => tag.toLowerCase().includes(params.tag!.toLowerCase()))
          );
        }

        const result = {
          count: templates.length,
          templates: templates.map((t) => ({
            name: t.name,
            display_name: t.display_name,
            description: t.description,
            tags: t.tags,
            tools_count: t.tools_count,
          })),
        };

        const formatted = templates
          .map(
            (t) =>
              `• ${t.display_name} (${t.name})\n  ${t.description}\n  Tags: ${t.tags.join(", ")} | ${t.tools_count} tools`
          )
          .join("\n\n");

        return {
          content: [
            {
              type: "text",
              text: `Found ${templates.length} templates:\n\n${formatted}`,
            },
          ],
          structuredContent: result,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          isError: true,
          content: [{ type: "text", text: `Error listing templates: ${message}` }],
        };
      }
    }
  );
}
