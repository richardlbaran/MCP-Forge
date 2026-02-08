import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Worker, WorkerStatus } from '@/types';

// ============= Types =============

interface FleetMinimapProps {
  workers: Worker[];
  onWorkerClick?: (workerId: string) => void;
  compact?: boolean;
  /** Optional: ID of currently selected worker for highlight */
  selectedWorkerId?: string;
  /** Show background card wrapper */
  showCard?: boolean;
}

interface TooltipState {
  workerId: string;
  x: number;
  y: number;
}

// ============= Status Color Mapping =============

const STATUS_COLORS: Record<WorkerStatus, { bg: string; glow: string; label: string }> = {
  idle: {
    bg: 'bg-forge-success',
    glow: 'shadow-[0_0_8px_rgba(16,185,129,0.5)]',
    label: 'Idle',
  },
  busy: {
    bg: 'bg-forge-accent',
    glow: 'shadow-[0_0_8px_rgba(249,115,22,0.5)]',
    label: 'Busy',
  },
  error: {
    bg: 'bg-forge-error',
    glow: 'shadow-[0_0_8px_rgba(239,68,68,0.5)]',
    label: 'Error',
  },
  starting: {
    bg: 'bg-forge-warning',
    glow: 'shadow-[0_0_8px_rgba(245,158,11,0.5)]',
    label: 'Starting',
  },
  stopping: {
    bg: 'bg-forge-warning',
    glow: 'shadow-[0_0_8px_rgba(245,158,11,0.5)]',
    label: 'Stopping',
  },
};

// ============= Legend Item =============

function LegendItem({ status, label }: { status: WorkerStatus; label: string }) {
  const colors = STATUS_COLORS[status];
  
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-full ${colors.bg}`} />
      <span className="text-2xs text-forge-text-muted">{label}</span>
    </div>
  );
}

// ============= Worker Dot =============

interface WorkerDotProps {
  worker: Worker;
  compact: boolean;
  isSelected: boolean;
  onClick?: () => void;
  onHover: (state: TooltipState | null) => void;
}

function WorkerDot({ worker, compact, isSelected, onClick, onHover }: WorkerDotProps) {
  const colors = STATUS_COLORS[worker.status];
  const dotSize = compact ? 'w-2 h-2' : 'w-3 h-3';
  const isBusy = worker.status === 'busy';

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    onHover({
      workerId: worker.id,
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
  };

  const handleMouseLeave = () => {
    onHover(null);
  };

  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-label={`Worker ${worker.serverName}: ${worker.status}${worker.currentTaskId ? `, running task ${worker.currentTaskId}` : ''}`}
      className={`
        ${dotSize} rounded-full transition-all duration-200
        ${colors.bg}
        ${isSelected ? `ring-2 ring-offset-1 ring-offset-forge-bg ring-forge-text ${colors.glow}` : ''}
        hover:${colors.glow}
        focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-forge-bg focus:ring-forge-text
        shadow-sm hover:shadow-md
        cursor-pointer
      `}
    >
      {/* Pulse animation for busy workers */}
      {isBusy && (
        <motion.div
          className={`absolute inset-0 rounded-full ${colors.bg}`}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.6, 0, 0.6],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}
    </motion.button>
  );
}

// ============= Tooltip =============

interface TooltipProps {
  worker: Worker;
  position: { x: number; y: number };
}

function Tooltip({ worker, position }: TooltipProps) {
  const colors = STATUS_COLORS[worker.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.15 }}
      className="fixed z-50 pointer-events-none"
      style={{
        left: position.x,
        top: position.y - 8,
        transform: 'translate(-50%, -100%)',
      }}
    >
      <div className="bg-forge-surface border border-forge-border rounded-lg shadow-forge px-3 py-2 min-w-[140px]">
        <div className="flex items-center gap-2 mb-1">
          <div className={`w-2 h-2 rounded-full ${colors.bg}`} />
          <span className="text-sm font-medium text-forge-text truncate max-w-[120px]">
            {worker.serverName}
          </span>
        </div>
        <div className="space-y-0.5">
          <p className="text-2xs text-forge-text-muted">
            Status: <span className="text-forge-text-secondary">{colors.label}</span>
          </p>
          <p className="text-2xs text-forge-text-muted">
            Server: <span className="text-forge-text-secondary font-mono">{worker.serverId}</span>
          </p>
          {worker.currentTaskId && (
            <p className="text-2xs text-forge-text-muted">
              Task: <span className="text-forge-accent font-mono">{worker.currentTaskId.slice(0, 8)}...</span>
            </p>
          )}
        </div>
        {/* Tooltip arrow */}
        <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 bg-forge-surface border-r border-b border-forge-border rotate-45" />
      </div>
    </motion.div>
  );
}

// ============= Main Component =============

export function FleetMinimap({
  workers,
  onWorkerClick,
  compact = false,
  selectedWorkerId,
  showCard = true,
}: FleetMinimapProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  // Find the hovered worker for tooltip display
  const hoveredWorker = useMemo(
    () => (tooltip ? workers.find((w) => w.id === tooltip.workerId) : null),
    [tooltip, workers]
  );

  // Calculate grid layout based on worker count
  const gridCols = useMemo(() => {
    const count = workers.length;
    if (count <= 4) return 'grid-cols-2';
    if (count <= 9) return 'grid-cols-3';
    if (count <= 16) return 'grid-cols-4';
    if (count <= 25) return 'grid-cols-5';
    if (count <= 36) return 'grid-cols-6';
    return 'grid-cols-7';
  }, [workers.length]);

  // Status counts for compact legend
  const statusCounts = useMemo(() => {
    return workers.reduce(
      (acc, w) => {
        acc[w.status] = (acc[w.status] || 0) + 1;
        return acc;
      },
      {} as Record<WorkerStatus, number>
    );
  }, [workers]);

  const containerClasses = showCard
    ? 'bg-forge-surface border border-forge-border rounded-lg p-3'
    : '';

  const gapSize = compact ? 'gap-1' : 'gap-1.5';

  // Empty state
  if (workers.length === 0) {
    return (
      <div className={containerClasses}>
        <div className="flex items-center justify-center py-4 text-forge-text-muted text-sm">
          No workers active
        </div>
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      {/* Header - only in non-compact mode */}
      {!compact && (
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-medium text-forge-text-secondary">
            Fleet Overview
          </h4>
          <span className="text-2xs text-forge-text-muted">
            {workers.length} worker{workers.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Worker Grid */}
      <div className={`grid ${gridCols} ${gapSize} justify-items-center`}>
        <AnimatePresence mode="popLayout">
          {workers.map((worker) => (
            <WorkerDot
              key={worker.id}
              worker={worker}
              compact={compact}
              isSelected={selectedWorkerId === worker.id}
              onClick={onWorkerClick ? () => onWorkerClick(worker.id) : undefined}
              onHover={setTooltip}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Legend - only in non-compact mode */}
      {!compact && (
        <div className="flex flex-wrap items-center gap-3 mt-3 pt-2 border-t border-forge-border">
          {statusCounts.idle !== undefined && statusCounts.idle > 0 && (
            <LegendItem status="idle" label={`Idle (${statusCounts.idle})`} />
          )}
          {statusCounts.busy !== undefined && statusCounts.busy > 0 && (
            <LegendItem status="busy" label={`Busy (${statusCounts.busy})`} />
          )}
          {statusCounts.error !== undefined && statusCounts.error > 0 && (
            <LegendItem status="error" label={`Error (${statusCounts.error})`} />
          )}
          {(statusCounts.starting !== undefined && statusCounts.starting > 0) ||
          (statusCounts.stopping !== undefined && statusCounts.stopping > 0) ? (
            <LegendItem
              status="starting"
              label={`Pending (${(statusCounts.starting || 0) + (statusCounts.stopping || 0)})`}
            />
          ) : null}
        </div>
      )}

      {/* Tooltip portal */}
      <AnimatePresence>
        {hoveredWorker && tooltip && (
          <Tooltip
            key={tooltip.workerId}
            worker={hoveredWorker}
            position={{ x: tooltip.x, y: tooltip.y }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default FleetMinimap;
