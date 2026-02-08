/**
 * Worker Manager - Spawns, tracks, and controls MCP worker processes
 * 
 * Manages the lifecycle of worker child processes and routes tasks to available workers.
 */

import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { randomBytes } from 'crypto';
import type {
  Worker,
  Task,
  LogEntry,
  FleetEvent,
  WorkerStatus,
  LogLevel,
} from '../types/workers';

// ============= Internal Types =============

interface WorkerProcess {
  worker: Worker;
  process: ChildProcess;
  taskQueue: Task[];
  stdoutBuffer: string;
  stderrBuffer: string;
}

interface TaskResult {
  success: boolean;
  result?: unknown;
  error?: string;
}

// ============= ID Generation =============

function generateId(prefix: string): string {
  return `${prefix}-${randomBytes(8).toString('hex')}`;
}

// ============= Worker Manager =============

export class WorkerManager extends EventEmitter {
  private workers: Map<string, WorkerProcess> = new Map();
  private tasks: Map<string, Task> = new Map();
  private taskIdCounter = 0;
  private logIdCounter = 0;

  // ============= Event Emission =============

  private emitEvent(event: FleetEvent): void {
    this.emit('event', event);
  }

  private emitLog(workerId: string, level: LogLevel, message: string, meta?: Record<string, unknown>): void {
    const entry: LogEntry = {
      id: `log-${++this.logIdCounter}`,
      workerId,
      timestamp: new Date().toISOString(),
      level,
      message,
      meta,
    };
    this.emitEvent({ type: 'log:entry', entry });
  }

  // ============= Worker Lifecycle =============

  /**
   * Spawn a new worker process
   */
  spawnWorker(serverId: string, serverName: string, command: string, args: string[] = []): Worker {
    const workerId = generateId('worker');
    const now = new Date().toISOString();

    const worker: Worker = {
      id: workerId,
      serverId,
      serverName,
      status: 'starting',
      startedAt: now,
      lastActivityAt: now,
      metrics: {
        tasksCompleted: 0,
        tasksFailed: 0,
        avgLatencyMs: 0,
        tokensUsed: 0,
      },
    };

    // Spawn the child process
    const proc = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env },
      shell: false,
    });

    const workerProcess: WorkerProcess = {
      worker,
      process: proc,
      taskQueue: [],
      stdoutBuffer: '',
      stderrBuffer: '',
    };

    // Store immediately
    this.workers.set(workerId, workerProcess);

    // Set PID if available
    if (proc.pid) {
      worker.pid = proc.pid;
    }

    // Emit worker started event
    this.emitEvent({ type: 'worker:started', worker: { ...worker } });
    this.emitLog(workerId, 'info', `Worker spawning: ${command} ${args.join(' ')}`);

    // Handle stdout - parse as JSON-RPC responses
    proc.stdout?.on('data', (data: Buffer) => {
      this.handleStdout(workerId, data);
    });

    // Handle stderr - emit as logs
    proc.stderr?.on('data', (data: Buffer) => {
      this.handleStderr(workerId, data);
    });

    // Handle process events
    proc.on('spawn', () => {
      this.transitionWorkerStatus(workerId, 'idle');
      this.emitLog(workerId, 'info', `Worker process started (PID: ${proc.pid})`);
      this.processNextTask(workerId);
    });

    proc.on('error', (error: Error) => {
      this.emitLog(workerId, 'error', `Process error: ${error.message}`);
      this.transitionWorkerStatus(workerId, 'error');
      this.handleWorkerCrash(workerId, error.message);
    });

    proc.on('exit', (code: number | null, signal: string | null) => {
      const reason = signal ? `signal ${signal}` : `code ${code}`;
      this.emitLog(workerId, 'info', `Process exited with ${reason}`);
      this.handleWorkerExit(workerId, code, signal);
    });

    proc.on('close', (_code: number | null) => {
      // Final cleanup after all streams closed
      if (this.workers.has(workerId)) {
        this.cleanupWorker(workerId);
      }
    });

    return { ...worker };
  }

  /**
   * Kill a worker process
   */
  killWorker(workerId: string): boolean {
    const wp = this.workers.get(workerId);
    if (!wp) {
      return false;
    }

    this.transitionWorkerStatus(workerId, 'stopping');
    this.emitLog(workerId, 'info', 'Stopping worker...');

    // Cancel any running task
    if (wp.worker.currentTaskId) {
      this.cancelTask(wp.worker.currentTaskId);
    }

    // Cancel queued tasks
    for (const task of wp.taskQueue) {
      this.failTask(task.id, 'Worker killed');
    }
    wp.taskQueue = [];

    // Kill the process
    try {
      wp.process.kill('SIGTERM');
      
      // Force kill after timeout
      setTimeout(() => {
        if (wp.process.exitCode === null && wp.process.signalCode === null) {
          wp.process.kill('SIGKILL');
        }
      }, 5000);

      return true;
    } catch {
      this.cleanupWorker(workerId);
      return true;
    }
  }

  /**
   * Kill all workers
   */
  killAll(): void {
    for (const workerId of this.workers.keys()) {
      this.killWorker(workerId);
    }
  }

  // ============= Task Management =============

  /**
   * Submit a task for execution
   */
  submitTask(tool: string, params: Record<string, unknown>): Task {
    const taskId = `task-${++this.taskIdCounter}`;
    const now = new Date().toISOString();

    const task: Task = {
      id: taskId,
      tool,
      params,
      status: 'queued',
      createdAt: now,
    };

    this.tasks.set(taskId, task);
    this.emitEvent({ type: 'task:queued', task: { ...task } });

    // Try to assign to an available worker
    this.assignTaskToAvailableWorker(task);

    return { ...task };
  }

  /**
   * Cancel a task
   */
  cancelTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) {
      return false;
    }

    if (task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled') {
      return false;
    }

    // If running, we can't really cancel the process mid-execution
    // but we mark it cancelled so the result is ignored
    task.status = 'cancelled';
    task.completedAt = new Date().toISOString();

    // Remove from worker's queue if queued
    if (task.workerId) {
      const wp = this.workers.get(task.workerId);
      if (wp) {
        wp.taskQueue = wp.taskQueue.filter(t => t.id !== taskId);
      }
    }

    this.emitEvent({
      type: 'task:failed',
      taskId,
      error: 'Task cancelled',
    });

    return true;
  }

  // ============= Queries =============

  getWorker(workerId: string): Worker | undefined {
    const wp = this.workers.get(workerId);
    return wp ? { ...wp.worker } : undefined;
  }

  getAllWorkers(): Worker[] {
    return Array.from(this.workers.values()).map(wp => ({ ...wp.worker }));
  }

  getTask(taskId: string): Task | undefined {
    const task = this.tasks.get(taskId);
    return task ? { ...task } : undefined;
  }

  getQueuedTasks(): Task[] {
    return Array.from(this.tasks.values())
      .filter(t => t.status === 'queued')
      .map(t => ({ ...t }));
  }

  getRunningTasks(): Task[] {
    return Array.from(this.tasks.values())
      .filter(t => t.status === 'running')
      .map(t => ({ ...t }));
  }

  // ============= Internal: stdout/stderr Handling =============

  private handleStdout(workerId: string, data: Buffer): void {
    const wp = this.workers.get(workerId);
    if (!wp) return;

    wp.stdoutBuffer += data.toString();
    wp.worker.lastActivityAt = new Date().toISOString();

    // Try to parse complete JSON objects (newline-delimited)
    const lines = wp.stdoutBuffer.split('\n');
    wp.stdoutBuffer = lines.pop() || ''; // Keep incomplete line in buffer

    for (const line of lines) {
      if (!line.trim()) continue;

      try {
        const parsed = JSON.parse(line);
        this.handleWorkerResponse(workerId, parsed);
      } catch {
        // Not JSON, emit as info log
        this.emitLog(workerId, 'info', line);
      }
    }
  }

  private handleStderr(workerId: string, data: Buffer): void {
    const wp = this.workers.get(workerId);
    if (!wp) return;

    wp.stderrBuffer += data.toString();
    wp.worker.lastActivityAt = new Date().toISOString();

    // Parse lines and emit as logs
    const lines = wp.stderrBuffer.split('\n');
    wp.stderrBuffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;

      // Try to detect log level from common patterns
      const level = this.detectLogLevel(line);
      this.emitLog(workerId, level, line);
    }
  }

  private detectLogLevel(message: string): LogLevel {
    const lower = message.toLowerCase();
    if (lower.includes('error') || lower.includes('fatal')) return 'error';
    if (lower.includes('warn')) return 'warn';
    if (lower.includes('debug')) return 'debug';
    return 'info';
  }

  private handleWorkerResponse(workerId: string, response: unknown): void {
    const wp = this.workers.get(workerId);
    if (!wp || !wp.worker.currentTaskId) return;

    const taskId = wp.worker.currentTaskId;
    const task = this.tasks.get(taskId);
    if (!task || task.status === 'cancelled') {
      // Task was cancelled, ignore result
      this.workerBecameIdle(workerId);
      return;
    }

    // Check if response indicates progress
    if (this.isProgressUpdate(response)) {
      const progress = (response as { progress: number }).progress;
      task.progress = progress;
      this.emitEvent({ type: 'task:progress', taskId, progress });
      return;
    }

    // Otherwise treat as completion
    const result = this.parseTaskResult(response);
    
    if (result.success) {
      this.completeTask(taskId, result.result);
    } else {
      this.failTask(taskId, result.error || 'Unknown error');
    }

    this.workerBecameIdle(workerId);
  }

  private isProgressUpdate(response: unknown): boolean {
    return (
      typeof response === 'object' &&
      response !== null &&
      'progress' in response &&
      typeof (response as { progress: unknown }).progress === 'number'
    );
  }

  private parseTaskResult(response: unknown): TaskResult {
    // Handle MCP JSON-RPC response format
    if (typeof response === 'object' && response !== null) {
      const r = response as Record<string, unknown>;
      
      // JSON-RPC error
      if ('error' in r) {
        const error = r.error as Record<string, unknown>;
        return {
          success: false,
          error: String(error.message || error),
        };
      }

      // JSON-RPC result
      if ('result' in r) {
        return { success: true, result: r.result };
      }

      // Direct result
      return { success: true, result: response };
    }

    return { success: true, result: response };
  }

  // ============= Internal: Task Assignment =============

  private assignTaskToAvailableWorker(task: Task): void {
    // Find first available (idle) worker
    for (const [workerId, wp] of this.workers) {
      if (wp.worker.status === 'idle') {
        this.assignTaskToWorker(task, workerId);
        return;
      }
    }

    // No idle workers - queue to first worker with smallest queue (simple load balancing)
    let bestWorker: string | null = null;
    let smallestQueue = Infinity;

    for (const [workerId, wp] of this.workers) {
      if (wp.worker.status !== 'stopping' && wp.worker.status !== 'error') {
        if (wp.taskQueue.length < smallestQueue) {
          smallestQueue = wp.taskQueue.length;
          bestWorker = workerId;
        }
      }
    }

    if (bestWorker) {
      const wp = this.workers.get(bestWorker)!;
      task.workerId = bestWorker;
      wp.taskQueue.push(task);
    }
    // If no workers available, task stays in 'queued' status without workerId
  }

  private assignTaskToWorker(task: Task, workerId: string): void {
    const wp = this.workers.get(workerId);
    if (!wp) return;

    task.workerId = workerId;
    task.status = 'running';
    task.startedAt = new Date().toISOString();
    wp.worker.currentTaskId = task.id;

    this.transitionWorkerStatus(workerId, 'busy');
    this.emitEvent({ type: 'task:started', taskId: task.id, workerId });

    // Send task to worker via stdin
    this.sendTaskToWorker(wp, task);
  }

  private sendTaskToWorker(wp: WorkerProcess, task: Task): void {
    // Send as JSON-RPC request
    const request = {
      jsonrpc: '2.0',
      id: task.id,
      method: 'tools/call',
      params: {
        name: task.tool,
        arguments: task.params,
      },
    };

    const message = JSON.stringify(request) + '\n';
    
    try {
      wp.process.stdin?.write(message, (error) => {
        if (error) {
          this.emitLog(wp.worker.id, 'error', `Failed to send task: ${error.message}`);
          this.failTask(task.id, `Failed to send to worker: ${error.message}`);
          this.workerBecameIdle(wp.worker.id);
        }
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.emitLog(wp.worker.id, 'error', `Failed to write to stdin: ${msg}`);
      this.failTask(task.id, `Worker communication error: ${msg}`);
      this.workerBecameIdle(wp.worker.id);
    }
  }

  private processNextTask(workerId: string): void {
    const wp = this.workers.get(workerId);
    if (!wp || wp.worker.status !== 'idle') return;

    // Check worker's own queue first
    if (wp.taskQueue.length > 0) {
      const task = wp.taskQueue.shift()!;
      this.assignTaskToWorker(task, workerId);
      return;
    }

    // Check global unassigned queued tasks
    for (const task of this.tasks.values()) {
      if (task.status === 'queued' && !task.workerId) {
        this.assignTaskToWorker(task, workerId);
        return;
      }
    }
  }

  private workerBecameIdle(workerId: string): void {
    const wp = this.workers.get(workerId);
    if (!wp) return;

    wp.worker.currentTaskId = undefined;
    this.transitionWorkerStatus(workerId, 'idle');
    this.processNextTask(workerId);
  }

  // ============= Internal: Task Completion =============

  private completeTask(taskId: string, result: unknown): void {
    const task = this.tasks.get(taskId);
    if (!task) return;

    const now = new Date().toISOString();
    task.status = 'completed';
    task.completedAt = now;
    task.result = result;

    // Update worker metrics
    if (task.workerId) {
      const wp = this.workers.get(task.workerId);
      if (wp && task.startedAt) {
        const latency = new Date(now).getTime() - new Date(task.startedAt).getTime();
        this.updateWorkerMetrics(wp, true, latency);
      }
    }

    this.emitEvent({ type: 'task:completed', taskId, result });
  }

  private failTask(taskId: string, error: string): void {
    const task = this.tasks.get(taskId);
    if (!task) return;

    const now = new Date().toISOString();
    task.status = 'failed';
    task.completedAt = now;
    task.error = error;

    // Update worker metrics
    if (task.workerId) {
      const wp = this.workers.get(task.workerId);
      if (wp && task.startedAt) {
        const latency = new Date(now).getTime() - new Date(task.startedAt).getTime();
        this.updateWorkerMetrics(wp, false, latency);
      }
    }

    this.emitEvent({ type: 'task:failed', taskId, error });
  }

  private updateWorkerMetrics(wp: WorkerProcess, success: boolean, latencyMs: number): void {
    const metrics = wp.worker.metrics;
    
    if (success) {
      metrics.tasksCompleted++;
    } else {
      metrics.tasksFailed++;
    }

    // Update rolling average latency
    const totalTasks = metrics.tasksCompleted + metrics.tasksFailed;
    metrics.avgLatencyMs = (
      (metrics.avgLatencyMs * (totalTasks - 1) + latencyMs) / totalTasks
    );

    // Emit worker update
    this.emitEvent({
      type: 'worker:updated',
      workerId: wp.worker.id,
      changes: { metrics: { ...metrics } },
    });
  }

  // ============= Internal: Worker Status Transitions =============

  private transitionWorkerStatus(workerId: string, newStatus: WorkerStatus): void {
    const wp = this.workers.get(workerId);
    if (!wp) return;

    const oldStatus = wp.worker.status;
    if (oldStatus === newStatus) return;

    wp.worker.status = newStatus;
    wp.worker.lastActivityAt = new Date().toISOString();

    this.emitEvent({
      type: 'worker:updated',
      workerId,
      changes: { 
        status: newStatus,
        lastActivityAt: wp.worker.lastActivityAt,
      },
    });
  }

  // ============= Internal: Crash/Exit Handling =============

  private handleWorkerCrash(workerId: string, error: string): void {
    const wp = this.workers.get(workerId);
    if (!wp) return;

    // Fail current task if any
    if (wp.worker.currentTaskId) {
      this.failTask(wp.worker.currentTaskId, `Worker crashed: ${error}`);
    }

    // Fail queued tasks
    for (const task of wp.taskQueue) {
      this.failTask(task.id, `Worker crashed: ${error}`);
    }
    wp.taskQueue = [];
  }

  private handleWorkerExit(workerId: string, code: number | null, signal: string | null): void {
    const wp = this.workers.get(workerId);
    if (!wp) return;

    // If unexpected exit (not from killWorker), handle as crash
    if (wp.worker.status !== 'stopping') {
      const reason = signal ? `signal ${signal}` : `exit code ${code}`;
      this.handleWorkerCrash(workerId, `Unexpected exit: ${reason}`);
      this.transitionWorkerStatus(workerId, 'error');
    }
  }

  private cleanupWorker(workerId: string): void {
    const wp = this.workers.get(workerId);
    if (!wp) return;

    // Remove from map
    this.workers.delete(workerId);

    // Emit stopped event
    this.emitEvent({ type: 'worker:stopped', workerId });
  }

  // ============= Cleanup =============

  /**
   * Gracefully shut down the manager
   */
  async shutdown(): Promise<void> {
    this.killAll();
    
    // Wait for all processes to exit
    const exitPromises = Array.from(this.workers.values()).map(wp => 
      new Promise<void>(resolve => {
        if (wp.process.exitCode !== null || wp.process.signalCode !== null) {
          resolve();
        } else {
          wp.process.on('close', () => resolve());
        }
      })
    );

    await Promise.race([
      Promise.all(exitPromises),
      new Promise(resolve => setTimeout(resolve, 10000)), // 10s timeout
    ]);

    this.workers.clear();
    this.tasks.clear();
  }
}

// ============= Singleton Export (optional) =============

let instance: WorkerManager | null = null;

export function getWorkerManager(): WorkerManager {
  if (!instance) {
    instance = new WorkerManager();
  }
  return instance;
}

export function resetWorkerManager(): void {
  if (instance) {
    instance.killAll();
    instance = null;
  }
}
