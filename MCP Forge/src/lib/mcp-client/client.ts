// MCP Test Client - For testing servers from the dashboard
// Supports both stdio and HTTP transports

import type {
  MCPClientConfig,
  MCPToolInfo,
  MCPConnectionInfo,
  MCPConnectionState,
  MCPCallToolResponse,
} from '@/types';

export interface TestClientOptions {
  timeout?: number;
  onLog?: (entry: LogEntry) => void;
}

export interface LogEntry {
  timestamp: string;
  direction: 'send' | 'receive';
  type: 'request' | 'response' | 'error' | 'info';
  method?: string;
  data?: unknown;
  duration_ms?: number;
}

// In-browser mock client for development
// Real implementation would use Worker or backend proxy
export class MCPTestClient {
  private config: MCPClientConfig;
  private options: TestClientOptions;
  private state: MCPConnectionState = 'disconnected';
  private tools: MCPToolInfo[] = [];
  private logs: LogEntry[] = [];

  constructor(config: MCPClientConfig, options: TestClientOptions = {}) {
    this.config = config;
    this.options = {
      timeout: options.timeout || 10000,
      onLog: options.onLog,
    };
  }

  private log(entry: Omit<LogEntry, 'timestamp'>): void {
    const fullEntry: LogEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    };
    this.logs.push(fullEntry);
    this.options.onLog?.(fullEntry);
  }

  async connect(): Promise<MCPConnectionInfo> {
    this.state = 'connecting';
    this.log({ direction: 'send', type: 'info', data: 'Connecting to server...' });

    try {
      // Simulate connection handshake
      await this.simulateDelay(500);

      // In a real implementation, this would:
      // 1. Spawn the server process (stdio) or connect to URL (http)
      // 2. Perform MCP handshake
      // 3. Get server info

      this.state = 'connected';
      
      // Discover tools
      await this.discoverTools();

      const info: MCPConnectionInfo = {
        state: 'connected',
        server_name: this.config.name,
        server_version: '1.0.0',
        tools_count: this.tools.length,
        connected_at: new Date().toISOString(),
      };

      this.log({ direction: 'receive', type: 'info', data: info });
      return info;
    } catch (error) {
      this.state = 'error';
      const message = error instanceof Error ? error.message : 'Connection failed';
      this.log({ direction: 'receive', type: 'error', data: message });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.log({ direction: 'send', type: 'info', data: 'Disconnecting...' });
    this.state = 'disconnected';
    this.tools = [];
  }

  async discoverTools(): Promise<MCPToolInfo[]> {
    this.log({ direction: 'send', type: 'request', method: 'tools/list' });
    const startTime = Date.now();

    try {
      // In real implementation, this calls the MCP server
      // For now, return mock tools based on config
      await this.simulateDelay(200);

      // Mock tools for demonstration
      this.tools = this.getMockTools();

      this.log({
        direction: 'receive',
        type: 'response',
        method: 'tools/list',
        data: { tools: this.tools },
        duration_ms: Date.now() - startTime,
      });

      return this.tools;
    } catch (error) {
      this.log({
        direction: 'receive',
        type: 'error',
        method: 'tools/list',
        data: error instanceof Error ? error.message : 'Failed to list tools',
        duration_ms: Date.now() - startTime,
      });
      throw error;
    }
  }

  async callTool(name: string, params: Record<string, unknown> = {}): Promise<MCPCallToolResponse> {
    if (this.state !== 'connected') {
      throw new Error('Not connected to server');
    }

    this.log({
      direction: 'send',
      type: 'request',
      method: 'tools/call',
      data: { name, arguments: params },
    });

    const startTime = Date.now();

    try {
      // Simulate tool execution
      await this.simulateDelay(300 + Math.random() * 500);

      // Mock response
      const response: MCPCallToolResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              tool: name,
              params,
              timestamp: new Date().toISOString(),
              message: `Tool ${name} executed successfully`,
            }, null, 2),
          },
        ],
        structuredContent: {
          success: true,
          tool: name,
          params,
        },
      };

      this.log({
        direction: 'receive',
        type: 'response',
        method: 'tools/call',
        data: response,
        duration_ms: Date.now() - startTime,
      });

      return response;
    } catch (error) {
      const errorResponse: MCPCallToolResponse = {
        content: [
          {
            type: 'text',
            text: error instanceof Error ? error.message : 'Tool execution failed',
          },
        ],
        isError: true,
      };

      this.log({
        direction: 'receive',
        type: 'error',
        method: 'tools/call',
        data: errorResponse,
        duration_ms: Date.now() - startTime,
      });

      return errorResponse;
    }
  }

  getState(): MCPConnectionState {
    return this.state;
  }

  getTools(): MCPToolInfo[] {
    return this.tools;
  }

  getLogs(): LogEntry[] {
    return this.logs;
  }

  clearLogs(): void {
    this.logs = [];
  }

  private async simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getMockTools(): MCPToolInfo[] {
    // Return tools based on server config
    // In real implementation, these come from the actual server
    return [
      {
        name: 'example_hello',
        description: 'A simple hello world tool',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Name to greet' },
          },
        },
        annotations: { readOnlyHint: true },
      },
      {
        name: 'example_echo',
        description: 'Echo back the input',
        inputSchema: {
          type: 'object',
          properties: {
            message: { type: 'string', description: 'Message to echo' },
          },
          required: ['message'],
        },
        annotations: { readOnlyHint: true, idempotentHint: true },
      },
    ];
  }
}

// ============= Test History =============

const TEST_HISTORY_KEY = 'mcp-forge-test-history';
const MAX_HISTORY = 100;

export interface TestHistoryEntry {
  id: string;
  timestamp: string;
  server: string;
  tool: string;
  params: Record<string, unknown>;
  response: MCPCallToolResponse;
  duration_ms: number;
}

export function getTestHistory(): TestHistoryEntry[] {
  try {
    const stored = localStorage.getItem(TEST_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function addTestHistoryEntry(entry: Omit<TestHistoryEntry, 'id' | 'timestamp'>): TestHistoryEntry {
  const fullEntry: TestHistoryEntry = {
    ...entry,
    id: `test-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    timestamp: new Date().toISOString(),
  };

  const history = getTestHistory();
  history.unshift(fullEntry);
  
  // Keep only last MAX_HISTORY entries
  const trimmed = history.slice(0, MAX_HISTORY);
  localStorage.setItem(TEST_HISTORY_KEY, JSON.stringify(trimmed));

  return fullEntry;
}

export function clearTestHistory(): void {
  localStorage.removeItem(TEST_HISTORY_KEY);
}

export function getHistoryForServer(serverName: string): TestHistoryEntry[] {
  return getTestHistory().filter(e => e.server === serverName);
}

export function getHistoryForTool(serverName: string, toolName: string): TestHistoryEntry[] {
  return getTestHistory().filter(e => e.server === serverName && e.tool === toolName);
}
