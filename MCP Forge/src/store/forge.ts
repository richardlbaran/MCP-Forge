import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  ForgeConfig, 
  ForgeMemory, 
  MCPServer, 
  ActivityEntry,
  TemplateDefinition,
} from '@/types';
import { loadConfig, saveConfig, loadMemory, saveMemory } from '@/lib/config';
import { 
  getWorkspaceServers, 
  getDeployedServers,
  saveWorkspaceServer,
  saveDeployedServer,
  deleteWorkspaceServer,
  deleteDeployedServer,
  promoteServer as promoteServerFS,
  getCustomTemplates,
  saveCustomTemplate,
} from '@/lib/file-system/workspace';
import { builtInTemplates } from '@/lib/generator/templates';

interface ForgeStore {
  // Config
  config: ForgeConfig;
  setConfig: (config: Partial<ForgeConfig>) => void;
  
  // Memory
  memory: ForgeMemory;
  updateMemory: (updates: Partial<ForgeMemory>) => void;
  
  // Servers
  workspaceServers: MCPServer[];
  deployedServers: MCPServer[];
  refreshServers: () => void;
  addWorkspaceServer: (server: MCPServer) => void;
  updateServer: (name: string, updates: Partial<MCPServer>) => void;
  deleteServer: (name: string, location: 'workspace' | 'deployed') => void;
  promoteServer: (name: string) => MCPServer | null;
  
  // Templates
  templates: TemplateDefinition[];
  customTemplates: TemplateDefinition[];
  refreshTemplates: () => void;
  addCustomTemplate: (template: TemplateDefinition) => void;
  
  // Activity
  activities: ActivityEntry[];
  addActivity: (entry: Omit<ActivityEntry, 'id' | 'timestamp'>) => void;
  
  // UI State
  selectedServer: string | null;
  selectServer: (name: string | null) => void;
}

export const useForgeStore = create<ForgeStore>()(
  persist(
    (set, get) => ({
      // Config
      config: loadConfig(),
      setConfig: (updates) => {
        const newConfig = { ...get().config, ...updates };
        saveConfig(newConfig);
        set({ config: newConfig });
      },

      // Memory
      memory: loadMemory(),
      updateMemory: (updates) => {
        const newMemory = { ...get().memory, ...updates };
        saveMemory(newMemory);
        set({ memory: newMemory });
      },

      // Servers
      workspaceServers: getWorkspaceServers(),
      deployedServers: getDeployedServers(),
      
      refreshServers: () => {
        set({
          workspaceServers: getWorkspaceServers(),
          deployedServers: getDeployedServers(),
        });
      },

      addWorkspaceServer: (server) => {
        saveWorkspaceServer(server);
        get().refreshServers();
        get().addActivity({
          type: 'server_created',
          title: `Created ${server.name}`,
          details: `From template: ${server.template}`,
          server: server.name,
          template: server.template,
        });
        
        // Update memory
        const memory = get().memory;
        get().updateMemory({
          servers_created: memory.servers_created + 1,
          most_used_templates: [
            server.template,
            ...memory.most_used_templates.filter(t => t !== server.template),
          ].slice(0, 10),
        });
      },

      updateServer: (name, updates) => {
        const workspace = get().workspaceServers.find(s => s.name === name);
        const deployed = get().deployedServers.find(s => s.name === name);
        
        if (workspace) {
          saveWorkspaceServer({ ...workspace, ...updates });
        } else if (deployed) {
          saveDeployedServer({ ...deployed, ...updates });
        }
        get().refreshServers();
      },

      deleteServer: (name, location) => {
        if (location === 'workspace') {
          deleteWorkspaceServer(name);
        } else {
          deleteDeployedServer(name);
        }
        get().refreshServers();
        get().addActivity({
          type: 'server_deleted',
          title: `Deleted ${name}`,
          server: name,
        });
      },

      promoteServer: (name) => {
        const promoted = promoteServerFS(name);
        if (promoted) {
          get().refreshServers();
          get().addActivity({
            type: 'server_promoted',
            title: `Promoted ${name} to production`,
            server: name,
          });
        }
        return promoted;
      },

      // Templates
      templates: builtInTemplates,
      customTemplates: getCustomTemplates(),
      
      refreshTemplates: () => {
        set({ customTemplates: getCustomTemplates() });
      },

      addCustomTemplate: (template) => {
        saveCustomTemplate(template);
        get().refreshTemplates();
        get().addActivity({
          type: 'template_created',
          title: `Created template: ${template.name}`,
          template: template.name,
        });
      },

      // Activity
      activities: [],
      addActivity: (entry) => {
        const fullEntry: ActivityEntry = {
          ...entry,
          id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          timestamp: new Date().toISOString(),
        };
        set((state) => ({
          activities: [fullEntry, ...state.activities].slice(0, 50),
        }));
      },

      // UI State
      selectedServer: null,
      selectServer: (name) => set({ selectedServer: name }),
    }),
    {
      name: 'mcp-forge-store',
      partialize: (state) => ({
        activities: state.activities,
        selectedServer: state.selectedServer,
      }),
    }
  )
);

// Helper hooks
export function useAllServers() {
  const workspace = useForgeStore((s) => s.workspaceServers);
  const deployed = useForgeStore((s) => s.deployedServers);
  return [...workspace, ...deployed];
}

export function useAllTemplates() {
  const builtin = useForgeStore((s) => s.templates);
  const custom = useForgeStore((s) => s.customTemplates);
  return [...builtin, ...custom];
}
