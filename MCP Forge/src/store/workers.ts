/**
 * @fileoverview Zustand store for Fleet Command worker and task state.
 * 
 * This store manages the client-side state for:
 * - **Workers**: Active MCP server processes
 * - **Tasks**: Queued and running task executions
 * - **Logs**: Worker process output streams
 * 
 * State is updated via the {@link handleEvent} action, which processes
 * {@link FleetEvent} messages from the WebSocket connection.
 * 
 * @example
 * ```tsx
 * import { useWorkersStore } from '@/store/workers';
 * 
 * function WorkerList() {
 *   const workers = useWorkersStore((s) => s.workers);
 *   const activeWorkers = useWorkersStore((s) => s.getActiveWorkers());
 *   
 *   return (
 *     <div>
 *       {workers.map(w => <WorkerCard key={w.id} worker={w} />)}
 *     </div>
 *   );
 * }
 * ```
 * 
 * @module store/workers
 */

import { create } from 'zustand';

/** Worker lifecycle states */
export type WorkerStatus = 'spawning' | 'idle' | 'busy' | 'error' | 'terminated';

/** Worker instance representing a spawned MCP server process */
export interface Worker {
  /** Unique worker identifier (e.g., 'worker-abc123') */
  id: string;
  /** ID of the MCP server this worker is running */
  serverId: string;
  /** Current lifecycle state */
  status: WorkerStatus;
  /** ID of the task currently being executed (null if idle) */
  currentTaskId: string | null;
  /** ISO timestamp when the worker was spawned */
  spawnedAt: string;
  /** ISO timestamp of last activity (task start/complete/log) */
  lastActivityAt: string;
  /** Count of successfully completed tasks */
  tasksCompleted: number;
  /** Count of failed tasks */
  tasksErrored: number;
}

/** Task submitted for execution by a worker */
export interface Task {
  /** Unique task identifier */
  id: string;
  /** ID of the assigned worker (null if still queued) */
  workerId: string | null;
  /** Name of the MCP tool being called */
  tool: string;
  /** Parameters passed to the tool */
  params: Record<string, unknown>;
  /** Current task lifecycle state */
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  /** Result data on successful completion */
  result?: unknown;
  /** Error message on failure */
  error?: string;
  /** ISO timestamp when task was submitted */
  queuedAt: string;
  /** ISO timestamp when execution began */
  startedAt?: string;
  /** ISO timestamp when task finished */
  completedAt?: string;
}

/** Log entry from a worker's stdout/stderr */
export interface LogEntry {
  /** Unique log entry identifier */
  id: string;
  /** ID of the worker that emitted this log */
  workerId: string;
  /** ISO timestamp when the log was emitted */
  timestamp: string;
  /** Severity level */
  level: 'debug' | 'info' | 'warn' | 'error';
  /** Log message content */
  message: string;
  /** Optional structured metadata */
  meta?: Record<string, unknown>;
}

// Fleet events received from WebSocket
export type FleetEvent =
  | { type: 'worker:spawned'; worker: Worker }
  | { type: 'worker:status'; workerId: string; status: WorkerStatus }
  | { type: 'worker:terminated'; workerId: string }
  | { type: 'task:queued'; task: Task }
  | { type: 'task:started'; taskId: string; workerId: string }
  | { type: 'task:completed'; taskId: string; result: unknown }
  | { type: 'task:failed'; taskId: string; error: string }
  | { type: 'task:cancelled'; taskId: string }
  | { type: 'log'; entry: LogEntry }
  | { type: 'sync'; workers: Worker[]; tasks: Task[] };

interface WorkersState {
  // State
  workers: Worker[];
  tasks: Task[];
  logs: Record<string, LogEntry[]>; // workerId -> logs
  subscribedWorkers: Set<string>;

  // Actions
  handleEvent: (event: FleetEvent) => void;
  
  // Worker mutations (called by handleEvent)
  addWorker: (worker: Worker) => void;
  updateWorkerStatus: (workerId: string, status: WorkerStatus) => void;
  removeWorker: (workerId: string) => void;
  
  // Task mutations
  addTask: (task: Task) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  
  // Log mutations
  addLog: (entry: LogEntry) => void;
  clearLogs: (workerId: string) => void;
  
  // Subscription tracking
  markSubscribed: (workerId: string) => void;
  markUnsubscribed: (workerId: string) => void;
  
  // Bulk sync
  syncState: (workers: Worker[], tasks: Task[]) => void;
  
  // Selectors
  getWorker: (workerId: string) => Worker | undefined;
  getTask: (taskId: string) => Task | undefined;
  getWorkersByServer: (serverId: string) => Worker[];
  getActiveWorkers: () => Worker[];
  getQueuedTasks: () => Task[];
  getRunningTasks: () => Task[];
}

export const useWorkersStore = create<WorkersState>()((set, get) => ({
  workers: [],
  tasks: [],
  logs: {},
  subscribedWorkers: new Set(),

  handleEvent: (event: FleetEvent) => {
    const state = get();
    
    switch (event.type) {
      case 'worker:spawned':
        state.addWorker(event.worker);
        break;
      case 'worker:status':
        state.updateWorkerStatus(event.workerId, event.status);
        break;
      case 'worker:terminated':
        state.removeWorker(event.workerId);
        break;
      case 'task:queued':
        state.addTask(event.task);
        break;
      case 'task:started':
        state.updateTask(event.taskId, {
          status: 'running',
          workerId: event.workerId,
          startedAt: new Date().toISOString(),
        });
        break;
      case 'task:completed':
        state.updateTask(event.taskId, {
          status: 'completed',
          result: event.result,
          completedAt: new Date().toISOString(),
        });
        break;
      case 'task:failed':
        state.updateTask(event.taskId, {
          status: 'failed',
          error: event.error,
          completedAt: new Date().toISOString(),
        });
        break;
      case 'task:cancelled':
        state.updateTask(event.taskId, {
          status: 'cancelled',
          completedAt: new Date().toISOString(),
        });
        break;
      case 'log':
        state.addLog(event.entry);
        break;
      case 'sync':
        state.syncState(event.workers, event.tasks);
        break;
    }
  },

  addWorker: (worker) => {
    set((state) => ({
      workers: [...state.workers, worker],
      logs: { ...state.logs, [worker.id]: [] },
    }));
  },

  updateWorkerStatus: (workerId, status) => {
    set((state) => ({
      workers: state.workers.map((w) =>
        w.id === workerId
          ? { ...w, status, lastActivityAt: new Date().toISOString() }
          : w
      ),
    }));
  },

  removeWorker: (workerId) => {
    set((state) => {
      const newLogs = { ...state.logs };
      delete newLogs[workerId];
      const newSubscribed = new Set(state.subscribedWorkers);
      newSubscribed.delete(workerId);
      return {
        workers: state.workers.filter((w) => w.id !== workerId),
        logs: newLogs,
        subscribedWorkers: newSubscribed,
      };
    });
  },

  addTask: (task) => {
    set((state) => ({
      tasks: [...state.tasks, task],
    }));
  },

  updateTask: (taskId, updates) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, ...updates } : t
      ),
    }));
  },

  addLog: (entry) => {
    set((state) => {
      const workerLogs = state.logs[entry.workerId] || [];
      return {
        logs: {
          ...state.logs,
          [entry.workerId]: [...workerLogs, entry].slice(-500), // Keep last 500 logs per worker
        },
      };
    });
  },

  clearLogs: (workerId) => {
    set((state) => ({
      logs: { ...state.logs, [workerId]: [] },
    }));
  },

  markSubscribed: (workerId) => {
    set((state) => {
      const newSubscribed = new Set(state.subscribedWorkers);
      newSubscribed.add(workerId);
      return { subscribedWorkers: newSubscribed };
    });
  },

  markUnsubscribed: (workerId) => {
    set((state) => {
      const newSubscribed = new Set(state.subscribedWorkers);
      newSubscribed.delete(workerId);
      return { subscribedWorkers: newSubscribed };
    });
  },

  syncState: (workers, tasks) => {
    set((state) => {
      // Preserve existing logs for workers that still exist
      const newLogs: Record<string, LogEntry[]> = {};
      for (const worker of workers) {
        newLogs[worker.id] = state.logs[worker.id] || [];
      }
      return { workers, tasks, logs: newLogs };
    });
  },

  // Selectors
  getWorker: (workerId) => get().workers.find((w) => w.id === workerId),
  getTask: (taskId) => get().tasks.find((t) => t.id === taskId),
  getWorkersByServer: (serverId) => get().workers.filter((w) => w.serverId === serverId),
  getActiveWorkers: () => get().workers.filter((w) => w.status !== 'terminated'),
  getQueuedTasks: () => get().tasks.filter((t) => t.status === 'queued'),
  getRunningTasks: () => get().tasks.filter((t) => t.status === 'running'),
}));
