// ============= Worker Status & Helper Types =============

/** Worker lifecycle states */
export type WorkerStatus = 'idle' | 'busy' | 'error' | 'starting' | 'stopping';

/** Task lifecycle states */
export type TaskStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

/** Log severity levels */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// ============= Worker Types =============

/** Performance metrics for a worker */
export interface WorkerMetrics {
  /** Total tasks completed successfully */
  tasksCompleted: number;
  /** Total tasks that failed */
  tasksFailed: number;
  /** Rolling average latency in milliseconds */
  avgLatencyMs: number;
  /** Total tokens consumed by this worker */
  tokensUsed: number;
}

/** Worker instance representing an MCP server process */
export interface Worker {
  /** Unique identifier for this worker */
  id: string;
  /** ID of the MCP server this worker is running */
  serverId: string;
  /** Display name of the MCP server */
  serverName: string;
  /** Current worker state */
  status: WorkerStatus;
  /** Process ID when running */
  pid?: number;
  /** ISO timestamp when worker was started */
  startedAt: string;
  /** ISO timestamp of last activity (task start/complete/log) */
  lastActivityAt: string;
  /** ID of the currently executing task (when status is 'busy') */
  currentTaskId?: string;
  /** Cumulative performance metrics */
  metrics: WorkerMetrics;
}

// ============= Task Types =============

/** A task submitted for execution by a worker */
export interface Task {
  /** Unique identifier for this task */
  id: string;
  /** ID of the assigned worker (undefined if still queued) */
  workerId?: string;
  /** Name of the MCP tool being called */
  tool: string;
  /** Parameters passed to the tool */
  params: Record<string, unknown>;
  /** Current task state */
  status: TaskStatus;
  /** Completion percentage (0-100) if the tool reports progress */
  progress?: number;
  /** ISO timestamp when task was created/submitted */
  createdAt: string;
  /** ISO timestamp when task began execution */
  startedAt?: string;
  /** ISO timestamp when task finished (completed/failed/cancelled) */
  completedAt?: string;
  /** Result data on successful completion */
  result?: unknown;
  /** Error message on failure */
  error?: string;
}

// ============= Log Types =============

/** Log entry from a worker process */
export interface LogEntry {
  /** Unique identifier for this log entry */
  id: string;
  /** ID of the worker that emitted this log */
  workerId: string;
  /** ISO timestamp when the log was emitted */
  timestamp: string;
  /** Severity level */
  level: LogLevel;
  /** Log message content */
  message: string;
  /** Additional structured data */
  meta?: Record<string, unknown>;
}

// ============= WebSocket Event Types =============

/** Worker started event */
export interface WorkerStartedEvent {
  type: 'worker:started';
  worker: Worker;
}

/** Worker updated event (partial changes) */
export interface WorkerUpdatedEvent {
  type: 'worker:updated';
  workerId: string;
  changes: Partial<Worker>;
}

/** Worker stopped event */
export interface WorkerStoppedEvent {
  type: 'worker:stopped';
  workerId: string;
}

/** Task queued event */
export interface TaskQueuedEvent {
  type: 'task:queued';
  task: Task;
}

/** Task started event */
export interface TaskStartedEvent {
  type: 'task:started';
  taskId: string;
  workerId: string;
}

/** Task progress update event */
export interface TaskProgressEvent {
  type: 'task:progress';
  taskId: string;
  progress: number;
}

/** Task completed event */
export interface TaskCompletedEvent {
  type: 'task:completed';
  taskId: string;
  result: unknown;
}

/** Task failed event */
export interface TaskFailedEvent {
  type: 'task:failed';
  taskId: string;
  error: string;
}

/** Log entry event */
export interface LogEntryEvent {
  type: 'log:entry';
  entry: LogEntry;
}

/** Union type for all events from server → client */
export type FleetEvent =
  | WorkerStartedEvent
  | WorkerUpdatedEvent
  | WorkerStoppedEvent
  | TaskQueuedEvent
  | TaskStartedEvent
  | TaskProgressEvent
  | TaskCompletedEvent
  | TaskFailedEvent
  | LogEntryEvent;

// ============= WebSocket Command Types =============

/** Spawn a new worker for a server */
export interface SpawnCommand {
  type: 'spawn';
  serverId: string;
}

/** Kill an existing worker */
export interface KillCommand {
  type: 'kill';
  workerId: string;
}

/** Submit a task for execution */
export interface SubmitCommand {
  type: 'submit';
  tool: string;
  params: Record<string, unknown>;
}

/** Cancel a pending or running task */
export interface CancelCommand {
  type: 'cancel';
  taskId: string;
}

/** Subscribe to log stream for a worker */
export interface SubscribeLogsCommand {
  type: 'subscribe:logs';
  workerId: string;
}

/** Unsubscribe from log stream for a worker */
export interface UnsubscribeLogsCommand {
  type: 'unsubscribe:logs';
  workerId: string;
}

/** Union type for all commands from client → server */
export type FleetCommand =
  | SpawnCommand
  | KillCommand
  | SubmitCommand
  | CancelCommand
  | SubscribeLogsCommand
  | UnsubscribeLogsCommand;

// ============= Type Guards =============

/** Check if an event is a worker event */
export function isWorkerEvent(event: FleetEvent): event is WorkerStartedEvent | WorkerUpdatedEvent | WorkerStoppedEvent {
  return event.type.startsWith('worker:');
}

/** Check if an event is a task event */
export function isTaskEvent(event: FleetEvent): event is TaskQueuedEvent | TaskStartedEvent | TaskProgressEvent | TaskCompletedEvent | TaskFailedEvent {
  return event.type.startsWith('task:');
}

/** Check if an event is a log event */
export function isLogEvent(event: FleetEvent): event is LogEntryEvent {
  return event.type === 'log:entry';
}

/** Check if a worker status indicates it's available for work */
export function isWorkerAvailable(status: WorkerStatus): status is 'idle' {
  return status === 'idle';
}

/** Check if a task status indicates it's terminal (no further changes) */
export function isTaskTerminal(status: TaskStatus): status is 'completed' | 'failed' | 'cancelled' {
  return status === 'completed' || status === 'failed' || status === 'cancelled';
}

/** Check if a task status indicates it's active (queued or running) */
export function isTaskActive(status: TaskStatus): status is 'queued' | 'running' {
  return status === 'queued' || status === 'running';
}

// ============= Utility Types =============

/** Extract the event type string from FleetEvent */
export type FleetEventType = FleetEvent['type'];

/** Extract the command type string from FleetCommand */
export type FleetCommandType = FleetCommand['type'];

/** Map from event type to event payload */
export type FleetEventMap = {
  [E in FleetEvent as E['type']]: E;
};

/** Map from command type to command payload */
export type FleetCommandMap = {
  [C in FleetCommand as C['type']]: C;
};

/** Create a new worker with defaults */
export type CreateWorkerInput = Pick<Worker, 'serverId' | 'serverName'> & Partial<Worker>;

/** Create a new task with defaults */
export type CreateTaskInput = Pick<Task, 'tool' | 'params'> & Partial<Task>;

/** Worker summary for dashboard display */
export interface WorkerSummary {
  total: number;
  idle: number;
  busy: number;
  error: number;
  starting: number;
  stopping: number;
}

/** Task summary for dashboard display */
export interface TaskSummary {
  total: number;
  queued: number;
  running: number;
  completed: number;
  failed: number;
  cancelled: number;
}
