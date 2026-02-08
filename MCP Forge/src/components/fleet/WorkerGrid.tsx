import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Filter,
  SortAsc,
  Users,
  Activity,
  Clock,
  Hash,
  Server,
  ChevronDown,
} from 'lucide-react';
import type { Worker, WorkerStatus } from '@/store/workers';
import { WorkerCard } from './WorkerCard';

// ============= Types =============

export interface WorkerGridProps {
  workers: Worker[];
  onKillWorker?: (workerId: string) => void;
  onSubscribeLogs?: (workerId: string) => void;
}

type StatusFilter = 'all' | WorkerStatus;
type SortOption = 'status' | 'name' | 'tasksCompleted' | 'lastActivity';

interface FilterState {
  status: StatusFilter;
  serverId: string | null;
}

interface SortState {
  field: SortOption;
  direction: 'asc' | 'desc';
}

// ============= Constants =============

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'idle', label: 'Idle' },
  { value: 'busy', label: 'Busy' },
  { value: 'error', label: 'Error' },
];

const SORT_OPTIONS: { value: SortOption; label: string; icon: typeof SortAsc }[] = [
  { value: 'status', label: 'Status', icon: Activity },
  { value: 'name', label: 'Name', icon: Hash },
  { value: 'tasksCompleted', label: 'Tasks Completed', icon: Activity },
  { value: 'lastActivity', label: 'Last Activity', icon: Clock },
];

// Status priority for sorting (lower = higher priority)
const STATUS_PRIORITY: Record<WorkerStatus, number> = {
  error: 0,
  busy: 1,
  spawning: 2,
  idle: 3,
  terminated: 4,
};

// ============= Helper Components =============

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      <div className="w-20 h-20 rounded-full bg-forge-surface border border-forge-border flex items-center justify-center mb-4">
        <Users className="w-10 h-10 text-forge-text-muted" />
      </div>
      <h3 className="text-lg font-medium text-forge-text mb-2">No workers running</h3>
      <p className="text-sm text-forge-text-muted text-center max-w-md">
        Workers will appear here once you spawn them from an MCP server.
        Each worker processes tasks independently.
      </p>
    </motion.div>
  );
}

function FilteredEmptyState({ onReset }: { onReset: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      <div className="w-16 h-16 rounded-full bg-forge-surface border border-forge-border flex items-center justify-center mb-4">
        <Filter className="w-8 h-8 text-forge-text-muted" />
      </div>
      <h3 className="text-lg font-medium text-forge-text mb-2">No matching workers</h3>
      <p className="text-sm text-forge-text-muted text-center mb-4">
        Try adjusting your filters to see more results.
      </p>
      <button onClick={onReset} className="forge-btn-secondary text-sm">
        Reset Filters
      </button>
    </motion.div>
  );
}

function SummaryStats({ workers }: { workers: Worker[] }) {
  const counts = useMemo(() => {
    const result: Record<string, number> = { total: workers.length };
    for (const worker of workers) {
      result[worker.status] = (result[worker.status] || 0) + 1;
    }
    return result;
  }, [workers]);

  const parts: string[] = [];
  if (counts.idle) parts.push(`${counts.idle} idle`);
  if (counts.busy) parts.push(`${counts.busy} busy`);
  if (counts.error) parts.push(`${counts.error} error`);
  if (counts.spawning) parts.push(`${counts.spawning} spawning`);
  if (counts.terminated) parts.push(`${counts.terminated} terminated`);

  const summary = parts.length > 0 ? ` (${parts.join(', ')})` : '';

  return (
    <div className="flex items-center gap-2 text-sm text-forge-text-secondary">
      <Users className="w-4 h-4" />
      <span>
        {counts.total} worker{counts.total !== 1 ? 's' : ''}
        {summary}
      </span>
    </div>
  );
}

// ============= Main Component =============

export function WorkerGrid({
  workers,
  onKillWorker,
  onSubscribeLogs,
}: WorkerGridProps) {
  // Filter state
  const [filter, setFilter] = useState<FilterState>({
    status: 'all',
    serverId: null,
  });

  // Sort state
  const [sort, setSort] = useState<SortState>({
    field: 'status',
    direction: 'asc',
  });

  // Expanded card tracking (only one at a time)
  const [expandedWorkerId, setExpandedWorkerId] = useState<string | null>(null);

  // Sort dropdown open state
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  // Extract unique server IDs for filter dropdown
  const serverIds = useMemo(() => {
    const ids = new Set<string>();
    for (const worker of workers) {
      ids.add(worker.serverId);
    }
    return Array.from(ids).sort();
  }, [workers]);

  // Reset filters
  const resetFilters = useCallback(() => {
    setFilter({ status: 'all', serverId: null });
  }, []);

  // Handle card expand (collapse others when opening new one)
  const handleCardExpand = useCallback((workerId: string, shouldExpand: boolean) => {
    setExpandedWorkerId(shouldExpand ? workerId : null);
  }, []);

  // Memoized filtered and sorted workers
  const filteredAndSortedWorkers = useMemo(() => {
    // Filter
    let result = workers;

    if (filter.status !== 'all') {
      result = result.filter((w) => w.status === filter.status);
    }

    if (filter.serverId) {
      result = result.filter((w) => w.serverId === filter.serverId);
    }

    // Sort
    result = [...result].sort((a, b) => {
      let comparison = 0;

      switch (sort.field) {
        case 'status':
          comparison = STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status];
          break;
        case 'name':
          comparison = a.id.localeCompare(b.id);
          break;
        case 'tasksCompleted':
          comparison = (b.tasksCompleted || 0) - (a.tasksCompleted || 0);
          break;
        case 'lastActivity':
          comparison =
            new Date(b.lastActivityAt).getTime() -
            new Date(a.lastActivityAt).getTime();
          break;
      }

      return sort.direction === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [workers, filter, sort]);

  // Check if any filters are active
  const hasActiveFilters = filter.status !== 'all' || filter.serverId !== null;

  // Handle empty states
  if (workers.length === 0) {
    return <EmptyState />;
  }

  if (filteredAndSortedWorkers.length === 0 && hasActiveFilters) {
    return (
      <div className="space-y-4">
        {/* Filter bar still shown */}
        <FilterBar
          filter={filter}
          setFilter={setFilter}
          sort={sort}
          setSort={setSort}
          serverIds={serverIds}
          sortDropdownOpen={sortDropdownOpen}
          setSortDropdownOpen={setSortDropdownOpen}
        />
        <FilteredEmptyState onReset={resetFilters} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="flex items-center justify-between">
        <SummaryStats workers={filteredAndSortedWorkers} />
      </div>

      {/* Filter bar */}
      <FilterBar
        filter={filter}
        setFilter={setFilter}
        sort={sort}
        setSort={setSort}
        serverIds={serverIds}
        sortDropdownOpen={sortDropdownOpen}
        setSortDropdownOpen={setSortDropdownOpen}
      />

      {/* Grid */}
      <motion.div
        layout
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <AnimatePresence mode="popLayout">
          {filteredAndSortedWorkers.map((worker) => (
            <motion.div
              key={worker.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <WorkerCard
                worker={worker}
                expanded={expandedWorkerId === worker.id}
                onToggleExpand={() =>
                  handleCardExpand(
                    worker.id,
                    expandedWorkerId !== worker.id
                  )
                }
                onKill={onKillWorker ? () => onKillWorker(worker.id) : undefined}
                onSubscribeLogs={
                  onSubscribeLogs ? () => onSubscribeLogs(worker.id) : undefined
                }
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// ============= Filter Bar Component =============

interface FilterBarProps {
  filter: FilterState;
  setFilter: React.Dispatch<React.SetStateAction<FilterState>>;
  sort: SortState;
  setSort: React.Dispatch<React.SetStateAction<SortState>>;
  serverIds: string[];
  sortDropdownOpen: boolean;
  setSortDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

function FilterBar({
  filter,
  setFilter,
  sort,
  setSort,
  serverIds,
  sortDropdownOpen,
  setSortDropdownOpen,
}: FilterBarProps) {
  const currentSortOption = SORT_OPTIONS.find((o) => o.value === sort.field);

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Status filter buttons */}
      <div className="flex items-center gap-1 bg-forge-bg rounded-lg p-1">
        {STATUS_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter((f) => ({ ...f, status: value }))}
            className={`
              forge-btn-ghost px-3 py-1.5 text-xs font-medium rounded-md transition-all
              ${
                filter.status === value
                  ? 'bg-forge-surface text-forge-text shadow-sm'
                  : 'text-forge-text-secondary hover:text-forge-text'
              }
            `}
          >
            {label}
            {value !== 'all' && (
              <StatusIndicator status={value as WorkerStatus} />
            )}
          </button>
        ))}
      </div>

      {/* Server filter dropdown */}
      {serverIds.length > 1 && (
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-forge-text-muted" />
          <select
            value={filter.serverId || ''}
            onChange={(e) =>
              setFilter((f) => ({
                ...f,
                serverId: e.target.value || null,
              }))
            }
            className="forge-select text-sm py-1.5 min-w-[140px]"
          >
            <option value="">All Servers</option>
            {serverIds.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Sort dropdown */}
      <div className="relative">
        <button
          onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
          className="forge-btn-ghost px-3 py-1.5 text-xs font-medium flex items-center gap-2"
        >
          <SortAsc className="w-4 h-4" />
          <span>Sort: {currentSortOption?.label}</span>
          <ChevronDown
            className={`w-3 h-3 transition-transform ${
              sortDropdownOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        <AnimatePresence>
          {sortDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-1 z-10 min-w-[180px] bg-forge-surface border border-forge-border rounded-lg shadow-lg overflow-hidden"
            >
              {SORT_OPTIONS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => {
                    setSort((s) => ({
                      field: value,
                      direction:
                        s.field === value
                          ? s.direction === 'asc'
                            ? 'desc'
                            : 'asc'
                          : 'asc',
                    }));
                    setSortDropdownOpen(false);
                  }}
                  className={`
                    w-full px-3 py-2 text-sm text-left flex items-center gap-2
                    hover:bg-forge-surface-hover transition-colors
                    ${
                      sort.field === value
                        ? 'text-forge-accent'
                        : 'text-forge-text'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="flex-1">{label}</span>
                  {sort.field === value && (
                    <span className="text-xs text-forge-text-muted">
                      {sort.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ============= Status Indicator =============

function StatusIndicator({ status }: { status: WorkerStatus }) {
  const colors: Record<WorkerStatus, string> = {
    idle: 'bg-forge-success',
    busy: 'bg-forge-warning',
    error: 'bg-forge-error',
    spawning: 'bg-forge-info',
    terminated: 'bg-forge-text-muted',
  };

  return (
    <span
      className={`ml-1.5 w-1.5 h-1.5 rounded-full inline-block ${colors[status]} ${
        status === 'busy' || status === 'spawning' ? 'animate-pulse' : ''
      }`}
    />
  );
}

export default WorkerGrid;
