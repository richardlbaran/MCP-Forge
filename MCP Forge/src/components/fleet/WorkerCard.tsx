import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Cpu,
  Clock,
  Zap,
  ChevronDown,
  X,
  Terminal,
  AlertCircle,
  CheckCircle,
  Loader2,
  Server,
} from 'lucide-react';
import type { Worker, Task, WorkerStatus } from '@/store/workers';

// ============= Types =============

/** Extended task with optional progress for UI display */
export interface TaskWithProgress extends Task {
  /** Completion percentage (0-100) if the tool reports progress */
  progress?: number;
}

export interface WorkerCardProps {
  /** The worker to display */
  worker: Worker;
  /** Server name (resolved from serverId) */
  serverName?: string;
  /** Current task details (when worker is busy) */
  currentTask?: TaskWithProgress;
  /** Callback when kill button is clicked */
  onKill?: (workerId: string) => void;
  /** Callback when subscribe to logs is toggled */
  onSubscribeLogs?: (workerId: string) => void;
  /** Whether the card is expanded */
  expanded?: boolean;
  /** Callback when expand/collapse is toggled */
  onToggleExpand?: () => void;
  /** Whether currently subscribed to logs */
  isSubscribedToLogs?: boolean;
  /** Children to render in expanded area (e.g., log panel) */
  children?: React.ReactNode;
}

// ============= Status Configuration =============

interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
  icon: typeof CheckCircle;
  animate?: boolean;
}

const STATUS_CONFIG: Record<WorkerStatus, StatusConfig> = {
  idle: {
    label: 'Idle',
    color: 'text-forge-success',
    bgColor: 'bg-forge-success/10',
    icon: CheckCircle,
  },
  busy: {
    label: 'Busy',
    color: 'text-forge-warning',
    bgColor: 'bg-forge-warning/10',
    icon: Activity,
    animate: true,
  },
  error: {
    label: 'Error',
    color: 'text-forge-error',
    bgColor: 'bg-forge-error/10',
    icon: AlertCircle,
  },
  spawning: {
    label: 'Starting',
    color: 'text-forge-warning',
    bgColor: 'bg-forge-warning/10',
    icon: Loader2,
    animate: true,
  },
  terminated: {
    label: 'Stopped',
    color: 'text-forge-text-muted',
    bgColor: 'bg-forge-surface',
    icon: Server,
  },
};

// ============= Helper Components =============

/** Status badge with color coding and animation */
function StatusBadge({ status }: { status: WorkerStatus }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <motion.span
      key={status}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`forge-badge ${config.bgColor} ${config.color}`}
      role="status"
      aria-label={`Worker status: ${config.label}`}
    >
      <Icon
        className={`w-3 h-3 ${config.animate ? 'animate-spin' : ''}`}
        aria-hidden="true"
      />
      {config.label}
    </motion.span>
  );
}

/** Progress bar for task execution */
function ProgressBar({ progress }: { progress: number }) {
  return (
    <div
      className="h-1.5 bg-forge-bg rounded-full overflow-hidden"
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Task progress: ${progress}%`}
    >
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="h-full bg-forge-accent"
      />
    </div>
  );
}

/** Metric display item */
function MetricItem({
  icon: Icon,
  label,
  value,
  color = 'text-forge-text-secondary',
}: {
  icon: typeof Activity;
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-1.5" title={label}>
      <Icon className={`w-3.5 h-3.5 ${color}`} aria-hidden="true" />
      <span className="text-xs text-forge-text-muted">{value}</span>
    </div>
  );
}

/** Truncate worker ID for display */
function truncateId(id: string, length = 8): string {
  if (id.length <= length) return id;
  return `${id.slice(0, length)}…`;
}

/** Format time since activity */
function formatTimeSince(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// ============= Main Component =============

export function WorkerCard({
  worker,
  serverName,
  currentTask,
  onKill,
  onSubscribeLogs,
  expanded = false,
  onToggleExpand,
  isSubscribedToLogs = false,
  children,
}: WorkerCardProps) {
  const handleKill = (e: React.MouseEvent) => {
    e.stopPropagation();
    onKill?.(worker.id);
  };

  const handleToggleLogs = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSubscribeLogs?.(worker.id);
  };

  const displayName = serverName || worker.serverId;
  const canKill = worker.status !== 'terminated' && worker.status !== 'spawning';

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`
        forge-card-hover overflow-hidden
        ${worker.status === 'error' ? 'border-forge-error/30' : ''}
        ${worker.status === 'busy' ? 'border-forge-warning/20' : ''}
      `}
      aria-labelledby={`worker-${worker.id}-title`}
    >
      {/* Header */}
      <div
        className="p-4 cursor-pointer"
        onClick={onToggleExpand}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        aria-controls={`worker-${worker.id}-details`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggleExpand?.();
          }
        }}
      >
        {/* Top row: Server name, ID, Status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3
                id={`worker-${worker.id}-title`}
                className="font-medium text-forge-text truncate"
              >
                {displayName}
              </h3>
              <StatusBadge status={worker.status} />
            </div>
            <p
              className="text-xs text-forge-text-muted font-mono mt-0.5"
              title={worker.id}
            >
              {truncateId(worker.id)}
            </p>
          </div>

          {/* Expand chevron */}
          <motion.button
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="forge-btn-icon shrink-0"
            aria-label={expanded ? 'Collapse details' : 'Expand details'}
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand?.();
            }}
          >
            <ChevronDown className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Current task (when busy) */}
        <AnimatePresence mode="wait">
          {worker.status === 'busy' && currentTask && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-3"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Cpu className="w-3.5 h-3.5 text-forge-accent" aria-hidden="true" />
                <span className="text-sm text-forge-text truncate">
                  {currentTask.tool}
                </span>
                {currentTask.progress !== undefined && (
                  <span className="text-xs text-forge-text-muted ml-auto">
                    {currentTask.progress}%
                  </span>
                )}
              </div>
              {currentTask.progress !== undefined && (
                <ProgressBar progress={currentTask.progress} />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Metrics row */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-forge-border">
          <MetricItem
            icon={CheckCircle}
            label="Tasks completed"
            value={worker.tasksCompleted}
            color="text-forge-success"
          />
          <MetricItem
            icon={AlertCircle}
            label="Tasks failed"
            value={worker.tasksErrored}
            color={worker.tasksErrored > 0 ? 'text-forge-error' : 'text-forge-text-muted'}
          />
          <MetricItem
            icon={Clock}
            label="Last activity"
            value={formatTimeSince(worker.lastActivityAt)}
          />
          <MetricItem
            icon={Zap}
            label="Uptime"
            value={formatTimeSince(worker.spawnedAt)}
            color="text-forge-accent"
          />
        </div>
      </div>

      {/* Expanded area: Actions + Log panel placeholder */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            id={`worker-${worker.id}-details`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Actions bar */}
            <div className="px-4 py-3 bg-forge-bg/50 border-t border-forge-border flex items-center gap-2">
              {/* Subscribe to logs toggle */}
              <button
                onClick={handleToggleLogs}
                className={`
                  forge-btn text-xs
                  ${isSubscribedToLogs
                    ? 'bg-forge-accent/10 text-forge-accent border border-forge-accent/20'
                    : 'forge-btn-ghost'
                  }
                `}
                aria-pressed={isSubscribedToLogs}
                aria-label={isSubscribedToLogs ? 'Unsubscribe from logs' : 'Subscribe to logs'}
              >
                <Terminal className="w-3.5 h-3.5" />
                {isSubscribedToLogs ? 'Watching' : 'Watch Logs'}
              </button>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Kill worker button */}
              {canKill && (
                <button
                  onClick={handleKill}
                  className="forge-btn-danger text-xs"
                  aria-label={`Kill worker ${truncateId(worker.id)}`}
                >
                  <X className="w-3.5 h-3.5" />
                  Kill
                </button>
              )}
            </div>

            {/* Log panel area (rendered by parent) */}
            {children && (
              <div className="border-t border-forge-border">
                {children}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

export default WorkerCard;
