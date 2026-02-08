// ============= Forge Core Types =============

export interface ForgeConfig {
  forge: {
    name: string;
    version: string;
    created?: string;
  };
  paths: {
    workspace: string;
    servers: string;
    templates: string;
    logs: string;
  };
  context_bridge: {
    enabled: boolean;
    contextcommand_path: string;
    auto_inject: boolean;
  };
  mcp_server: {
    enabled: boolean;
    name: string;
    port: number;
    expose_tools: string[];
  };
  defaults: {
    transport: 'stdio' | 'http';
    language: 'typescript' | 'python';
    author: string;
  };
  testing: {
    default_timeout: number;
    log_all_requests: boolean;
    save_history: boolean;
    history_limit: number;
    hot_reload: boolean;
  };
  ui: {
    theme: 'dark' | 'light';
    default_page: string;
    monaco_theme: string;
  };
  backup: {
    enabled: boolean;
    keep_versions: number;
    auto_snapshot_on_promote: boolean;
  };
}

export interface ForgeMemory {
  servers_created: number;
  most_used_templates: string[];
  common_variables: Record<string, string>;
  tool_usage_stats: Record<string, number>;
  failed_patterns: FailedPattern[];
  evolution_log: EvolutionEntry[];
  last_active_project?: string;
}

export interface FailedPattern {
  template: string;
  error: string;
  solution?: string;
  timestamp: string;
}

export interface EvolutionEntry {
  date: string;
  action: string;
  details?: Record<string, unknown>;
}

export interface ForgeMeta {
  generated_at: string;
  template: string;
  template_version: string;
  forge_version: string;
  parent_server: string | null;
  contextcommand_project: string | null;
  modifications: string[];
}

// ============= Server Types =============

export type ServerStatus = 'stopped' | 'running' | 'error' | 'starting' | 'testing';
export type ServerLocation = 'workspace' | 'deployed';

export interface MCPServer {
  name: string;
  location: ServerLocation;
  path: string;
  template: string;
  status: ServerStatus;
  created_at: string;
  updated_at: string;
  promoted_at?: string;
  meta: ForgeMeta;
  tools: ToolDefinition[];
  variables: Record<string, string>;
  pid?: number;
  port?: number;
}

export interface ServerSnapshot {
  name: string;
  timestamp: string;
  path: string;
  reason: string;
}

// ============= Template Types =============

export interface TemplateDefinition {
  name: string;
  display_name: string;
  description: string;
  version: string;
  author: string;
  tags: string[];
  extends?: string;
  variables: TemplateVariable[];
  tools: ToolDefinition[];
  dependencies: string[];
  additional_tools?: ToolDefinition[];
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object';
  required: boolean;
  secret?: boolean;
  default?: unknown;
  description: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, ToolParameter>;
  annotations?: ToolAnnotations;
}

export interface ToolParameter {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required?: boolean;
  default?: unknown;
  description?: string;
  enum?: string[];
}

export interface ToolAnnotations {
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
  idempotentHint?: boolean;
  openWorldHint?: boolean;
}

// ============= Testing Types =============

export interface TestSession {
  id: string;
  server: string;
  started_at: string;
  requests: TestRequest[];
}

export interface TestRequest {
  id: string;
  timestamp: string;
  tool: string;
  params: Record<string, unknown>;
  response?: TestResponse;
  duration_ms?: number;
  status: 'pending' | 'success' | 'error';
}

export interface TestResponse {
  content: Array<{ type: string; text?: string }>;
  isError?: boolean;
  structuredContent?: unknown;
}

export interface SavedTestCase {
  id: string;
  name: string;
  server: string;
  tool: string;
  params: Record<string, unknown>;
  expected_contains?: string[];
  created_at: string;
}

// ============= Context Bridge Types =============

export interface ProjectContext {
  name: string;
  mission?: string;
  stack: string[];
  constraints: string[];
  decisions: ContextDecision[];
  last_updated: string;
}

export interface ContextDecision {
  id: string;
  type: string;
  content: string;
  confidence: number;
  timestamp: string;
}

// ============= Activity Types =============

export interface ActivityEntry {
  id: string;
  timestamp: string;
  type: ActivityType;
  title: string;
  details?: string;
  server?: string;
  template?: string;
}

export type ActivityType =
  | 'server_created'
  | 'server_promoted'
  | 'server_deleted'
  | 'tool_tested'
  | 'template_created'
  | 'template_updated'
  | 'error_occurred'
  | 'context_injected';
