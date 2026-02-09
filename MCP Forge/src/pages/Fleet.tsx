import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Activity,
  Clock,
  Zap,
  Wifi,
  WifiOff,
  Command,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
  RefreshCw,
  X,
  Terminal,
} from 'lucide-react';
import { useWorkersStore } from '@/store/workers';
import type { Worker as StoreWorker } from '@/store/workers';
import { useFleetStore } from '@/store/fleet';
import { useFleetSocket } from '@/hooks/useFleetSocket';
import { WorkerGrid } from '@/components/fleet/WorkerGrid';
import { TaskQueue } from '@/components/fleet/TaskQueue';
import { LiveLogPanel } from '@/components/fleet/LiveLogPanel';
import { CommandPalette } from '@/components/fleet/CommandPalette';
import { FleetMinimap } from '@/components/fleet/FleetMinimap';
import { FleetSkeleton } from '@/components/fleet/FleetSkeleton';
import { FleetErrorBoundary } from '@/components/fleet/FleetErrorBoundary';
import type { Worker as MinimapWorker, Task, LogEntry } from '@/types';

// ============= Connection Error Banner =============

interface ConnectionErrorBannerProps {
  error: string | null;
  disconnectedForMs: number;
  onRetry: () => void;
  onDismiss: () => void;
}

function ConnectionErrorBanner({
  error,
  disconnectedForMs,
  onRetry,
  onDismiss,
}: ConnectionErrorBannerProps) {
  const isLongDisconnect = disconnectedForMs > 10000;
  const isReconnecting = disconnectedForMs > 0 && disconnectedForMs <= 10000;

  if (!isLongDisconnect && !error) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      role="alert"
      aria-live="polite"
      className="forge-card p-4 bg-forge-error/5 border-forge-error/20 mb-6"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="shrink-0 mt-0.5">
          {isReconnecting ? (
            <Loader2
              className="w-5 h-5 text-forge-warning animate-spin"
              aria-hidden="true"
            />
          ) : (
            <AlertCircle
              className="w-5 h-5 text-forge-error"
              aria-hidden="true"
            />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-forge-text">
            {error
              ? 'Connection Error'
              : isReconnecting
                ? 'Reconnecting...'
                : 'Connection Lost'}
          </h3>
          <p className="text-xs text-forge-text-muted mt-1">
            {error ||
              (isReconnecting
                ? 'Attempting to reconnect to the Fleet server...'
                : `Disconnected for ${Math.floor(disconnectedForMs / 1000)}s. Real-time updates paused.`)}
          </p>
        </div>

        {/* Actions */}
        <div className="shrink-0 flex items-center gap-2">
          <button
            onClick={onRetry}
            className="forge-btn-secondary text-xs"
            aria-label="Retry connection"
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
            Retry
          </button>
          <button
            onClick={onDismiss}
            className="forge-btn-ghost p-1.5 text-forge-text-muted hover:text-forge-text"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ============= Stats Card Component =============

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  subtext?: string;
  subtextColor?: string;
}

function StatCard({ label, value, icon: Icon, iconBg, iconColor, subtext, subtextColor = 'text-forge-text-muted' }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="forge-card p-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold text-forge-text">{value}</p>
          <p className="text-sm text-forge-text-secondary">{label}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>
      {subtext && (
        <div className={`mt-3 text-xs ${subtextColor}`}>
          {subtext}
        </div>
      )}
    </motion.div>
  );
}

// ============= Connection Status Component =============

interface ConnectionStatusProps {
  connected: boolean;
  reconnecting?: boolean;
}

function ConnectionStatus({ connected, reconnecting = false }: ConnectionStatusProps) {
  return (
    <div
      className="flex items-center gap-2 text-sm"
      role="status"
      aria-live="polite"
    >
      <div
        className={`w-2 h-2 rounded-full ${
          connected
            ? 'bg-forge-success animate-pulse'
            : reconnecting
              ? 'bg-forge-warning animate-pulse'
              : 'bg-forge-error'
        }`}
        aria-hidden="true"
      />
      <span
        className={
          connected
            ? 'text-forge-success'
            : reconnecting
              ? 'text-forge-warning'
              : 'text-forge-error'
        }
      >
        {connected ? 'Connected' : reconnecting ? 'Reconnecting' : 'Disconnected'}
      </span>
      {connected ? (
        <Wifi className="w-4 h-4 text-forge-success" aria-hidden="true" />
      ) : reconnecting ? (
        <Loader2 className="w-4 h-4 text-forge-warning animate-spin" aria-hidden="true" />
      ) : (
        <WifiOff className="w-4 h-4 text-forge-error" aria-hidden="true" />
      )}
      <span className="sr-only">
        {connected
          ? 'WebSocket connected'
          : reconnecting
            ? 'WebSocket reconnecting'
            : 'WebSocket disconnected'}
      </span>
    </div>
  );
}

// ============= Empty State Component =============

function EmptyState({ onOpenPalette }: { onOpenPalette: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center py-32 px-4"
      role="status"
    >
      {/* Icon — no glow, understated */}
      <div className="w-16 h-16 rounded-full bg-forge-surface border border-forge-border flex items-center justify-center mb-6">
        <Users className="w-7 h-7 text-forge-text-muted" aria-hidden="true" />
      </div>

      {/* Single descriptive sentence */}
      <p className="text-sm text-forge-text-muted text-center max-w-sm mb-8">
        Spawn a worker to begin processing tasks from your MCP servers.
      </p>

      {/* One action button */}
      <button
        onClick={onOpenPalette}
        className="forge-btn-ghost text-sm"
        aria-label="Open command palette to spawn a worker"
      >
        <Command className="w-4 h-4" aria-hidden="true" />
        Open Command Palette
      </button>
    </motion.div>
  );
}

// ============= Log Empty State =============

function LogEmptyState() {
  return (
    <div className="forge-card p-6 flex flex-col items-center justify-center text-center">
      <Terminal className="w-5 h-5 text-forge-text-muted mb-2" aria-hidden="true" />
      <p className="text-sm text-forge-text-muted">
        Select a worker to view its logs.
      </p>
    </div>
  );
}

// ============= Main Fleet Page Content =============

function FleetContent() {
  // ===== Local State =====
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [connectionErrorDismissed, setConnectionErrorDismissed] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // ===== Connection timing tracking =====
  const disconnectedAtRef = useRef<number | null>(null);
  const [disconnectedForMs, setDisconnectedForMs] = useState(0);

  // ===== Stores =====
  const workers = useWorkersStore((state) => state.workers);
  const tasks = useWorkersStore((state) => state.tasks);
  const logs = useWorkersStore((state) => state.logs);
  const clearLogs = useWorkersStore((state) => state.clearLogs);
  const servers = useFleetStore((state) => state.servers);

  // ===== WebSocket Hook =====
  const {
    connected,
    error: connectionError,
    connect,
    spawnWorker,
    killWorker,
    submitTask,
    cancelTask,
    subscribeToLogs,
    unsubscribeFromLogs,
  } = useFleetSocket();

  // ===== Track disconnection duration =====
  useEffect(() => {
    if (connected) {
      // Reset on successful connection
      disconnectedAtRef.current = null;
      setDisconnectedForMs(0);
      setConnectionErrorDismissed(false);
      
      // Mark initial load complete after first successful connection
      if (isInitialLoad) {
        // Small delay to ensure data has arrived
        const timeout = setTimeout(() => setIsInitialLoad(false), 500);
        return () => clearTimeout(timeout);
      }
    } else {
      // Start tracking disconnection time
      if (disconnectedAtRef.current === null) {
        disconnectedAtRef.current = Date.now();
      }
    }
  }, [connected, isInitialLoad]);

  // Update disconnection timer
  useEffect(() => {
    if (!connected && disconnectedAtRef.current !== null) {
      const interval = setInterval(() => {
        const elapsed = Date.now() - (disconnectedAtRef.current ?? Date.now());
        setDisconnectedForMs(elapsed);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [connected]);

  // Retry connection handler
  const handleRetryConnection = useCallback(() => {
    setConnectionErrorDismissed(false);
    connect();
  }, [connect]);

  // ===== Derived Data =====
  
  // Store workers are used directly by WorkerGrid (expects store Worker type)
  const storeWorkers: StoreWorker[] = workers;

  // Convert store workers to the MinimapWorker type for FleetMinimap
  const minimapWorkers: MinimapWorker[] = useMemo(() => {
    return workers.map((w) => {
      // Map store status to minimap status (spawning -> starting, terminated -> stopping)
      const statusMap: Record<string, MinimapWorker['status']> = {
        spawning: 'starting',
        idle: 'idle',
        busy: 'busy',
        error: 'error',
        terminated: 'stopping',
      };
      
      return {
        id: w.id,
        serverId: w.serverId,
        serverName: servers.find((s) => s.id === w.serverId)?.name || w.serverId,
        status: statusMap[w.status] || 'idle',
        startedAt: w.spawnedAt,
        lastActivityAt: w.lastActivityAt,
        currentTaskId: w.currentTaskId ?? undefined,
        metrics: {
          tasksCompleted: w.tasksCompleted,
          tasksFailed: w.tasksErrored,
          avgLatencyMs: 0,
          tokensUsed: 0,
        },
      };
    });
  }, [workers, servers]);

  // Convert store tasks to the Task type expected by components
  const typedTasks: Task[] = useMemo(() => {
    return tasks.map((t) => ({
      id: t.id,
      workerId: t.workerId ?? undefined,
      tool: t.tool,
      params: t.params,
      status: t.status as Task['status'],
      createdAt: t.queuedAt,
      startedAt: t.startedAt,
      completedAt: t.completedAt,
      result: t.result,
      error: t.error,
    }));
  }, [tasks]);

  // Get logs for selected worker
  const selectedWorkerLogs: LogEntry[] = useMemo(() => {
    if (!selectedWorkerId) return [];
    return logs[selectedWorkerId] || [];
  }, [logs, selectedWorkerId]);

  // Compute stats
  const stats = useMemo(() => {
    const activeWorkers = storeWorkers.filter((w) => w.status !== 'terminated');
    const busyWorkers = activeWorkers.filter((w) => w.status === 'busy');
    const queuedTasks = typedTasks.filter((t) => t.status === 'queued');
    const runningTasks = typedTasks.filter((t) => t.status === 'running');
    const totalTokens = minimapWorkers.reduce((sum, w) => sum + w.metrics.tokensUsed, 0);

    return {
      totalWorkers: activeWorkers.length,
      busyWorkers: busyWorkers.length,
      runningTasks: runningTasks.length,
      queuedTasks: queuedTasks.length,
      totalTokens,
    };
  }, [storeWorkers, minimapWorkers, typedTasks]);

  // Active tasks (queued + running) for TaskQueue
  const activeTasks = useMemo(() => {
    return typedTasks.filter((t) => t.status === 'queued' || t.status === 'running');
  }, [typedTasks]);

  // ===== Callbacks =====

  const handleWorkerSelect = useCallback((workerId: string) => {
    if (selectedWorkerId === workerId) {
      // Deselect
      if (selectedWorkerId) {
        unsubscribeFromLogs(selectedWorkerId);
      }
      setSelectedWorkerId(null);
    } else {
      // Unsubscribe from previous
      if (selectedWorkerId) {
        unsubscribeFromLogs(selectedWorkerId);
      }
      // Select and subscribe
      setSelectedWorkerId(workerId);
      subscribeToLogs(workerId);
    }
  }, [selectedWorkerId, subscribeToLogs, unsubscribeFromLogs]);

  const handleMinimapWorkerClick = useCallback((workerId: string) => {
    handleWorkerSelect(workerId);
    // Scroll to worker card (could add ref-based scrolling here)
    const element = document.getElementById(`worker-${workerId}`);
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [handleWorkerSelect]);

  const handleKillWorker = useCallback((workerId: string) => {
    killWorker(workerId);
    if (selectedWorkerId === workerId) {
      setSelectedWorkerId(null);
    }
  }, [killWorker, selectedWorkerId]);

  const handleKillAllWorkers = useCallback(() => {
    workers.forEach((w) => killWorker(w.id));
    setSelectedWorkerId(null);
  }, [workers, killWorker]);

  const handleCancelAllTasks = useCallback(() => {
    activeTasks.forEach((t) => cancelTask(t.id));
  }, [activeTasks, cancelTask]);

  const handleClearSelectedLogs = useCallback(() => {
    if (selectedWorkerId) {
      clearLogs(selectedWorkerId);
    }
  }, [selectedWorkerId, clearLogs]);

  // ===== Keyboard Shortcuts =====

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to open command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
      // Escape to close command palette
      if (e.key === 'Escape' && commandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen]);

  // ===== Responsive sidebar collapse on mobile =====

  useEffect(() => {
    const checkMobile = () => {
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(true);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ===== Render =====

  const hasWorkers = storeWorkers.length > 0;
  const showConnectionBanner =
    !connectionErrorDismissed &&
    (connectionError || disconnectedForMs > 10000);
  const isReconnecting = !connected && disconnectedForMs > 0 && disconnectedForMs <= 10000;

  // Auto-dismiss initial load after 3 seconds even without connection
  useEffect(() => {
    if (isInitialLoad) {
      const timeout = setTimeout(() => setIsInitialLoad(false), 3000);
      return () => clearTimeout(timeout);
    }
  }, [isInitialLoad]);

  // Show skeleton during initial load (max 3 seconds)
  if (isInitialLoad && !connected) {
    return <FleetSkeleton fullPage workerCount={3} />;
  }

  return (
    <div className="space-y-6">
      {/* ===== Connection Error Banner ===== */}
      <AnimatePresence>
        {showConnectionBanner && (
          <ConnectionErrorBanner
            error={connectionError}
            disconnectedForMs={disconnectedForMs}
            onRetry={handleRetryConnection}
            onDismiss={() => setConnectionErrorDismissed(true)}
          />
        )}
      </AnimatePresence>

      {/* ===== Header ===== */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-forge-text">Fleet Command</h1>
          <p className="text-sm text-forge-text-secondary mt-1">
            Manage worker processes and monitor task execution
          </p>
        </div>
        <div className="flex items-center gap-4">
          <ConnectionStatus connected={connected} reconnecting={isReconnecting} />
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="forge-btn-secondary text-sm hidden sm:flex"
            aria-label="Open command palette (⌘K)"
          >
            <Command className="w-4 h-4" aria-hidden="true" />
            <span>⌘K</span>
          </button>
        </div>
      </div>

      {/* ===== Main Content Area ===== */}
      {!hasWorkers ? (
        <EmptyState onOpenPalette={() => setCommandPaletteOpen(true)} />
      ) : (
        <>
          {/* ===== Stats Row + Minimap (only when workers exist) ===== */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Stats */}
            <div className="lg:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="Workers"
                value={stats.totalWorkers}
                icon={Users}
                iconBg="bg-forge-accent/10"
                iconColor="text-forge-accent"
                subtext={`${stats.busyWorkers} busy`}
                subtextColor={stats.busyWorkers > 0 ? 'text-forge-warning' : 'text-forge-text-muted'}
              />
              <StatCard
                label="Running Tasks"
                value={stats.runningTasks}
                icon={Activity}
                iconBg="bg-forge-info/10"
                iconColor="text-forge-info"
                subtext={stats.runningTasks > 0 ? 'In progress' : 'Idle'}
              />
              <StatCard
                label="Queued Tasks"
                value={stats.queuedTasks}
                icon={Clock}
                iconBg="bg-forge-warning/10"
                iconColor="text-forge-warning"
                subtext={stats.queuedTasks > 0 ? 'Waiting' : 'No backlog'}
              />
              <StatCard
                label="Tokens Used"
                value={stats.totalTokens > 1000 ? `${(stats.totalTokens / 1000).toFixed(1)}K` : stats.totalTokens}
                icon={Zap}
                iconBg="bg-forge-success/10"
                iconColor="text-forge-success"
                subtext="This session"
              />
            </div>

            {/* Minimap */}
            <div className="lg:col-span-1">
              <FleetMinimap
                workers={minimapWorkers}
                onWorkerClick={handleMinimapWorkerClick}
                selectedWorkerId={selectedWorkerId ?? undefined}
                compact
                showCard
              />
            </div>
          </div>

          {/* ===== Worker Grid + Sidebar ===== */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* WorkerGrid (Main Content) */}
            <div className={`${sidebarCollapsed ? 'lg:col-span-3' : 'lg:col-span-2'}`}>
              <WorkerGrid
                workers={storeWorkers}
                onKillWorker={handleKillWorker}
                onSubscribeLogs={handleWorkerSelect}
              />
            </div>

            {/* Sidebar (TaskQueue + LiveLogPanel) */}
            <AnimatePresence mode="wait">
              {!sidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="lg:col-span-1 space-y-4"
                >
                  {/* TaskQueue */}
                  <TaskQueue
                    tasks={activeTasks}
                    onCancelTask={cancelTask}
                  />

                  {/* LiveLogPanel */}
                  <div className="relative">
                    {selectedWorkerId ? (
                      <LiveLogPanel
                        logs={selectedWorkerLogs}
                        workerId={selectedWorkerId}
                        title="Worker Logs"
                        maxHeight="300px"
                        onClear={handleClearSelectedLogs}
                      />
                    ) : (
                      <LogEmptyState />
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sidebar Toggle */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="fixed right-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-forge-surface border border-forge-border rounded-lg shadow-lg hover:bg-forge-surface-hover transition-colors hidden lg:flex"
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? (
                <ChevronLeft className="w-4 h-4 text-forge-text-muted" />
              ) : (
                <ChevronRight className="w-4 h-4 text-forge-text-muted" />
              )}
            </button>
          </div>
        </>
      )}

      {/* ===== Command Palette ===== */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        servers={servers}
        onSpawnWorker={spawnWorker}
        onKillAllWorkers={handleKillAllWorkers}
        onSubmitTask={submitTask}
        onCancelAllTasks={handleCancelAllTasks}
        onClearLogs={handleClearSelectedLogs}
      />
    </div>
  );
}

// ============= Main Fleet Page (with Error Boundary) =============

export function Fleet() {
  return (
    <FleetErrorBoundary
      onError={() => {
        // Error tracking integration point
      }}
    >
      <FleetContent />
    </FleetErrorBoundary>
  );
}
