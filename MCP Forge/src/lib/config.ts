import yaml from 'js-yaml';
import type { ForgeConfig, ForgeMemory } from '@/types';

const DEFAULT_CONFIG: ForgeConfig = {
  forge: {
    name: "MCP Forge",
    version: "2.1.0",
  },
  paths: {
    workspace: './workspace',
    servers: './servers',
    templates: './templates',
    logs: './logs',
  },
  context_bridge: {
    enabled: false,
    contextcommand_path: '',
    auto_inject: false,
  },
  mcp_server: {
    enabled: true,
    name: 'mcp-forge',
    port: 3100,
    expose_tools: [
      'list_templates',
      'scaffold_server',
      'list_servers',
      'list_workspace',
      'test_tool',
      'promote_server',
      'save_as_template',
    ],
  },
  defaults: {
    transport: 'stdio',
    language: 'typescript',
    author: 'Rich',
  },
  testing: {
    default_timeout: 15000,
    log_all_requests: true,
    save_history: true,
    history_limit: 1000,
    hot_reload: true,
  },
  ui: {
    theme: 'dark',
    default_page: 'dashboard',
    monaco_theme: 'vs-dark',
  },
  backup: {
    enabled: true,
    keep_versions: 10,
    auto_snapshot_on_promote: true,
  },
};

const DEFAULT_MEMORY: ForgeMemory = {
  servers_created: 0,
  most_used_templates: [],
  common_variables: {},
  tool_usage_stats: {},
  failed_patterns: [],
  evolution_log: [],
};

// In browser, we'll use localStorage
const STORAGE_KEY = 'mcp-forge-config';
const MEMORY_KEY = 'mcp-forge-memory';

export function loadConfig(): ForgeConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch (e) {
    console.warn('Failed to load config from storage:', e);
  }
  return DEFAULT_CONFIG;
}

export function saveConfig(config: ForgeConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save config:', e);
  }
}

export function parseYamlConfig(yamlContent: string): ForgeConfig {
  try {
    const parsed = yaml.load(yamlContent) as Partial<ForgeConfig>;
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch (e) {
    console.error('Failed to parse YAML config:', e);
    return DEFAULT_CONFIG;
  }
}

export function exportConfigAsYaml(config: ForgeConfig): string {
  return yaml.dump(config, { indent: 2, lineWidth: 100 });
}

export function loadMemory(): ForgeMemory {
  try {
    const stored = localStorage.getItem(MEMORY_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_MEMORY, ...parsed };
    }
  } catch (e) {
    console.warn('Failed to load memory from storage:', e);
  }
  return DEFAULT_MEMORY;
}

export function saveMemory(memory: ForgeMemory): void {
  try {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(memory));
  } catch (e) {
    console.error('Failed to save memory:', e);
  }
}

export function updateMemory(updates: Partial<ForgeMemory>): ForgeMemory {
  const current = loadMemory();
  const updated = { ...current, ...updates };
  saveMemory(updated);
  return updated;
}

export function recordTemplateUsage(templateName: string): void {
  const memory = loadMemory();
  
  // Update most_used_templates
  const templateIndex = memory.most_used_templates.indexOf(templateName);
  if (templateIndex > -1) {
    memory.most_used_templates.splice(templateIndex, 1);
  }
  memory.most_used_templates.unshift(templateName);
  memory.most_used_templates = memory.most_used_templates.slice(0, 10);
  
  memory.servers_created += 1;
  
  saveMemory(memory);
}

export function recordToolUsage(toolName: string): void {
  const memory = loadMemory();
  memory.tool_usage_stats[toolName] = (memory.tool_usage_stats[toolName] || 0) + 1;
  saveMemory(memory);
}

export function recordFailedPattern(template: string, error: string, solution?: string): void {
  const memory = loadMemory();
  memory.failed_patterns.push({
    template,
    error,
    solution,
    timestamp: new Date().toISOString(),
  });
  // Keep last 50 failures
  memory.failed_patterns = memory.failed_patterns.slice(-50);
  saveMemory(memory);
}

export function addEvolutionEntry(action: string, details?: Record<string, unknown>): void {
  const memory = loadMemory();
  memory.evolution_log.push({
    date: new Date().toISOString().split('T')[0],
    action,
    details,
  });
  // Keep last 100 entries
  memory.evolution_log = memory.evolution_log.slice(-100);
  saveMemory(memory);
}
