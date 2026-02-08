import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerTestTool(server: McpServer) {
  server.registerTool(
    "test_tool",
    {
      title: "Test Tool",
      description: `Test a tool on a specific server without leaving the current context.

This invokes a tool on one of your forge servers and returns the result.
Useful for quick testing during development without switching to the test harness UI.

Required:
- server: Name of the server (from workspace or deployed)
- tool: Name of the tool to invoke

Optional:
- params: JSON object of parameters to pass to the tool`,
      inputSchema: z.object({
        server: z.string().describe("Server name"),
        tool: z.string().describe("Tool name to invoke"),
        params: z.record(z.unknown()).optional().describe("Tool parameters as JSON"),
      }).strict(),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
      },
    },
    async (params) => {
      try {
        // In real implementation, this would:
        // 1. Find the server
        // 2. Start it if not running
        // 3. Connect via MCP
        // 4. Invoke the tool
        // 5. Return the result

        const startTime = Date.now();

        // Mock response for demonstration
        const mockResult = {
          success: true,
          tool: params.tool,
          params: params.params || {},
          server: params.server,
          timestamp: new Date().toISOString(),
        };

        const duration = Date.now() - startTime;

        return {
          content: [{
            type: "text",
            text: `Tool "${params.tool}" executed on "${params.server}" (${duration}ms)

Result:
${JSON.stringify(mockResult, null, 2)}`,
          }],
          structuredContent: {
            ...mockResult,
            duration_ms: duration,
          },
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          isError: true,
          content: [{ type: "text", text: `Error testing tool: ${message}` }],
        };
      }
    }
  );
}
