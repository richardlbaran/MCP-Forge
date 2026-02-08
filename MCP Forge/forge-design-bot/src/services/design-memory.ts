// ============= Design Memory Service =============
// Reads, writes, and evolves the design memory based on human feedback.
// This is the persistent learning layer — survives across sessions.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type {
  DesignMemory,
  RejectedPattern,
  ApprovedPattern,
  SessionLogEntry,
  ChangeType
} from '../types.js';

const DEFAULT_MEMORY_PATH = resolve(process.cwd(), 'design_memory.json');

export class DesignMemoryService {
  private memory: DesignMemory;
  private memoryPath: string;

  constructor(memoryPath?: string) {
    this.memoryPath = memoryPath ?? DEFAULT_MEMORY_PATH;
    this.memory = this.load();
  }

  // ---- Read Operations ----

  load(): DesignMemory {
    if (!existsSync(this.memoryPath)) {
      throw new Error(
        `Design memory not found at ${this.memoryPath}. ` +
        `Run with --init to create a default design_memory.json.`
      );
    }
    const raw = readFileSync(this.memoryPath, 'utf-8');
    return JSON.parse(raw) as DesignMemory;
  }

  getMemory(): DesignMemory {
    return this.memory;
  }

  getPrinciples(): string[] {
    return this.memory.design_principles;
  }

  getComponentPatterns(): Record<string, unknown> {
    return this.memory.component_patterns;
  }

  getColorPalette(): Record<string, unknown> {
    return this.memory.color_palette;
  }

  getRejectedPatterns(): RejectedPattern[] {
    return this.memory.rejected_patterns;
  }

  getApprovedPatterns(): ApprovedPattern[] {
    return this.memory.approved_patterns;
  }

  getAcceptanceRate(): number {
    return this.memory._meta.acceptance_rate;
  }

  /**
   * Build a context prompt for agents that includes all design constraints.
   * This is what gets injected into every agent's system prompt.
   */
  buildDesignContext(): string {
    const m = this.memory;
    const sections: string[] = [];

    sections.push('# DESIGN MEMORY — Follow These Constraints\n');

    sections.push('## Principles (MUST follow)');
    m.design_principles.forEach((p, i) => {
      sections.push(`${i + 1}. ${p}`);
    });

    sections.push('\n## Component Patterns');
    sections.push(JSON.stringify(m.component_patterns, null, 2));

    sections.push('\n## Color Palette');
    sections.push(JSON.stringify(m.color_palette, null, 2));

    sections.push('\n## Typography');
    sections.push(JSON.stringify(m.typography, null, 2));

    if (m.rejected_patterns.length > 0) {
      sections.push('\n## REJECTED Patterns (NEVER do these)');
      m.rejected_patterns.slice(-20).forEach(rp => {
        sections.push(`- ${rp.description} — Rejected because: ${rp.reason}`);
      });
    }

    if (m.approved_patterns.length > 0) {
      sections.push('\n## APPROVED Patterns (User likes these)');
      m.approved_patterns.slice(-20).forEach(ap => {
        sections.push(`- ${ap.description} (${ap.change_type})`);
      });
    }

    return sections.join('\n');
  }

  // ---- Write Operations ----

  private save(): void {
    this.memory._meta.last_updated = new Date().toISOString();
    writeFileSync(this.memoryPath, JSON.stringify(this.memory, null, 2), 'utf-8');
  }

  recordApproval(
    file: string,
    description: string,
    changeType: ChangeType
  ): void {
    this.memory.approved_patterns.push({
      date: new Date().toISOString(),
      file,
      description,
      change_type: changeType,
    });
    this.memory._meta.total_proposals++;
    this.recalculateAcceptanceRate();
    this.save();
  }

  recordRejection(
    file: string,
    description: string,
    reason: string
  ): void {
    this.memory.rejected_patterns.push({
      date: new Date().toISOString(),
      file,
      description,
      reason,
    });
    this.memory._meta.total_proposals++;
    this.recalculateAcceptanceRate();
    this.save();
  }

  recordSession(entry: SessionLogEntry): void {
    this.memory.session_log.push(entry);
    this.memory._meta.total_sessions++;
    this.save();
  }

  addPrinciple(principle: string): void {
    if (!this.memory.design_principles.includes(principle)) {
      this.memory.design_principles.push(principle);
      this.save();
    }
  }

  private recalculateAcceptanceRate(): void {
    const total = this.memory.approved_patterns.length + this.memory.rejected_patterns.length;
    if (total === 0) {
      this.memory._meta.acceptance_rate = 0;
      return;
    }
    this.memory._meta.acceptance_rate =
      Math.round((this.memory.approved_patterns.length / total) * 100) / 100;
  }

  // ---- Analysis ----

  /**
   * Return which change types get approved most often.
   * Used by the design agent to prioritize what kinds of changes to propose.
   */
  getMostAcceptedChangeTypes(): Array<{ type: ChangeType; count: number }> {
    const counts = new Map<ChangeType, number>();
    for (const ap of this.memory.approved_patterns) {
      counts.set(ap.change_type, (counts.get(ap.change_type) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Return files that have been rejected most — signals areas of strong preference.
   */
  getMostRejectedFiles(): Array<{ file: string; count: number }> {
    const counts = new Map<string, number>();
    for (const rp of this.memory.rejected_patterns) {
      counts.set(rp.file, (counts.get(rp.file) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([file, count]) => ({ file, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Check if a proposed change conflicts with known rejected patterns.
   */
  conflictsWithRejected(description: string): RejectedPattern | undefined {
    const descLower = description.toLowerCase();
    return this.memory.rejected_patterns.find(rp =>
      descLower.includes(rp.description.toLowerCase().substring(0, 30))
    );
  }
}
