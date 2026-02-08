// ============= Design Bot Types =============

export interface DesignMemory {
  _meta: {
    version: string;
    description: string;
    last_updated: string | null;
    total_sessions: number;
    total_proposals: number;
    acceptance_rate: number;
  };
  design_principles: string[];
  component_patterns: Record<string, unknown>;
  color_palette: Record<string, unknown>;
  typography: Record<string, unknown>;
  rejected_patterns: RejectedPattern[];
  approved_patterns: ApprovedPattern[];
  session_log: SessionLogEntry[];
}

export interface RejectedPattern {
  date: string;
  file: string;
  description: string;
  reason: string;
}

export interface ApprovedPattern {
  date: string;
  file: string;
  description: string;
  change_type: ChangeType;
}

export type ChangeType =
  | 'layout'
  | 'spacing'
  | 'color'
  | 'typography'
  | 'component'
  | 'interaction'
  | 'empty_state'
  | 'loading_state'
  | 'error_state'
  | 'navigation'
  | 'animation'
  | 'accessibility'
  | 'other';

export interface SessionLogEntry {
  session_id: string;
  date: string;
  objective: string;
  files_scoped: string[];
  proposals_made: number;
  proposals_accepted: number;
  proposals_rejected: number;
  proposals_revised: number;
  iterations: number;
  learnings: string[];
}

// ============= Proposal Types =============

export interface FileChange {
  file_path: string;
  original_content: string;
  proposed_content: string;
  diff_summary: string;
  change_type: ChangeType;
}

export interface DesignProposal {
  id: string;
  session_id: string;
  objective: string;
  iteration: number;
  max_iterations: number;
  changes: FileChange[];
  design_reasoning: string;
  review_notes: string;
  confidence: number;
  principles_applied: string[];
  status: ProposalStatus;
  human_feedback?: string;
}

export type ProposalStatus =
  | 'pending'       // Awaiting human review
  | 'approved'      // Human accepted
  | 'rejected'      // Human rejected (with reason)
  | 'revision'      // Human wants changes (with feedback)
  | 'auto_stopped'  // Hit max iterations or confidence threshold
  | 'applied';      // Changes written to files

// ============= Review Types =============

export interface DesignReview {
  issues: DesignIssue[];
  score: number;            // 0-1, how well it matches design memory
  passes_threshold: boolean; // score >= 0.7
  suggestions: string[];
}

export interface DesignIssue {
  severity: 'critical' | 'warning' | 'suggestion';
  description: string;
  principle_violated?: string;
  fix_suggestion: string;
}

// ============= Session Types =============

export interface DesignSession {
  id: string;
  objective: string;
  scope: string[];
  constraints: string[];
  max_iterations: number;
  current_iteration: number;
  proposals: DesignProposal[];
  status: SessionStatus;
  started_at: string;
  ended_at?: string;
}

export type SessionStatus =
  | 'planning'
  | 'proposing'
  | 'awaiting_review'
  | 'revising'
  | 'complete'
  | 'stopped';

// ============= Agent Role Types =============

export interface AgentContext {
  role: AgentRole;
  design_memory: DesignMemory;
  session: DesignSession;
  file_contents: Map<string, string>;
}

export type AgentRole = 'designer' | 'coder' | 'reviewer';
