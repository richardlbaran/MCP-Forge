// ============= Session Manager =============
// Manages the iterative design loop with hard stops.
// This is the guardrail layer that prevents endless improvement.

import type {
  DesignSession,
  DesignProposal,
  SessionStatus,
  FileChange,
  SessionLogEntry,
  ChangeType
} from '../types.js';

function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

function generateProposalId(): string {
  return `proposal-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Hard limits to prevent runaway loops.
 * These are non-negotiable — even if the system thinks it can improve,
 * it MUST stop and wait for human input at these boundaries.
 */
const HARD_LIMITS = {
  /** Max iterations before forcing human review */
  MAX_ITERATIONS_BEFORE_GATE: 3,
  /** Absolute max iterations even with human "continue" */
  ABSOLUTE_MAX_ITERATIONS: 10,
  /** Confidence threshold — if review scores above this, stop iterating */
  CONFIDENCE_STOP_THRESHOLD: 0.85,
  /** Minimum confidence to even propose (below this = bad, don't show) */
  MINIMUM_PROPOSAL_CONFIDENCE: 0.5,
  /** Max files changed in a single proposal */
  MAX_FILES_PER_PROPOSAL: 5,
  /** Max proposals stored per session (memory management) */
  MAX_PROPOSALS_PER_SESSION: 20,
};

export class SessionManager {
  private sessions: Map<string, DesignSession> = new Map();
  private activeSessionId: string | null = null;

  getHardLimits(): typeof HARD_LIMITS {
    return { ...HARD_LIMITS };
  }

  // ---- Session Lifecycle ----

  startSession(
    objective: string,
    scope: string[],
    constraints: string[],
    maxIterations?: number
  ): DesignSession {
    const effectiveMax = Math.min(
      maxIterations ?? HARD_LIMITS.MAX_ITERATIONS_BEFORE_GATE,
      HARD_LIMITS.ABSOLUTE_MAX_ITERATIONS
    );

    const session: DesignSession = {
      id: generateSessionId(),
      objective,
      scope,
      constraints,
      max_iterations: effectiveMax,
      current_iteration: 0,
      proposals: [],
      status: 'planning',
      started_at: new Date().toISOString(),
    };

    this.sessions.set(session.id, session);
    this.activeSessionId = session.id;
    return session;
  }

  getActiveSession(): DesignSession | null {
    if (!this.activeSessionId) return null;
    return this.sessions.get(this.activeSessionId) ?? null;
  }

  getSession(sessionId: string): DesignSession | null {
    return this.sessions.get(sessionId) ?? null;
  }

  // ---- Iteration Control ----

  /**
   * Check if the session can continue iterating.
   * Returns { canContinue, reason } so the caller knows WHY it stopped.
   */
  canContinue(sessionId: string): { canContinue: boolean; reason: string } {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { canContinue: false, reason: 'Session not found' };
    }

    if (session.status === 'complete' || session.status === 'stopped') {
      return { canContinue: false, reason: `Session is ${session.status}` };
    }

    if (session.current_iteration >= HARD_LIMITS.ABSOLUTE_MAX_ITERATIONS) {
      return {
        canContinue: false,
        reason: `Absolute iteration limit reached (${HARD_LIMITS.ABSOLUTE_MAX_ITERATIONS}). Session must end.`,
      };
    }

    if (
      session.current_iteration >= HARD_LIMITS.MAX_ITERATIONS_BEFORE_GATE &&
      session.status !== 'revising'
    ) {
      return {
        canContinue: false,
        reason: `Reached ${HARD_LIMITS.MAX_ITERATIONS_BEFORE_GATE} iterations. Awaiting human review before continuing.`,
      };
    }

    const lastProposal = session.proposals[session.proposals.length - 1];
    if (lastProposal && lastProposal.confidence >= HARD_LIMITS.CONFIDENCE_STOP_THRESHOLD) {
      return {
        canContinue: false,
        reason: `Confidence ${lastProposal.confidence.toFixed(2)} exceeds threshold ${HARD_LIMITS.CONFIDENCE_STOP_THRESHOLD}. Proposal is ready for human review.`,
      };
    }

    return { canContinue: true, reason: 'OK' };
  }

  // ---- Proposal Management ----

  addProposal(
    sessionId: string,
    changes: FileChange[],
    reasoning: string,
    reviewNotes: string,
    confidence: number,
    principlesApplied: string[]
  ): DesignProposal | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    if (changes.length > HARD_LIMITS.MAX_FILES_PER_PROPOSAL) {
      changes = changes.slice(0, HARD_LIMITS.MAX_FILES_PER_PROPOSAL);
    }

    if (confidence < HARD_LIMITS.MINIMUM_PROPOSAL_CONFIDENCE) {
      return null; // Don't even show low-confidence proposals
    }

    session.current_iteration++;

    const proposal: DesignProposal = {
      id: generateProposalId(),
      session_id: sessionId,
      objective: session.objective,
      iteration: session.current_iteration,
      max_iterations: session.max_iterations,
      changes,
      design_reasoning: reasoning,
      review_notes: reviewNotes,
      confidence,
      principles_applied: principlesApplied,
      status: 'pending',
    };

    session.proposals.push(proposal);

    // Enforce max proposals
    if (session.proposals.length > HARD_LIMITS.MAX_PROPOSALS_PER_SESSION) {
      session.proposals = session.proposals.slice(-HARD_LIMITS.MAX_PROPOSALS_PER_SESSION);
    }

    // Update session status
    session.status = 'awaiting_review';

    return proposal;
  }

  /**
   * Human approves the proposal. Record it and end the iteration cycle.
   */
  approveProposal(sessionId: string, proposalId: string): DesignProposal | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const proposal = session.proposals.find(p => p.id === proposalId);
    if (!proposal) return null;

    proposal.status = 'approved';
    session.status = 'complete';
    session.ended_at = new Date().toISOString();

    return proposal;
  }

  /**
   * Human rejects the proposal. Record the reason and stop.
   */
  rejectProposal(
    sessionId: string,
    proposalId: string,
    reason: string
  ): DesignProposal | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const proposal = session.proposals.find(p => p.id === proposalId);
    if (!proposal) return null;

    proposal.status = 'rejected';
    proposal.human_feedback = reason;

    // Don't end the session — human can request a revision
    session.status = 'stopped';
    session.ended_at = new Date().toISOString();

    return proposal;
  }

  /**
   * Human wants a revision. Record feedback and allow more iterations.
   */
  requestRevision(
    sessionId: string,
    proposalId: string,
    feedback: string
  ): { proposal: DesignProposal; canContinue: boolean; reason: string } | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const proposal = session.proposals.find(p => p.id === proposalId);
    if (!proposal) return null;

    proposal.status = 'revision';
    proposal.human_feedback = feedback;
    session.status = 'revising';

    // Grant additional iterations for revision
    session.max_iterations = Math.min(
      session.current_iteration + HARD_LIMITS.MAX_ITERATIONS_BEFORE_GATE,
      HARD_LIMITS.ABSOLUTE_MAX_ITERATIONS
    );

    const continuationCheck = this.canContinue(sessionId);
    return { proposal, ...continuationCheck };
  }

  // ---- Session Summary ----

  /**
   * Generate a summary for the design memory session log.
   */
  getSessionSummary(sessionId: string): SessionLogEntry | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const accepted = session.proposals.filter(p => p.status === 'approved').length;
    const rejected = session.proposals.filter(p => p.status === 'rejected').length;
    const revised = session.proposals.filter(p => p.status === 'revision').length;

    const learnings: string[] = [];

    // Extract learnings from rejections
    session.proposals
      .filter(p => p.status === 'rejected' && p.human_feedback)
      .forEach(p => {
        learnings.push(`Rejected: ${p.human_feedback}`);
      });

    // Extract learnings from revisions
    session.proposals
      .filter(p => p.status === 'revision' && p.human_feedback)
      .forEach(p => {
        learnings.push(`Revised because: ${p.human_feedback}`);
      });

    return {
      session_id: session.id,
      date: session.started_at,
      objective: session.objective,
      files_scoped: session.scope,
      proposals_made: session.proposals.length,
      proposals_accepted: accepted,
      proposals_rejected: rejected,
      proposals_revised: revised,
      iterations: session.current_iteration,
      learnings,
    };
  }

  // ---- Status ----

  getStatus(): {
    active_session: string | null;
    total_sessions: number;
    hard_limits: typeof HARD_LIMITS;
  } {
    return {
      active_session: this.activeSessionId,
      total_sessions: this.sessions.size,
      hard_limits: HARD_LIMITS,
    };
  }
}
