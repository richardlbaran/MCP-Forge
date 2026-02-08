import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Play, Loader2 } from 'lucide-react';
import type { Task, TaskStatus } from '../../types/workers';
import { TaskProgressBar } from './TaskProgressBar';

interface TaskQueueProps {
  tasks: Task[];
  onCancelTask?: (taskId: string) => void;
}

// Status badge styling
const statusBadgeStyles: Record<
  Extract<TaskStatus, 'queued' | 'running'>,
  { bg: string; text: string; icon: typeof Clock }
> = {
  queued: {
    bg: 'bg-forge-surface-hover',
    text: 'text-forge-text-muted',
    icon: Clock,
  },
  running: {
    bg: 'bg-forge-accent/10',
    text: 'text-forge-accent',
    icon: Loader2,
  },
};

// Format params for preview
function formatParams(params: Record<string, unknown>): string {
  const entries = Object.entries(params);
  if (entries.length === 0) return 'No parameters';

  return entries
    .slice(0, 2)
    .map(([key, value]) => {
      const strValue =
        typeof value === 'string'
          ? value.length > 20
            ? value.slice(0, 20) + '…'
            : value
          : JSON.stringify(value)?.slice(0, 20) ?? 'null';
      return `${key}: ${strValue}`;
    })
    .join(', ');
}

interface TaskRowProps {
  task: Task;
  position?: number;
  onCancel?: () => void;
}

function TaskRow({ task, position, onCancel }: TaskRowProps) {
  const isRunning = task.status === 'running';
  const style = statusBadgeStyles[task.status as 'queued' | 'running'];
  const Icon = style?.icon ?? Clock;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      role="listitem"
      aria-label={`Task ${task.tool}, status: ${task.status}`}
      className={`
        group flex items-start gap-3 p-3 rounded-lg transition-colors
        ${isRunning ? 'bg-forge-accent/5 border border-forge-accent/20' : 'hover:bg-forge-surface-hover'}
      `}
    >
      {/* Position or status indicator */}
      <div className="shrink-0 w-8 h-8 flex items-center justify-center" aria-hidden="true">
        {position !== undefined ? (
          <span className="text-forge-text-muted font-mono text-sm">
            #{position}
          </span>
        ) : (
          <div className={`p-1.5 rounded-md ${style.bg}`}>
            <Icon
              className={`w-4 h-4 ${style.text} ${isRunning ? 'animate-spin' : ''}`}
            />
          </div>
        )}
      </div>

      {/* Task info */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2">
          {/* Tool name */}
          <span className="font-mono text-sm text-forge-text font-medium truncate">
            {task.tool}
          </span>

          {/* Status badge */}
          <span
            className={`
              shrink-0 px-2 py-0.5 rounded text-2xs font-medium uppercase tracking-wide
              ${style.bg} ${style.text}
            `}
          >
            {task.status}
          </span>
        </div>

        {/* Params preview */}
        <p className="text-2xs text-forge-text-muted font-mono truncate">
          {formatParams(task.params)}
        </p>

        {/* Progress bar for running tasks */}
        {isRunning && (
          <div className="pt-1">
            <TaskProgressBar task={task} showEta compact />
          </div>
        )}
      </div>

      {/* Cancel button */}
      {onCancel && (
        <button
          onClick={onCancel}
          className="
            shrink-0 p-1.5 rounded-md opacity-0 group-hover:opacity-100
            text-forge-text-muted hover:text-forge-error hover:bg-forge-error/10
            transition-all duration-150 focus:opacity-100
          "
          aria-label={`Cancel task ${task.tool}`}
          title="Cancel task"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      )}
    </motion.div>
  );
}

export function TaskQueue({ tasks, onCancelTask }: TaskQueueProps) {
  // Split and sort tasks: running first, then queued by creation time
  const { runningTasks, queuedTasks } = useMemo(() => {
    const running = tasks
      .filter((t) => t.status === 'running')
      .sort(
        (a, b) =>
          new Date(a.startedAt ?? a.createdAt).getTime() -
          new Date(b.startedAt ?? b.createdAt).getTime()
      );

    const queued = tasks
      .filter((t) => t.status === 'queued')
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

    return { runningTasks: running, queuedTasks: queued };
  }, [tasks]);

  const isEmpty = runningTasks.length === 0 && queuedTasks.length === 0;

  return (
    <section className="forge-card overflow-hidden" aria-label="Task Queue">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-forge-border">
        <div className="flex items-center gap-2">
          <Play className="w-4 h-4 text-forge-accent" aria-hidden="true" />
          <h3 className="text-sm font-medium text-forge-text">Task Queue</h3>
        </div>
        <div className="flex items-center gap-2 text-2xs text-forge-text-muted" role="status" aria-live="polite">
          {runningTasks.length > 0 && (
            <span className="px-2 py-0.5 bg-forge-accent/10 text-forge-accent rounded">
              {runningTasks.length} running
            </span>
          )}
          {queuedTasks.length > 0 && (
            <span className="px-2 py-0.5 bg-forge-surface-hover rounded">
              {queuedTasks.length} queued
            </span>
          )}
        </div>
      </div>

      {/* Task list */}
      <div className="p-2 space-y-1 max-h-96 overflow-y-auto" role="list" aria-label="Queued and running tasks">
        <AnimatePresence mode="popLayout">
          {/* Running tasks */}
          {runningTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onCancel={onCancelTask ? () => onCancelTask(task.id) : undefined}
            />
          ))}

          {/* Queued tasks with position numbers */}
          {queuedTasks.map((task, index) => (
            <TaskRow
              key={task.id}
              task={task}
              position={index + 1}
              onCancel={onCancelTask ? () => onCancelTask(task.id) : undefined}
            />
          ))}

          {/* Empty state */}
          {isEmpty && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12 text-center"
              role="status"
            >
              <div className="w-12 h-12 rounded-full bg-forge-surface-hover flex items-center justify-center mb-3">
                <Clock className="w-6 h-6 text-forge-text-muted" aria-hidden="true" />
              </div>
              <p className="text-sm text-forge-text-muted">No tasks in queue</p>
              <p className="text-2xs text-forge-text-muted mt-1">
                Submit a task to get started
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

export default TaskQueue;
