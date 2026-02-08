// Project store - MANTIC schema is the foundation
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProjectSchema, CoverageReport, DeltaType, Delta } from '@/lib/mantic';
import { getAllDeltas, getDeltasByType, DELTA_TYPES } from '@/lib/mantic';

// Sample project for demonstration
const SAMPLE_CONTEXTCOMMAND_SCHEMA: ProjectSchema = {
  identity: {
    name: 'ContextCommand',
    mission: 'Help vibe coders maintain context across AI platforms',
    type: 'chrome-extension-webapp',
  },
  deltas: {
    decisions: [
      { type: 'decision', content: 'Using MANTIC protocol for delta extraction', confidence: 0.95 },
      { type: 'decision', content: 'Supabase for backend and database', confidence: 0.92 },
      { type: 'decision', content: 'Chrome extension + web app architecture', confidence: 0.90 },
      { type: 'decision', content: 'Privacy-first data architecture', confidence: 0.95 },
      { type: 'decision', content: '$9/month early adopter pricing via Stripe', confidence: 0.85 },
      { type: 'decision', content: 'Target r/vibecoding as primary community', confidence: 0.88 },
      { type: 'decision', content: 'Vault aesthetic for landing page', confidence: 0.80 },
    ],
    requirements: [
      { type: 'requirement', content: 'Chrome extension manifest v3 compliance', confidence: 0.95 },
      { type: 'requirement', content: 'Support 10,000+ annual messages per user', confidence: 0.85 },
      { type: 'requirement', content: 'Cross-platform context sync (Claude, ChatGPT, Cursor)', confidence: 0.90 },
      { type: 'requirement', content: 'Export data in portable format', confidence: 0.88 },
    ],
    constraints: [
      { type: 'constraint', content: 'No data leaves user control without consent', confidence: 0.98 },
      { type: 'constraint', content: 'Must work offline for core functionality', confidence: 0.85 },
      { type: 'constraint', content: 'No AI training on user data', confidence: 0.95 },
      { type: 'constraint', content: 'Limited development time (nights only)', confidence: 0.90 },
    ],
    risks: [
      { type: 'risk', content: 'Context loss across AI platforms', confidence: 0.85 },
      { type: 'risk', content: 'User adoption friction in onboarding', confidence: 0.75 },
      { type: 'risk', content: 'Chrome extension store rejection', confidence: 0.60 },
      { type: 'risk', content: 'Competition from AI platform native memory features', confidence: 0.70 },
      { type: 'risk', content: 'Scaling Supabase costs with growth', confidence: 0.65 },
    ],
    questions: [
      { type: 'question', content: 'What is the optimal referral incentive structure?', confidence: 0.70 },
      { type: 'question', content: 'How to handle context conflicts between platforms?', confidence: 0.80 },
    ],
    assumptions: [
      { type: 'assumption', content: 'Vibe coders actively use 3+ AI platforms', confidence: 0.85 },
      { type: 'assumption', content: 'Users will pay for solved context fragmentation', confidence: 0.75 },
    ],
    artifacts: [],
    priorities: [
      { type: 'priority', content: 'Launch to first 50 paying users', confidence: 0.95 },
      { type: 'priority', content: 'Complete MANTIC port and debugging', confidence: 0.90 },
      { type: 'priority', content: 'Reddit community presence building', confidence: 0.85 },
    ],
  },
  stack: ['React', 'TypeScript', 'Supabase', 'Chrome Extension', 'Stripe', 'Tailwind'],
  meta: {
    extracted_at: new Date().toISOString(),
    source: 'contextcommand',
    health_score: 0.87,
  },
};

interface ProjectStore {
  // Projects
  projects: ProjectSchema[];
  activeProjectName: string | null;
  
  // Getters
  getActiveProject: () => ProjectSchema | null;
  getProject: (name: string) => ProjectSchema | null;
  
  // Actions
  setActiveProject: (name: string | null) => void;
  addProject: (schema: ProjectSchema) => void;
  updateProject: (name: string, updates: Partial<ProjectSchema>) => void;
  deleteProject: (name: string) => void;
  
  // Delta operations
  addDelta: (projectName: string, type: DeltaType, delta: Omit<Delta, 'type'>) => void;
  removeDelta: (projectName: string, type: DeltaType, content: string) => void;
  
  // Coverage analysis
  analyzeCoverage: (projectName: string, deployedServers: Array<{ name: string; template: string; addresses?: Record<string, string[]> }>) => CoverageReport;
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      // Initialize with sample project
      projects: [SAMPLE_CONTEXTCOMMAND_SCHEMA],
      activeProjectName: 'ContextCommand',

      getActiveProject: () => {
        const { projects, activeProjectName } = get();
        if (!activeProjectName) return null;
        return projects.find(p => p.identity.name === activeProjectName) || null;
      },

      getProject: (name) => {
        return get().projects.find(p => p.identity.name === name) || null;
      },

      setActiveProject: (name) => {
        set({ activeProjectName: name });
      },

      addProject: (schema) => {
        set(state => ({
          projects: [...state.projects, schema],
        }));
      },

      updateProject: (name, updates) => {
        set(state => ({
          projects: state.projects.map(p =>
            p.identity.name === name ? { ...p, ...updates } : p
          ),
        }));
      },

      deleteProject: (name) => {
        set(state => ({
          projects: state.projects.filter(p => p.identity.name !== name),
          activeProjectName: state.activeProjectName === name ? null : state.activeProjectName,
        }));
      },

      addDelta: (projectName, type, delta) => {
        set(state => ({
          projects: state.projects.map(p => {
            if (p.identity.name !== projectName) return p;
            const key = `${type}s` as keyof typeof p.deltas;
            return {
              ...p,
              deltas: {
                ...p.deltas,
                [key]: [...(p.deltas[key] || []), { ...delta, type }],
              },
            };
          }),
        }));
      },

      removeDelta: (projectName, type, content) => {
        set(state => ({
          projects: state.projects.map(p => {
            if (p.identity.name !== projectName) return p;
            const key = `${type}s` as keyof typeof p.deltas;
            return {
              ...p,
              deltas: {
                ...p.deltas,
                [key]: (p.deltas[key] || []).filter(d => d.content !== content),
              },
            };
          }),
        }));
      },

      analyzeCoverage: (projectName, deployedServers) => {
        const project = get().getProject(projectName);
        if (!project) {
          return {
            total_deltas: 0,
            addressed_count: 0,
            coverage_percent: 0,
            by_type: {} as Record<DeltaType, { total: number; addressed: number }>,
            unaddressed: [],
            suggestions: [],
          };
        }

        const allDeltas = getAllDeltas(project);
        const byType: Record<DeltaType, { total: number; addressed: number }> = {} as Record<DeltaType, { total: number; addressed: number }>;
        
        // Initialize by_type
        for (const type of DELTA_TYPES) {
          if (type === 'identity') continue;
          const deltas = getDeltasByType(project, type);
          byType[type] = { total: deltas.length, addressed: 0 };
        }

        // Check what's addressed by deployed servers
        const unaddressed: Delta[] = [];
        let addressedCount = 0;

        for (const delta of allDeltas) {
          let isAddressed = false;
          
          for (const server of deployedServers) {
            // Check if server's template addresses this delta type
            if (server.addresses) {
              const addressedDeltas = server.addresses[`${delta.type}s`] || [];
              if (addressedDeltas.some(a => 
                delta.content.toLowerCase().includes(a.toLowerCase()) ||
                a.toLowerCase().includes(delta.content.toLowerCase().substring(0, 20))
              )) {
                isAddressed = true;
                break;
              }
            }
          }

          if (isAddressed) {
            addressedCount++;
            if (delta.type !== 'identity') {
              byType[delta.type].addressed++;
            }
          } else {
            unaddressed.push(delta);
          }
        }

        return {
          total_deltas: allDeltas.length,
          addressed_count: addressedCount,
          coverage_percent: allDeltas.length > 0 ? Math.round((addressedCount / allDeltas.length) * 100) : 0,
          by_type: byType,
          unaddressed,
          suggestions: [], // Would be populated by template matching
        };
      },
    }),
    {
      name: 'mcp-forge-projects',
    }
  )
);
