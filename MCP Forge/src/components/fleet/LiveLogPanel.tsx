import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  memo,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trash2,
  ChevronDown,
  ChevronRight,
  ArrowDownToLine,
  Filter,
} from 'lucide-react';
import type { LogEntry, LogLevel } from '../../types/workers';

// ============= Types =============

interface LiveLogPanelProps {
  logs: LogEntry[];
  workerId?: string;
  title?: string;
  maxHeight?: string;
  autoScroll?: boolean;
  onClear?: () => void;
}

interface LevelFilterState {
  debug: boolean;
  info: boolean;
  warn: boolean;
  error: boolean;
}

// ============= Constants =============

const LEVEL_CONFIG: Record<LogLevel, { bg: string; text: string; label: string }> = {
  debug: {
    bg: 'bg-forge-text-muted/20',
    text: 'text-forge-text-muted',
    label: 'DBG',
  },
  info: {
    bg: 'bg-forge-info/20',
    text: 'text-forge-info',
    label: 'INF',
  },
  warn: {
    bg: 'bg-forge-warning/20',
    text: 'text-forge-warning',
    label: 'WRN',
  },
  error: {
    bg: 'bg-forge-error/20',
    text: 'text-forge-error',
    label: 'ERR',
  },
};

/** Maximum visible entries before windowing kicks in */
const MAX_VISIBLE_ENTRIES = 200;

// ============= Utility Functions =============

/**
 * Format ISO timestamp to HH:MM:SS.mmm
 */
function formatTimestamp(isoString: string): string {
  try {
    const date = new Date(isoString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const millis = date.getMilliseconds().toString().padStart(3, '0');
    return `${hours}:${minutes}:${seconds}.${millis}`;
  } catch {
    return '--:--:--.---';
  }
}

// ============= Subcomponents =============

interface LevelBadgeProps {
  level: LogLevel;
}

const LevelBadge = memo(function LevelBadge({ level }: LevelBadgeProps) {
  const config = LEVEL_CONFIG[level];
  return (
    <span
      className={`
        inline-flex items-center justify-center
        px-1.5 py-0.5 rounded text-2xs font-medium font-mono
        ${config.bg} ${config.text}
      `}
      role="status"
      aria-label={`Log level: ${level}`}
    >
      {config.label}
    </span>
  );
});

interface MetaViewerProps {
  meta: Record<string, unknown>;
}

const MetaViewer = memo(function MetaViewer({ meta }: MetaViewerProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-1">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-2xs text-forge-text-muted hover:text-forge-text transition-colors"
        aria-expanded={expanded}
        aria-label="Toggle metadata"
      >
        {expanded ? (
          <ChevronDown className="w-3 h-3" />
        ) : (
          <ChevronRight className="w-3 h-3" />
        )}
        <span>meta</span>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.pre
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="mt-1 p-2 bg-black/30 rounded text-2xs text-forge-text-secondary font-mono overflow-x-auto"
          >
            {JSON.stringify(meta, null, 2)}
          </motion.pre>
        )}
      </AnimatePresence>
    </div>
  );
});

interface LogEntryRowProps {
  entry: LogEntry;
}

const LogEntryRow = memo(function LogEntryRow({ entry }: LogEntryRowProps) {
  return (
    <div
      className="px-3 py-1.5 border-b border-forge-border/30 hover:bg-forge-surface/50 transition-colors"
      role="listitem"
    >
      <div className="flex items-start gap-2">
        {/* Timestamp */}
        <span className="text-2xs text-forge-text-muted font-mono shrink-0 pt-0.5">
          {formatTimestamp(entry.timestamp)}
        </span>

        {/* Level badge */}
        <div className="shrink-0 pt-0.5">
          <LevelBadge level={entry.level} />
        </div>

        {/* Message */}
        <span className="text-xs text-forge-text font-mono break-all flex-1">
          {entry.message}
        </span>
      </div>

      {/* Meta (expandable) */}
      {entry.meta && Object.keys(entry.meta).length > 0 && (
        <div className="ml-[88px]">
          <MetaViewer meta={entry.meta} />
        </div>
      )}
    </div>
  );
});

interface FilterButtonProps {
  level: LogLevel;
  active: boolean;
  count: number;
  onClick: () => void;
}

const FilterButton = memo(function FilterButton({
  level,
  active,
  count,
  onClick,
}: FilterButtonProps) {
  const config = LEVEL_CONFIG[level];
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-1 px-2 py-1 rounded text-2xs font-medium
        transition-all duration-150
        ${active
          ? `${config.bg} ${config.text} ring-1 ring-current/30`
          : 'bg-forge-surface text-forge-text-muted hover:bg-forge-surface-hover'
        }
      `}
      aria-pressed={active}
      aria-label={`${active ? 'Hide' : 'Show'} ${level} logs (${count})`}
    >
      <span>{level}</span>
      <span className="opacity-60">({count})</span>
    </button>
  );
});

// ============= Main Component =============

export const LiveLogPanel = memo(function LiveLogPanel({
  logs,
  workerId,
  title = 'Logs',
  maxHeight = '400px',
  autoScroll: initialAutoScroll = true,
  onClear,
}: LiveLogPanelProps) {
  // State
  const [filters, setFilters] = useState<LevelFilterState>({
    debug: true,
    info: true,
    warn: true,
    error: true,
  });
  const [autoScroll, setAutoScroll] = useState(initialAutoScroll);
  const [showFilters, setShowFilters] = useState(false);

  // Refs
  const scrollRef = useRef<HTMLDivElement>(null);
  const isUserScrolling = useRef(false);
  const lastLogCount = useRef(logs.length);

  // Compute level counts
  const levelCounts = useMemo(() => {
    const counts: Record<LogLevel, number> = {
      debug: 0,
      info: 0,
      warn: 0,
      error: 0,
    };
    for (const log of logs) {
      counts[log.level]++;
    }
    return counts;
  }, [logs]);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => filters[log.level]);
  }, [logs, filters]);

  // Apply windowing for performance
  const visibleLogs = useMemo(() => {
    if (filteredLogs.length <= MAX_VISIBLE_ENTRIES) {
      return filteredLogs;
    }
    // Show only the most recent entries when over limit
    return filteredLogs.slice(-MAX_VISIBLE_ENTRIES);
  }, [filteredLogs]);

  const hasHiddenLogs = filteredLogs.length > MAX_VISIBLE_ENTRIES;
  const hiddenCount = filteredLogs.length - MAX_VISIBLE_ENTRIES;

  // Toggle filter
  const toggleFilter = useCallback((level: LogLevel) => {
    setFilters((prev) => ({
      ...prev,
      [level]: !prev[level],
    }));
  }, []);

  // Handle scroll - detect if user is scrolling manually
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    
    // If user scrolls up, disable auto-scroll
    if (!isAtBottom && !isUserScrolling.current) {
      isUserScrolling.current = true;
      setAutoScroll(false);
    }
    // If user scrolls to bottom, re-enable auto-scroll
    if (isAtBottom && isUserScrolling.current) {
      isUserScrolling.current = false;
      setAutoScroll(true);
    }
  }, []);

  // Auto-scroll effect
  useEffect(() => {
    if (autoScroll && scrollRef.current && logs.length > lastLogCount.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    lastLogCount.current = logs.length;
  }, [logs.length, autoScroll]);

  // Scroll to bottom handler
  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      setAutoScroll(true);
      isUserScrolling.current = false;
    }
  }, []);

  return (
    <div
      className="flex flex-col bg-black/40 rounded-lg border border-forge-border overflow-hidden"
      role="log"
      aria-label={title}
      aria-live="polite"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-forge-surface border-b border-forge-border">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-forge-text">{title}</h3>
          {workerId && (
            <span className="text-2xs text-forge-text-muted font-mono bg-forge-bg px-1.5 py-0.5 rounded">
              {workerId}
            </span>
          )}
          <span className="text-2xs text-forge-text-muted">
            {filteredLogs.length} entries
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`
              p-1.5 rounded transition-colors
              ${showFilters
                ? 'bg-forge-accent/20 text-forge-accent'
                : 'text-forge-text-muted hover:text-forge-text hover:bg-forge-surface-hover'
              }
            `}
            aria-label="Toggle filters"
            aria-expanded={showFilters}
          >
            <Filter className="w-3.5 h-3.5" />
          </button>

          {/* Auto-scroll toggle */}
          <button
            onClick={() => {
              setAutoScroll(!autoScroll);
              if (!autoScroll) scrollToBottom();
            }}
            className={`
              p-1.5 rounded transition-colors
              ${autoScroll
                ? 'bg-forge-accent/20 text-forge-accent'
                : 'text-forge-text-muted hover:text-forge-text hover:bg-forge-surface-hover'
              }
            `}
            aria-label={`Auto-scroll: ${autoScroll ? 'on' : 'off'}`}
            aria-pressed={autoScroll}
          >
            <ArrowDownToLine className="w-3.5 h-3.5" />
          </button>

          {/* Clear button */}
          {onClear && (
            <button
              onClick={onClear}
              className="p-1.5 rounded text-forge-text-muted hover:text-forge-error hover:bg-forge-error/10 transition-colors"
              aria-label="Clear logs"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 px-3 py-2 bg-forge-bg-elevated border-b border-forge-border">
              {(Object.keys(filters) as LogLevel[]).map((level) => (
                <FilterButton
                  key={level}
                  level={level}
                  active={filters[level]}
                  count={levelCounts[level]}
                  onClick={() => toggleFilter(level)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Log entries */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-forge-border hover:scrollbar-thumb-forge-border-active"
        style={{ maxHeight }}
        role="list"
        aria-label="Log entries"
      >
        {/* Hidden logs indicator */}
        {hasHiddenLogs && (
          <div className="px-3 py-2 text-center text-2xs text-forge-text-muted bg-forge-warning/10 border-b border-forge-border/30">
            {hiddenCount.toLocaleString()} older entries hidden for performance
          </div>
        )}

        {/* Empty state */}
        {visibleLogs.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-forge-text-muted">
            <div className="text-center">
              <p className="text-sm">
                {logs.length === 0
                  ? 'Waiting for logs...'
                  : 'No logs match filters'}
              </p>
              {logs.length > 0 && (
                <button
                  onClick={() =>
                    setFilters({ debug: true, info: true, warn: true, error: true })
                  }
                  className="mt-2 text-xs text-forge-accent hover:underline"
                >
                  Reset filters
                </button>
              )}
            </div>
          </div>
        ) : (
          visibleLogs.map((entry) => (
            <LogEntryRow key={entry.id} entry={entry} />
          ))
        )}
      </div>

      {/* Scroll to bottom indicator */}
      <AnimatePresence>
        {!autoScroll && visibleLogs.length > 10 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-16 right-4"
          >
            <button
              onClick={scrollToBottom}
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-forge-accent text-forge-text text-xs shadow-forge hover:bg-forge-accent-hover transition-colors"
            >
              <ArrowDownToLine className="w-3 h-3" />
              <span>Latest</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default LiveLogPanel;
