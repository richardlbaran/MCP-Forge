#!/usr/bin/env node
// ============= Forge Design Bot MCP Server =============
//
// A self-improving design bot for MCP Forge.
// Uses design memory (learned preferences) + human approval gates
// to iteratively improve UI/UX with zero runaway risk.
//
// Tools:
//   forge_design_start_session    — Begin a design improvement session
//   forge_design_propose          — Generate a design proposal for a file
//   forge_design_review           — Self-critique a proposal against design memory
//   forge_design_approve          — Human approves (writes changes + updates memory)
//   forge_design_reject           — Human rejects (logs reason + updates memory)
//   forge_design_revise           — Human requests revision (with feedback)
//   forge_design_status           — Check current session status + limits
//   forge_design_memory           — View/query the design memory
//   forge_design_read_file        — Read a source file for analysis
//   forge_design_apply            — Write approved changes to disk

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

import { DesignMemoryService } from "./services/design-memory.js";
import { SessionManager } from "./services/session-manager.js";

// ---- Initialize Services ----

const memoryPath = process.env.DESIGN_MEMORY_PATH
  ?? resolve(process.cwd(), "design_memory.json");

const designMemory = new DesignMemoryService(memoryPath);
const sessionManager = new SessionManager();

// ---- Initialize MCP Server ----

const server = new McpServer({
  name: "forge-design-bot-mcp-server",
  version: "1.0.0",
});

// =============================================
// TOOL 1: Start a design session
// =============================================

server.registerTool(
  "forge_design_start_session",
  {
    title: "Start Design Session",
    description: `Start a new design improvement session with a specific objective.
The session tracks iterations and enforces human approval gates.

Args:
  - objective: What you want to improve (e.g., "Fix Fleet Command empty states")
  - scope: Array of file paths to work on
  - max_iterations: Max iterations before forcing human review (default: 3, max: 10)

Returns: Session ID and design context (principles, patterns, rejected history)

The session will auto-stop after max_iterations and wait for human approval.
It will also stop if confidence exceeds 0.85 on any proposal.`,
    inputSchema: {
      objective: z.string().min(5).describe("What to improve — be specific"),
      scope: z.array(z.string()).min(1).max(10).describe("File paths to work on"),
      max_iterations: z.number().int().min(1).max(10).default(3)
        .describe("Max iterations before human review gate"),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
  },
  async ({ objective, scope, max_iterations }) => {
    const session = sessionManager.startSession(
      objective,
      scope,
      designMemory.getPrinciples(),
      max_iterations
    );

    const designContext = designMemory.buildDesignContext();
    const limits = sessionManager.getHardLimits();

    const output = {
      session_id: session.id,
      status: session.status,
      objective: session.objective,
      scope: session.scope,
      max_iterations: session.max_iterations,
      hard_limits: limits,
      design_context: designContext,
      instructions: [
        "Session started. Use forge_design_read_file to read files in scope.",
        "Then use forge_design_propose to generate improvement proposals.",
        "Use forge_design_review to self-critique before showing to human.",
        `Session will auto-stop after ${session.max_iterations} iterations for human review.`,
        "Human can approve, reject, or request revision on any proposal.",
      ],
    };

    return {
      content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
    };
  }
);

// =============================================
// TOOL 2: Read a file for analysis
// =============================================

server.registerTool(
  "forge_design_read_file",
  {
    title: "Read Source File",
    description: `Read a source file from the project for design analysis.
Use this to understand current implementation before proposing changes.

Args:
  - file_path: Absolute or relative path to the file

Returns: File contents as text`,
    inputSchema: {
      file_path: z.string().min(1).describe("Path to the source file to read"),
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async ({ file_path }) => {
    const resolved = resolve(file_path);

    if (!existsSync(resolved)) {
      return {
        isError: true,
        content: [{
          type: "text",
          text: `File not found: ${resolved}. Check the path and try again.`,
        }],
      };
    }

    try {
      const content = readFileSync(resolved, "utf-8");
      return {
        content: [{
          type: "text",
          text: `// File: ${resolved}\n// Lines: ${content.split("\n").length}\n\n${content}`,
        }],
      };
    } catch (err) {
      return {
        isError: true,
        content: [{
          type: "text",
          text: `Error reading file: ${err instanceof Error ? err.message : String(err)}`,
        }],
      };
    }
  }
);

// =============================================
// TOOL 3: Generate a design proposal
// =============================================

server.registerTool(
  "forge_design_propose",
  {
    title: "Propose Design Changes",
    description: `Generate a design improvement proposal for a file.
The proposal includes the changed content, reasoning, and self-review notes.

IMPORTANT: Always check forge_design_status first to see if you can continue.
The session will block proposals once iteration limits are reached.

Args:
  - session_id: Active session ID
  - file_path: File being improved
  - proposed_content: The improved file content
  - diff_summary: Human-readable description of what changed
  - change_type: Category of change (layout, spacing, color, component, etc.)
  - design_reasoning: Why these changes improve the design
  - review_notes: Self-critique — what's good and what might be wrong
  - confidence: 0.0-1.0 how confident this is a good change
  - principles_applied: Which design principles guided this change

Returns: Proposal ID and session status`,
    inputSchema: {
      session_id: z.string().describe("Active session ID"),
      file_path: z.string().describe("File being changed"),
      proposed_content: z.string().describe("The full improved file content"),
      diff_summary: z.string().describe("Human-readable summary of changes"),
      change_type: z.enum([
        "layout", "spacing", "color", "typography", "component",
        "interaction", "empty_state", "loading_state", "error_state",
        "navigation", "animation", "accessibility", "other",
      ]).describe("Category of design change"),
      design_reasoning: z.string().describe("Why these changes are improvements"),
      review_notes: z.string().describe("Self-critique of the proposal"),
      confidence: z.number().min(0).max(1).describe("Confidence score 0.0-1.0"),
      principles_applied: z.array(z.string()).describe("Which design principles were applied"),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
  },
  async (params) => {
    // Check if we can continue
    const check = sessionManager.canContinue(params.session_id);
    if (!check.canContinue) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            blocked: true,
            reason: check.reason,
            action: "Wait for human review. Use forge_design_status to check.",
          }, null, 2),
        }],
      };
    }

    // Check against rejected patterns
    const conflict = designMemory.conflictsWithRejected(params.diff_summary);
    if (conflict) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            blocked: true,
            reason: `This change conflicts with a previously rejected pattern: "${conflict.description}" — Rejected because: "${conflict.reason}"`,
            action: "Propose a different approach that avoids this pattern.",
          }, null, 2),
        }],
      };
    }

    // Read original file content
    let originalContent = "";
    try {
      const resolved = resolve(params.file_path);
      if (existsSync(resolved)) {
        originalContent = readFileSync(resolved, "utf-8");
      }
    } catch {
      // File might not exist yet, that's OK
    }

    const proposal = sessionManager.addProposal(
      params.session_id,
      [{
        file_path: params.file_path,
        original_content: originalContent,
        proposed_content: params.proposed_content,
        diff_summary: params.diff_summary,
        change_type: params.change_type,
      }],
      params.design_reasoning,
      params.review_notes,
      params.confidence,
      params.principles_applied
    );

    if (!proposal) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            blocked: true,
            reason: "Proposal rejected — confidence below minimum threshold (0.5) or session not found.",
          }, null, 2),
        }],
      };
    }

    // Check if we should stop after this proposal
    const nextCheck = sessionManager.canContinue(params.session_id);

    const output = {
      proposal_id: proposal.id,
      iteration: proposal.iteration,
      max_iterations: proposal.max_iterations,
      confidence: proposal.confidence,
      status: proposal.status,
      can_continue: nextCheck.canContinue,
      next_action: nextCheck.canContinue
        ? "Can iterate more. Use forge_design_review to self-critique, or propose again."
        : `STOPPED: ${nextCheck.reason}. Present this proposal to the human for review.`,
      diff_summary: params.diff_summary,
      design_reasoning: params.design_reasoning,
      review_notes: params.review_notes,
    };

    return {
      content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
    };
  }
);

// =============================================
// TOOL 4: Human approves a proposal
// =============================================

server.registerTool(
  "forge_design_approve",
  {
    title: "Approve Proposal",
    description: `Human approves a design proposal. This:
1. Marks the proposal as approved
2. Records the pattern in design memory (so future proposals learn from it)
3. Ends the session

After approving, use forge_design_apply to write changes to disk.

Args:
  - session_id: Session ID
  - proposal_id: Proposal to approve

Returns: Confirmation and updated acceptance rate`,
    inputSchema: {
      session_id: z.string(),
      proposal_id: z.string(),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async ({ session_id, proposal_id }) => {
    const proposal = sessionManager.approveProposal(session_id, proposal_id);
    if (!proposal) {
      return {
        isError: true,
        content: [{ type: "text", text: "Session or proposal not found." }],
      };
    }

    // Record in design memory
    for (const change of proposal.changes) {
      designMemory.recordApproval(
        change.file_path,
        change.diff_summary,
        change.change_type
      );
    }

    // Log session
    const summary = sessionManager.getSessionSummary(session_id);
    if (summary) {
      designMemory.recordSession(summary);
    }

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          status: "approved",
          proposal_id,
          message: "Proposal approved. Design memory updated.",
          acceptance_rate: designMemory.getAcceptanceRate(),
          next_action: "Use forge_design_apply to write changes to disk.",
        }, null, 2),
      }],
    };
  }
);

// =============================================
// TOOL 5: Human rejects a proposal
// =============================================

server.registerTool(
  "forge_design_reject",
  {
    title: "Reject Proposal",
    description: `Human rejects a design proposal with a reason.
The reason is stored in design memory so the bot learns what NOT to do.

Args:
  - session_id: Session ID
  - proposal_id: Proposal to reject
  - reason: Why this was rejected — be specific so the bot learns

Returns: Confirmation. Session is stopped.`,
    inputSchema: {
      session_id: z.string(),
      proposal_id: z.string(),
      reason: z.string().min(5).describe("Why rejected — be specific for learning"),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async ({ session_id, proposal_id, reason }) => {
    const proposal = sessionManager.rejectProposal(session_id, proposal_id, reason);
    if (!proposal) {
      return {
        isError: true,
        content: [{ type: "text", text: "Session or proposal not found." }],
      };
    }

    // Record rejection in design memory
    for (const change of proposal.changes) {
      designMemory.recordRejection(change.file_path, change.diff_summary, reason);
    }

    // Log session
    const summary = sessionManager.getSessionSummary(session_id);
    if (summary) {
      designMemory.recordSession(summary);
    }

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          status: "rejected",
          reason,
          message: "Rejection recorded. Design memory updated — this pattern will be avoided.",
          acceptance_rate: designMemory.getAcceptanceRate(),
          next_action: "Start a new session with forge_design_start_session if you want to try again.",
        }, null, 2),
      }],
    };
  }
);

// =============================================
// TOOL 6: Human requests revision
// =============================================

server.registerTool(
  "forge_design_revise",
  {
    title: "Request Revision",
    description: `Human wants changes to the proposal. Provides feedback for the next iteration.
This grants additional iterations (up to the absolute max of 10).

Args:
  - session_id: Session ID
  - proposal_id: Proposal to revise
  - feedback: What to change — specific instructions for the next iteration

Returns: Whether the bot can continue iterating.`,
    inputSchema: {
      session_id: z.string(),
      proposal_id: z.string(),
      feedback: z.string().min(5).describe("What to change in the next iteration"),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
  },
  async ({ session_id, proposal_id, feedback }) => {
    const result = sessionManager.requestRevision(session_id, proposal_id, feedback);
    if (!result) {
      return {
        isError: true,
        content: [{ type: "text", text: "Session or proposal not found." }],
      };
    }

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          status: "revision_requested",
          feedback,
          can_continue: result.canContinue,
          reason: result.reason,
          next_action: result.canContinue
            ? "Use forge_design_propose to submit revised proposal incorporating the feedback."
            : `Cannot continue: ${result.reason}`,
        }, null, 2),
      }],
    };
  }
);

// =============================================
// TOOL 7: Write approved changes to disk
// =============================================

server.registerTool(
  "forge_design_apply",
  {
    title: "Apply Approved Changes",
    description: `Write approved proposal changes to disk.
Only works on proposals with status "approved".
Creates a .bak backup of each file before overwriting.

Args:
  - session_id: Session ID
  - proposal_id: Approved proposal to apply

Returns: List of files written and backup paths.`,
    inputSchema: {
      session_id: z.string(),
      proposal_id: z.string(),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: false,
    },
  },
  async ({ session_id, proposal_id }) => {
    const session = sessionManager.getSession(session_id);
    if (!session) {
      return {
        isError: true,
        content: [{ type: "text", text: "Session not found." }],
      };
    }

    const proposal = session.proposals.find(p => p.id === proposal_id);
    if (!proposal || proposal.status !== "approved") {
      return {
        isError: true,
        content: [{
          type: "text",
          text: "Proposal not found or not approved. Only approved proposals can be applied.",
        }],
      };
    }

    const results: Array<{ file: string; backup: string; status: string }> = [];

    for (const change of proposal.changes) {
      const filePath = resolve(change.file_path);
      const backupPath = filePath + ".bak";

      try {
        // Backup original
        if (existsSync(filePath)) {
          const original = readFileSync(filePath, "utf-8");
          writeFileSync(backupPath, original, "utf-8");
        }

        // Write new content
        writeFileSync(filePath, change.proposed_content, "utf-8");

        results.push({
          file: filePath,
          backup: backupPath,
          status: "written",
        });
      } catch (err) {
        results.push({
          file: filePath,
          backup: backupPath,
          status: `error: ${err instanceof Error ? err.message : String(err)}`,
        });
      }
    }

    // Mark proposal as applied
    proposal.status = "applied" as any;

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          applied: true,
          files: results,
          message: "Changes written to disk. Backups created with .bak extension.",
        }, null, 2),
      }],
    };
  }
);

// =============================================
// TOOL 8: Check session status
// =============================================

server.registerTool(
  "forge_design_status",
  {
    title: "Session Status",
    description: `Check the current design session status, iteration count, and limits.
Use this before proposing to see if you can continue.

Returns: Active session details, iteration count, limits, and whether you can continue.`,
    inputSchema: {},
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async () => {
    const session = sessionManager.getActiveSession();
    const managerStatus = sessionManager.getStatus();

    if (!session) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            active_session: null,
            message: "No active session. Use forge_design_start_session to begin.",
            hard_limits: managerStatus.hard_limits,
          }, null, 2),
        }],
      };
    }

    const check = sessionManager.canContinue(session.id);

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          session_id: session.id,
          objective: session.objective,
          status: session.status,
          current_iteration: session.current_iteration,
          max_iterations: session.max_iterations,
          proposals_count: session.proposals.length,
          can_continue: check.canContinue,
          reason: check.reason,
          latest_proposal: session.proposals.length > 0
            ? {
                id: session.proposals[session.proposals.length - 1].id,
                confidence: session.proposals[session.proposals.length - 1].confidence,
                status: session.proposals[session.proposals.length - 1].status,
              }
            : null,
          hard_limits: managerStatus.hard_limits,
          design_memory_stats: {
            acceptance_rate: designMemory.getAcceptanceRate(),
            approved_patterns: designMemory.getApprovedPatterns().length,
            rejected_patterns: designMemory.getRejectedPatterns().length,
            most_accepted_types: designMemory.getMostAcceptedChangeTypes().slice(0, 5),
          },
        }, null, 2),
      }],
    };
  }
);

// =============================================
// TOOL 9: Query design memory
// =============================================

server.registerTool(
  "forge_design_memory",
  {
    title: "Query Design Memory",
    description: `View the design memory — principles, patterns, color palette, and learned preferences.
Use this to understand what the human likes/dislikes before making proposals.

Args:
  - section: Which part to view (all, principles, patterns, colors, typography, rejected, approved, stats)

Returns: The requested section of design memory.`,
    inputSchema: {
      section: z.enum([
        "all", "principles", "patterns", "colors",
        "typography", "rejected", "approved", "stats",
      ]).default("all").describe("Which section of design memory to view"),
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async ({ section }) => {
    const memory = designMemory.getMemory();
    let result: unknown;

    switch (section) {
      case "principles":
        result = memory.design_principles;
        break;
      case "patterns":
        result = memory.component_patterns;
        break;
      case "colors":
        result = memory.color_palette;
        break;
      case "typography":
        result = memory.typography;
        break;
      case "rejected":
        result = memory.rejected_patterns;
        break;
      case "approved":
        result = memory.approved_patterns;
        break;
      case "stats":
        result = {
          total_sessions: memory._meta.total_sessions,
          total_proposals: memory._meta.total_proposals,
          acceptance_rate: memory._meta.acceptance_rate,
          last_updated: memory._meta.last_updated,
          most_accepted_types: designMemory.getMostAcceptedChangeTypes(),
          most_rejected_files: designMemory.getMostRejectedFiles(),
        };
        break;
      case "all":
      default:
        result = memory;
        break;
    }

    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

// =============================================
// TOOL 10: Add a design principle
// =============================================

server.registerTool(
  "forge_design_add_principle",
  {
    title: "Add Design Principle",
    description: `Add a new design principle to the memory.
This principle will guide all future proposals.

Args:
  - principle: The design principle to add

Returns: Updated principles list.`,
    inputSchema: {
      principle: z.string().min(10).describe("The design principle to add"),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async ({ principle }) => {
    designMemory.addPrinciple(principle);
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          added: principle,
          total_principles: designMemory.getPrinciples().length,
          all_principles: designMemory.getPrinciples(),
        }, null, 2),
      }],
    };
  }
);

// ---- Start Server ----

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Forge Design Bot MCP server running on stdio");
  console.error(`Design memory: ${memoryPath}`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
