// ============= MCP Protocol Types =============
// Based on MCP SDK types for client implementation

export interface MCPClientConfig {
  name: string;
  transport: 'stdio' | 'http';
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
}

export interface MCPToolInfo {
  name: string;
  description?: string;
  inputSchema: MCPSchema;
  annotations?: {
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    idempotentHint?: boolean;
    openWorldHint?: boolean;
  };
}

export interface MCPSchema {
  type: string;
  properties?: Record<string, MCPSchemaProperty>;
  required?: string[];
  additionalProperties?: boolean;
}

export interface MCPSchemaProperty {
  type: string;
  description?: string;
  default?: unknown;
  enum?: string[];
  items?: MCPSchemaProperty;
  properties?: Record<string, MCPSchemaProperty>;
}

export interface MCPResourceInfo {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface MCPPromptInfo {
  name: string;
  description?: string;
  arguments?: MCPPromptArgument[];
}

export interface MCPPromptArgument {
  name: string;
  description?: string;
  required?: boolean;
}

export interface MCPCallToolRequest {
  method: 'tools/call';
  params: {
    name: string;
    arguments?: Record<string, unknown>;
  };
}

export interface MCPCallToolResponse {
  content: MCPContent[];
  isError?: boolean;
  structuredContent?: unknown;
}

export interface MCPContent {
  type: 'text' | 'image' | 'resource';
  text?: string;
  data?: string;
  mimeType?: string;
  uri?: string;
}

export interface MCPListToolsResponse {
  tools: MCPToolInfo[];
}

export interface MCPListResourcesResponse {
  resources: MCPResourceInfo[];
}

export interface MCPError {
  code: number;
  message: string;
  data?: unknown;
}

// Connection state
export type MCPConnectionState = 
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error';

export interface MCPConnectionInfo {
  state: MCPConnectionState;
  server_name?: string;
  server_version?: string;
  tools_count?: number;
  resources_count?: number;
  error?: string;
  connected_at?: string;
}
