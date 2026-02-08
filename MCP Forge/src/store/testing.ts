import { create } from 'zustand';
import type { 
  MCPToolInfo, 
  MCPConnectionState, 
  MCPCallToolResponse,
  TestRequest,
} from '@/types';
import { 
  MCPTestClient, 
  type LogEntry,
  addTestHistoryEntry,
} from '@/lib/mcp-client';

interface TestingStore {
  // Connection
  connectionState: MCPConnectionState;
  connectedServer: string | null;
  client: MCPTestClient | null;
  
  // Tools
  discoveredTools: MCPToolInfo[];
  selectedTool: string | null;
  
  // Current test
  currentParams: Record<string, unknown>;
  lastResponse: MCPCallToolResponse | null;
  isExecuting: boolean;
  
  // Logs
  logs: LogEntry[];
  
  // Actions
  connect: (serverName: string) => Promise<void>;
  disconnect: () => Promise<void>;
  selectTool: (name: string | null) => void;
  setParam: (key: string, value: unknown) => void;
  setParams: (params: Record<string, unknown>) => void;
  executeTool: () => Promise<MCPCallToolResponse | null>;
  clearLogs: () => void;
  replayRequest: (request: TestRequest) => Promise<void>;
}

export const useTestingStore = create<TestingStore>((set, get) => ({
  // Initial state
  connectionState: 'disconnected',
  connectedServer: null,
  client: null,
  discoveredTools: [],
  selectedTool: null,
  currentParams: {},
  lastResponse: null,
  isExecuting: false,
  logs: [],

  connect: async (serverName) => {
    set({ connectionState: 'connecting', logs: [] });

    try {
      const client = new MCPTestClient(
        { name: serverName, transport: 'stdio' },
        {
          onLog: (entry) => {
            set((state) => ({ logs: [...state.logs, entry] }));
          },
        }
      );

      await client.connect();
      const tools = await client.discoverTools();

      set({
        connectionState: 'connected',
        connectedServer: serverName,
        client,
        discoveredTools: tools,
        selectedTool: tools.length > 0 ? tools[0].name : null,
        currentParams: {},
        lastResponse: null,
      });
    } catch (error) {
      set({
        connectionState: 'error',
        client: null,
        discoveredTools: [],
      });
      throw error;
    }
  },

  disconnect: async () => {
    const { client } = get();
    if (client) {
      await client.disconnect();
    }

    set({
      connectionState: 'disconnected',
      connectedServer: null,
      client: null,
      discoveredTools: [],
      selectedTool: null,
      currentParams: {},
      lastResponse: null,
    });
  },

  selectTool: (name) => {
    set({
      selectedTool: name,
      currentParams: {},
      lastResponse: null,
    });
  },

  setParam: (key, value) => {
    set((state) => ({
      currentParams: { ...state.currentParams, [key]: value },
    }));
  },

  setParams: (params) => {
    set({ currentParams: params });
  },

  executeTool: async () => {
    const { client, connectedServer, selectedTool, currentParams } = get();
    
    if (!client || !selectedTool || !connectedServer) {
      return null;
    }

    set({ isExecuting: true, lastResponse: null });
    const startTime = Date.now();

    try {
      const response = await client.callTool(selectedTool, currentParams);
      const duration = Date.now() - startTime;

      set({ lastResponse: response, isExecuting: false });

      // Save to history
      addTestHistoryEntry({
        server: connectedServer,
        tool: selectedTool,
        params: currentParams,
        response,
        duration_ms: duration,
      });

      return response;
    } catch (error) {
      const errorResponse: MCPCallToolResponse = {
        content: [
          { type: 'text', text: error instanceof Error ? error.message : 'Execution failed' },
        ],
        isError: true,
      };

      set({ lastResponse: errorResponse, isExecuting: false });
      return errorResponse;
    }
  },

  clearLogs: () => {
    const { client } = get();
    client?.clearLogs();
    set({ logs: [] });
  },

  replayRequest: async (request) => {
    const { connectedServer, client } = get();
    
    // If we need to connect to a different server
    if (request.tool && connectedServer !== request.tool) {
      // For now, just set params and let user reconnect
    }

    set({
      selectedTool: request.tool,
      currentParams: request.params,
    });

    // Execute if connected
    if (client && get().connectionState === 'connected') {
      await get().executeTool();
    }
  },
}));

// Helper to get tool schema
export function useSelectedToolSchema() {
  const tools = useTestingStore((s) => s.discoveredTools);
  const selectedTool = useTestingStore((s) => s.selectedTool);
  
  if (!selectedTool) return null;
  return tools.find((t) => t.name === selectedTool);
}
