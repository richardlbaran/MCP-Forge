import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { Task, TaskStatus } from '../../types/workers';

interface TaskProgressBarProps {
  task: Task;
  showLabel?: boolean;
  showEta?: boolean;
  compact?: boolean;
}

// Color mapping based on task status
const statusColors: Record<TaskStatus, { bg: string; fill: string; text: string }> = {
  queued: {
    bg: 'bg-forge-border',
    fill: 'bg-forge-text-muted',
    text: 'text-forge-text-muted',
  },
  running: {
    bg: 'bg-forge-accent/20',
    fill: 'bg-forge-accent',
    text: 'text-forge-accent',
  },
  completed: {
    bg: 'bg-forge-success/20',
    fill: 'bg-forge-success',
    text: 'text-forge-success',
  },
  failed: {
    bg: 'bg-forge-error/20',
    fill: 'bg-forge-error',
    text: 'text-forge-error',
  },
  cancelled: {
    bg: 'bg-forge-border',
    fill: 'bg-forge-text-muted',
    text: 'text-forge-text-muted',
  },
};

// Calculate ETA based on progress rate
function useEta(task: Task): string | null {
  const [eta, setEta] = useState<string | null>(null);
  const progressHistory = useRef<{ time: number; progress: number }[]>([]);

  useEffect(() => {
    if (task.status !== 'running' || task.progress === undefined) {
      setEta(null);
      return;
    }

    const now = Date.now();
    progressHistory.current.push({ time: now, progress: task.progress });

    // Keep only last 10 samples for rate calculation
    if (progressHistory.current.length > 10) {
      progressHistory.current.shift();
    }

    // Need at least 2 samples
    if (progressHistory.current.length < 2) {
      setEta(null);
      return;
    }

    const history = progressHistory.current;
    const first = history[0];
    const last = history[history.length - 1];

    const progressDelta = last.progress - first.progress;
    const timeDelta = last.time - first.time;

    if (progressDelta <= 0 || timeDelta <= 0) {
      setEta(null);
      return;
    }

    // Calculate rate (progress per ms) and remaining time
    const rate = progressDelta / timeDelta;
    const remaining = 100 - last.progress;
    const etaMs = remaining / rate;

    // Format ETA
    if (etaMs < 1000) {
      setEta('<1s');
    } else if (etaMs < 60000) {
      setEta(`${Math.round(etaMs / 1000)}s`);
    } else if (etaMs < 3600000) {
      setEta(`${Math.round(etaMs / 60000)}m`);
    } else {
      setEta(`${Math.round(etaMs / 3600000)}h`);
    }
  }, [task.progress, task.status]);

  // Reset history when task changes
  useEffect(() => {
    progressHistory.current = [];
  }, [task.id]);

  return eta;
}

export function TaskProgressBar({
  task,
  showLabel = false,
  showEta = false,
  compact = false,
}: TaskProgressBarProps) {
  const colors = statusColors[task.status];
  const eta = useEta(task);

  const isIndeterminate = task.status === 'running' && task.progress === undefined;
  const progress = task.progress ?? 0;

  const barHeight = compact ? 'h-1.5' : 'h-2';
  const fontSize = compact ? 'text-2xs' : 'text-xs';

  return (
    <div className={compact ? 'space-y-0.5' : 'space-y-1'}>
      {/* Label row */}
      {(showLabel || showEta) && (
        <div className={`flex items-center justify-between ${fontSize}`}>
          {showLabel && (
            <span className="text-forge-text-secondary font-mono truncate">
              {task.tool}
            </span>
          )}
          {showEta && eta && task.status === 'running' && (
            <span className={`${colors.text} ml-2 shrink-0`}>~{eta}</span>
          )}
          {!showEta && task.progress !== undefined && task.status === 'running' && (
            <span className={`${colors.text} ml-2 shrink-0`}>
              {Math.round(progress)}%
            </span>
          )}
        </div>
      )}

      {/* Progress bar container */}
      <div
        className={`relative ${barHeight} ${colors.bg} rounded-full overflow-hidden`}
      >
        {isIndeterminate ? (
          // Indeterminate animation - sliding shimmer
          <motion.div
            className={`absolute inset-y-0 w-1/3 ${colors.fill} rounded-full`}
            animate={{
              x: ['-100%', '400%'],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ) : (
          // Determinate progress
          <motion.div
            className={`h-full ${colors.fill} rounded-full`}
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{
              type: 'spring',
              stiffness: 100,
              damping: 20,
            }}
          />
        )}

        {/* Subtle shine effect for running state */}
        {task.status === 'running' && !isIndeterminate && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        )}
      </div>

      {/* Percentage below for non-compact with label */}
      {!compact && showLabel && showEta && task.progress !== undefined && (
        <div className={`flex items-center justify-between ${fontSize}`}>
          <span className="text-forge-text-muted">
            {Math.round(progress)}% complete
          </span>
          {eta && task.status === 'running' && (
            <span className={colors.text}>~{eta} remaining</span>
          )}
        </div>
      )}
    </div>
  );
}

export default TaskProgressBar;
