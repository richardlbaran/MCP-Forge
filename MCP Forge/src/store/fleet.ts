import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ServerStatus = 'healthy' | 'warning' | 'error' | 'offline' | 'starting';

export interface FleetServer {
  id: string;
  name: string;
  template: string;
  layer: 'development' | 'content' | 'monitoring' | 'data' | 'workflow';
  status: ServerStatus;
  calls24h: number;
  tokens24h: number;
  errors24h: number;
  avgLatencyMs: number;
  createdAt: string;
  lastActiveAt: string;
  promotedAt?: string;
  tools: string[];
  variables: Record<string, string>;
  estimatedMonthlyCost: number;
}

export interface FleetMetrics {
  totalServers: number;
  healthyServers: number;
  warningServers: number;
  errorServers: number;
  totalCalls24h: number;
  totalTokens24h: number;
  totalErrors24h: number;
  estimatedMonthlyCost: number;
  serversByLayer: {
    development: number;
    content: number;
    monitoring: number;
    data: number;
    workflow: number;
  };
}

export interface ArchitectRecommendation {
  id: string;
  type: 'add' | 'remove' | 'optimize' | 'consolidate';
  priority: 'critical' | 'recommended' | 'optional';
  templateId?: string;
  templateName?: string;
  serverId?: string;
  serverName?: string;
  sourceServerIds?: string[];
  targetTemplateName?: string;
  rationale: string;
  estimatedImpact?: string;
  estimatedSavings?: number;
  triggerDelta?: { type: string; content: string };
  createdAt: string;
  dismissedAt?: string;
  appliedAt?: string;
}

export interface FleetActivity {
  id: string;
  timestamp: string;
  serverId?: string;
  serverName?: string;
  type: 'call' | 'error' | 'deploy' | 'remove' | 'optimize' | 'alert';
  message: string;
  details?: Record<string, unknown>;
}

export interface TokenUsagePoint {
  timestamp: string;
  tokens: number;
  calls: number;
}

interface FleetState {
  servers: FleetServer[];
  metrics: FleetMetrics;
  recommendations: ArchitectRecommendation[];
  activities: FleetActivity[];
  tokenUsageHistory: TokenUsagePoint[];
  
  addServer: (server: FleetServer) => void;
  updateServer: (id: string, updates: Partial<FleetServer>) => void;
  removeServer: (id: string) => void;
  setRecommendations: (recs: ArchitectRecommendation[]) => void;
  dismissRecommendation: (id: string) => void;
  applyRecommendation: (id: string) => void;
  addActivity: (activity: Omit<FleetActivity, 'id' | 'timestamp'>) => void;
  clearActivities: () => void;
  updateTokenUsage: (point: TokenUsagePoint) => void;
  recalculateMetrics: () => void;
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const emptyMetrics: FleetMetrics = {
  totalServers: 0,
  healthyServers: 0,
  warningServers: 0,
  errorServers: 0,
  totalCalls24h: 0,
  totalTokens24h: 0,
  totalErrors24h: 0,
  estimatedMonthlyCost: 0,
  serversByLayer: {
    development: 0,
    content: 0,
    monitoring: 0,
    data: 0,
    workflow: 0,
  },
};

export const useFleetStore = create<FleetState>()(
  persist(
    (set, get) => ({
      servers: [],
      metrics: emptyMetrics,
      recommendations: [],
      activities: [],
      tokenUsageHistory: [],

      addServer: (server) => {
        set((state) => ({ servers: [...state.servers, server] }));
        get().recalculateMetrics();
        get().addActivity({
          serverId: server.id,
          serverName: server.name,
          type: 'deploy',
          message: `Deployed ${server.name} (${server.template})`,
        });
      },

      updateServer: (id, updates) => {
        set((state) => ({
          servers: state.servers.map((s) => s.id === id ? { ...s, ...updates } : s),
        }));
        get().recalculateMetrics();
      },

      removeServer: (id) => {
        const server = get().servers.find((s) => s.id === id);
        set((state) => ({ servers: state.servers.filter((s) => s.id !== id) }));
        get().recalculateMetrics();
        if (server) {
          get().addActivity({
            serverId: id,
            serverName: server.name,
            type: 'remove',
            message: `Removed ${server.name}`,
          });
        }
      },

      setRecommendations: (recs) => set({ recommendations: recs }),

      dismissRecommendation: (id) => {
        set((state) => ({
          recommendations: state.recommendations.map((r) =>
            r.id === id ? { ...r, dismissedAt: new Date().toISOString() } : r
          ),
        }));
      },

      applyRecommendation: (id) => {
        set((state) => ({
          recommendations: state.recommendations.map((r) =>
            r.id === id ? { ...r, appliedAt: new Date().toISOString() } : r
          ),
        }));
      },

      addActivity: (activity) => {
        const newActivity: FleetActivity = {
          ...activity,
          id: generateId(),
          timestamp: new Date().toISOString(),
        };
        set((state) => ({
          activities: [newActivity, ...state.activities].slice(0, 100),
        }));
      },

      clearActivities: () => set({ activities: [] }),

      updateTokenUsage: (point) => {
        set((state) => ({
          tokenUsageHistory: [...state.tokenUsageHistory, point].slice(-24),
        }));
      },

      recalculateMetrics: () => {
        const { servers } = get();
        const metrics: FleetMetrics = {
          totalServers: servers.length,
          healthyServers: servers.filter((s) => s.status === 'healthy').length,
          warningServers: servers.filter((s) => s.status === 'warning').length,
          errorServers: servers.filter((s) => s.status === 'error').length,
          totalCalls24h: servers.reduce((sum, s) => sum + s.calls24h, 0),
          totalTokens24h: servers.reduce((sum, s) => sum + s.tokens24h, 0),
          totalErrors24h: servers.reduce((sum, s) => sum + s.errors24h, 0),
          estimatedMonthlyCost: servers.reduce((sum, s) => sum + s.estimatedMonthlyCost, 0),
          serversByLayer: {
            development: servers.filter((s) => s.layer === 'development').length,
            content: servers.filter((s) => s.layer === 'content').length,
            monitoring: servers.filter((s) => s.layer === 'monitoring').length,
            data: servers.filter((s) => s.layer === 'data').length,
            workflow: servers.filter((s) => s.layer === 'workflow').length,
          },
        };
        set({ metrics });
      },
    }),
    { name: 'mcp-forge-fleet' }
  )
);
