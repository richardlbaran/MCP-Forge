// ============= MANTIC Schema Module =============
// This is the FOUNDATION of how the forge thinks.
// Not a feature. Not an integration. The language.

export type DeltaType =
  | 'decision'
  | 'requirement'
  | 'constraint'
  | 'risk'
  | 'question'
  | 'assumption'
  | 'artifact'
  | 'priority'
  | 'identity';

export const DELTA_TYPES: DeltaType[] = [
  'decision',
  'requirement',
  'constraint',
  'risk',
  'question',
  'assumption',
  'artifact',
  'priority',
  'identity',
];

export interface Delta {
  id?: string;
  type: DeltaType;
  content: string;
  confidence: number;
  source?: string;
  timestamp?: string;
  lineNumber?: number;
}

export interface ProjectIdentity {
  name: string;
  mission: string;
  type?: string;
}

export interface ProjectDeltas {
  decisions: Delta[];
  requirements: Delta[];
  constraints: Delta[];
  risks: Delta[];
  questions: Delta[];
  assumptions: Delta[];
  artifacts: Delta[];
  priorities: Delta[];
}

export interface ProjectSchema {
  identity: ProjectIdentity;
  deltas: ProjectDeltas;
  stack: string[];
  meta: {
    extracted_at: string;
    source: string;
    health_score?: number;
    version?: string;
  };
}

export interface TemplateTrigger {
  decision_contains?: string;
  requirement_contains?: string;
  constraint_contains?: string;
  risk_contains?: string;
  stack_includes?: string;
  has_delta_type?: DeltaType;
}

export interface TemplateAddresses {
  decisions?: string[];
  requirements?: string[];
  constraints?: string[];
  risks?: string[];
  priorities?: string[];
}

export interface DeltaCoverage {
  delta: Delta;
  addressed: boolean;
  addressed_by: string[]; // server names
  suggestions: string[];  // template names
}

export interface CoverageReport {
  total_deltas: number;
  addressed_count: number;
  coverage_percent: number;
  by_type: Record<DeltaType, { total: number; addressed: number }>;
  unaddressed: Delta[];
  suggestions: Array<{
    delta: Delta;
    template: string;
    reason: string;
    confidence: number;
  }>;
}

// ============= Empty Schema =============

export function createEmptySchema(name: string): ProjectSchema {
  return {
    identity: {
      name,
      mission: '',
    },
    deltas: {
      decisions: [],
      requirements: [],
      constraints: [],
      risks: [],
      questions: [],
      assumptions: [],
      artifacts: [],
      priorities: [],
    },
    stack: [],
    meta: {
      extracted_at: new Date().toISOString(),
      source: 'manual',
    },
  };
}

export function createEmptyDeltas(): ProjectDeltas {
  return {
    decisions: [],
    requirements: [],
    constraints: [],
    risks: [],
    questions: [],
    assumptions: [],
    artifacts: [],
    priorities: [],
  };
}

// ============= Delta Helpers =============

export function getAllDeltas(schema: ProjectSchema): Delta[] {
  const all: Delta[] = [];
  for (const type of DELTA_TYPES) {
    if (type === 'identity') continue;
    const key = `${type}s` as keyof ProjectDeltas;
    if (schema.deltas[key]) {
      all.push(...schema.deltas[key].map(d => ({ ...d, type })));
    }
  }
  return all;
}

export function getDeltasByType(schema: ProjectSchema, type: DeltaType): Delta[] {
  const key = `${type}s` as keyof ProjectDeltas;
  return schema.deltas[key] || [];
}

export function countDeltas(schema: ProjectSchema): number {
  return getAllDeltas(schema).length;
}

export function getHighConfidenceDeltas(schema: ProjectSchema, threshold = 0.8): Delta[] {
  return getAllDeltas(schema).filter(d => d.confidence >= threshold);
}

// ============= Trigger Matching =============

export function matchTrigger(schema: ProjectSchema, trigger: TemplateTrigger): { matches: boolean; reason?: string; confidence?: number } {
  // Decision contains
  if (trigger.decision_contains) {
    const match = schema.deltas.decisions.find(d =>
      d.content.toLowerCase().includes(trigger.decision_contains!.toLowerCase())
    );
    if (match) {
      return {
        matches: true,
        reason: `Decision: "${match.content}"`,
        confidence: match.confidence,
      };
    }
  }

  // Requirement contains
  if (trigger.requirement_contains) {
    const match = schema.deltas.requirements.find(d =>
      d.content.toLowerCase().includes(trigger.requirement_contains!.toLowerCase())
    );
    if (match) {
      return {
        matches: true,
        reason: `Requirement: "${match.content}"`,
        confidence: match.confidence,
      };
    }
  }

  // Constraint contains
  if (trigger.constraint_contains) {
    const match = schema.deltas.constraints.find(d =>
      d.content.toLowerCase().includes(trigger.constraint_contains!.toLowerCase())
    );
    if (match) {
      return {
        matches: true,
        reason: `Constraint: "${match.content}"`,
        confidence: match.confidence,
      };
    }
  }

  // Risk contains
  if (trigger.risk_contains) {
    const match = schema.deltas.risks.find(d =>
      d.content.toLowerCase().includes(trigger.risk_contains!.toLowerCase())
    );
    if (match) {
      return {
        matches: true,
        reason: `Risk: "${match.content}"`,
        confidence: match.confidence,
      };
    }
  }

  // Stack includes
  if (trigger.stack_includes) {
    const match = schema.stack.find(s =>
      s.toLowerCase().includes(trigger.stack_includes!.toLowerCase())
    );
    if (match) {
      return {
        matches: true,
        reason: `Stack includes: ${match}`,
        confidence: 0.9,
      };
    }
  }

  // Has delta type
  if (trigger.has_delta_type) {
    const deltas = getDeltasByType(schema, trigger.has_delta_type);
    if (deltas.length > 0) {
      return {
        matches: true,
        reason: `Has ${deltas.length} ${trigger.has_delta_type}(s)`,
        confidence: 0.7,
      };
    }
  }

  return { matches: false };
}

export function matchAllTriggers(schema: ProjectSchema, triggers: TemplateTrigger[]): Array<{ trigger: TemplateTrigger; result: ReturnType<typeof matchTrigger> }> {
  return triggers.map(trigger => ({
    trigger,
    result: matchTrigger(schema, trigger),
  }));
}

// ============= Schema Serialization =============

export function serializeSchemaForInjection(schema: ProjectSchema): string {
  return `const PROJECT_SCHEMA = ${JSON.stringify(schema, null, 2)};`;
}

export function generateSchemaTypedef(): string {
  return `
interface ProjectSchema {
  identity: {
    name: string;
    mission: string;
    type?: string;
  };
  deltas: {
    decisions: Array<{ content: string; confidence: number }>;
    requirements: Array<{ content: string; confidence: number }>;
    constraints: Array<{ content: string; confidence: number }>;
    risks: Array<{ content: string; confidence: number }>;
    questions: Array<{ content: string; confidence: number }>;
    assumptions: Array<{ content: string; confidence: number }>;
    artifacts: Array<{ content: string; confidence: number }>;
    priorities: Array<{ content: string; confidence: number }>;
  };
  stack: string[];
  meta: {
    extracted_at: string;
    source: string;
    health_score?: number;
  };
}
`.trim();
}

// ============= Forge Memory Schema =============
// The forge itself thinks in MANTIC

export interface ForgeSchema {
  identity: {
    name: string;
    mission: string;
  };
  decisions: Delta[];
  constraints: Delta[];
  patterns: Array<{
    type: DeltaType;
    content: string;
    confidence: number;
    evidence: string;
  }>;
  meta: {
    servers_created: number;
    last_active_project?: string;
    updated_at: string;
  };
}

export function createEmptyForgeSchema(name: string): ForgeSchema {
  return {
    identity: {
      name,
      mission: 'Build tools faster than thought',
    },
    decisions: [
      {
        type: 'decision',
        content: 'TypeScript for all server generation',
        confidence: 0.95,
        timestamp: new Date().toISOString(),
      },
      {
        type: 'decision',
        content: 'MANTIC schema injection in all servers',
        confidence: 1.0,
        timestamp: new Date().toISOString(),
      },
    ],
    constraints: [
      {
        type: 'constraint',
        content: 'All servers must include PROJECT_SCHEMA',
        confidence: 1.0,
      },
      {
        type: 'constraint',
        content: 'No cloud dependencies for core functionality',
        confidence: 0.95,
      },
    ],
    patterns: [],
    meta: {
      servers_created: 0,
      updated_at: new Date().toISOString(),
    },
  };
}
