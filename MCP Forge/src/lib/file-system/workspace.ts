// File system abstraction for workspace and server management
// In browser mode, uses localStorage simulation
// In Node/Electron mode, uses actual fs

import type { MCPServer, TemplateDefinition } from '@/types';

const WORKSPACE_KEY = 'mcp-forge-workspace';
const SERVERS_KEY = 'mcp-forge-servers';
const TEMPLATES_KEY = 'mcp-forge-templates';
const SNAPSHOTS_KEY = 'mcp-forge-snapshots';

// ============= Workspace Management =============

export function getWorkspaceServers(): MCPServer[] {
  try {
    const stored = localStorage.getItem(WORKSPACE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveWorkspaceServer(server: MCPServer): void {
  const servers = getWorkspaceServers();
  const index = servers.findIndex(s => s.name === server.name);
  
  if (index > -1) {
    servers[index] = { ...server, updated_at: new Date().toISOString() };
  } else {
    servers.push(server);
  }
  
  localStorage.setItem(WORKSPACE_KEY, JSON.stringify(servers));
}

export function deleteWorkspaceServer(name: string): boolean {
  const servers = getWorkspaceServers();
  const filtered = servers.filter(s => s.name !== name);
  
  if (filtered.length < servers.length) {
    localStorage.setItem(WORKSPACE_KEY, JSON.stringify(filtered));
    return true;
  }
  return false;
}

export function getWorkspaceServer(name: string): MCPServer | undefined {
  return getWorkspaceServers().find(s => s.name === name);
}

// ============= Deployed Servers Management =============

export function getDeployedServers(): MCPServer[] {
  try {
    const stored = localStorage.getItem(SERVERS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveDeployedServer(server: MCPServer): void {
  const servers = getDeployedServers();
  const index = servers.findIndex(s => s.name === server.name);
  
  if (index > -1) {
    servers[index] = { ...server, updated_at: new Date().toISOString() };
  } else {
    servers.push(server);
  }
  
  localStorage.setItem(SERVERS_KEY, JSON.stringify(servers));
}

export function deleteDeployedServer(name: string): boolean {
  const servers = getDeployedServers();
  const filtered = servers.filter(s => s.name !== name);
  
  if (filtered.length < servers.length) {
    localStorage.setItem(SERVERS_KEY, JSON.stringify(filtered));
    return true;
  }
  return false;
}

export function getDeployedServer(name: string): MCPServer | undefined {
  return getDeployedServers().find(s => s.name === name);
}

// ============= All Servers =============

export function getAllServers(): MCPServer[] {
  return [...getWorkspaceServers(), ...getDeployedServers()];
}

export function getServer(name: string): MCPServer | undefined {
  return getWorkspaceServer(name) || getDeployedServer(name);
}

// ============= Promotion =============

export function promoteServer(name: string): MCPServer | null {
  const workspaceServer = getWorkspaceServer(name);
  if (!workspaceServer) return null;
  
  // Create snapshot before promotion
  createSnapshot(workspaceServer, 'pre-promotion');
  
  // Update server metadata
  const promotedServer: MCPServer = {
    ...workspaceServer,
    location: 'deployed',
    promoted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    status: 'stopped',
  };
  
  // Save to deployed
  saveDeployedServer(promotedServer);
  
  // Remove from workspace
  deleteWorkspaceServer(name);
  
  return promotedServer;
}

export function demoteServer(name: string): MCPServer | null {
  const deployedServer = getDeployedServer(name);
  if (!deployedServer) return null;
  
  const demotedServer: MCPServer = {
    ...deployedServer,
    location: 'workspace',
    promoted_at: undefined,
    updated_at: new Date().toISOString(),
    status: 'stopped',
  };
  
  saveWorkspaceServer(demotedServer);
  deleteDeployedServer(name);
  
  return demotedServer;
}

// ============= Snapshots =============

interface ServerSnapshot {
  name: string;
  timestamp: string;
  reason: string;
  server: MCPServer;
}

export function getSnapshots(serverName: string): ServerSnapshot[] {
  try {
    const stored = localStorage.getItem(SNAPSHOTS_KEY);
    const all: ServerSnapshot[] = stored ? JSON.parse(stored) : [];
    return all.filter(s => s.name === serverName);
  } catch {
    return [];
  }
}

export function createSnapshot(server: MCPServer, reason: string): ServerSnapshot {
  const snapshot: ServerSnapshot = {
    name: server.name,
    timestamp: new Date().toISOString(),
    reason,
    server: { ...server },
  };
  
  try {
    const stored = localStorage.getItem(SNAPSHOTS_KEY);
    const all: ServerSnapshot[] = stored ? JSON.parse(stored) : [];
    all.push(snapshot);
    
    // Keep only last 10 snapshots per server
    const byServer = new Map<string, ServerSnapshot[]>();
    all.forEach(s => {
      const list = byServer.get(s.name) || [];
      list.push(s);
      byServer.set(s.name, list);
    });
    
    const pruned: ServerSnapshot[] = [];
    byServer.forEach(list => {
      pruned.push(...list.slice(-10));
    });
    
    localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(pruned));
  } catch (e) {
    console.error('Failed to create snapshot:', e);
  }
  
  return snapshot;
}

export function restoreSnapshot(serverName: string, timestamp: string): MCPServer | null {
  const snapshots = getSnapshots(serverName);
  const snapshot = snapshots.find(s => s.timestamp === timestamp);
  
  if (!snapshot) return null;
  
  const restoredServer = {
    ...snapshot.server,
    updated_at: new Date().toISOString(),
  };
  
  if (restoredServer.location === 'workspace') {
    saveWorkspaceServer(restoredServer);
  } else {
    saveDeployedServer(restoredServer);
  }
  
  return restoredServer;
}

// ============= Templates =============

export function getCustomTemplates(): TemplateDefinition[] {
  try {
    const stored = localStorage.getItem(TEMPLATES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveCustomTemplate(template: TemplateDefinition): void {
  const templates = getCustomTemplates();
  const index = templates.findIndex(t => t.name === template.name);
  
  if (index > -1) {
    templates[index] = template;
  } else {
    templates.push(template);
  }
  
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
}

export function deleteCustomTemplate(name: string): boolean {
  const templates = getCustomTemplates();
  const filtered = templates.filter(t => t.name !== name);
  
  if (filtered.length < templates.length) {
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(filtered));
    return true;
  }
  return false;
}

// ============= Server to Template =============

export function serverToTemplate(server: MCPServer, templateName: string, description?: string): TemplateDefinition {
  return {
    name: templateName,
    display_name: templateName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    description: description || `Template created from ${server.name}`,
    version: '1.0.0',
    author: 'Custom',
    tags: ['custom', server.template],
    variables: Object.keys(server.variables).map(key => ({
      name: key,
      type: 'string' as const,
      required: true,
      secret: key.includes('KEY') || key.includes('SECRET'),
      description: `Environment variable ${key}`,
    })),
    tools: server.tools,
    dependencies: [],
  };
}
