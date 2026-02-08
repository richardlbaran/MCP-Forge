import { motion } from 'framer-motion';
import {
  Users,
  Activity,
  Clock,
  Zap,
} from 'lucide-react';

// ============= Skeleton Primitives =============

interface SkeletonProps {
  className?: string;
  delay?: number;
}

function Skeleton({ className = '', delay = 0 }: SkeletonProps) {
  return (
    <motion.div
      initial={{ opacity: 0.5 }}
      animate={{ opacity: [0.5, 0.8, 0.5] }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        delay,
        ease: 'easeInOut',
      }}
      className={`bg-forge-surface-hover rounded ${className}`}
      aria-hidden="true"
    />
  );
}

// ============= Stat Card Skeleton =============

interface StatCardSkeletonProps {
  icon: React.ComponentType<{ className?: string }>;
  delay?: number;
}

function StatCardSkeleton({ icon: Icon, delay = 0 }: StatCardSkeletonProps) {
  return (
    <div className="forge-card p-4" aria-hidden="true">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-12" delay={delay} />
          <Skeleton className="h-4 w-20" delay={delay + 0.1} />
        </div>
        <div className="w-10 h-10 rounded-lg bg-forge-surface-hover flex items-center justify-center">
          <Icon className="w-5 h-5 text-forge-text-muted" />
        </div>
      </div>
      <div className="mt-3">
        <Skeleton className="h-3 w-16" delay={delay + 0.2} />
      </div>
    </div>
  );
}

// ============= Worker Card Skeleton =============

function WorkerCardSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div className="forge-card p-4" aria-hidden="true">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-32" delay={delay} />
            <Skeleton className="h-5 w-16 rounded-full" delay={delay + 0.05} />
          </div>
          <Skeleton className="h-3 w-20" delay={delay + 0.1} />
        </div>
        <Skeleton className="h-8 w-8 rounded" delay={delay + 0.15} />
      </div>

      {/* Metrics row */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-forge-border">
        <Skeleton className="h-4 w-12" delay={delay + 0.2} />
        <Skeleton className="h-4 w-12" delay={delay + 0.25} />
        <Skeleton className="h-4 w-16" delay={delay + 0.3} />
        <Skeleton className="h-4 w-14" delay={delay + 0.35} />
      </div>
    </div>
  );
}

// ============= Task Queue Skeleton =============

function TaskQueueSkeleton() {
  return (
    <div className="forge-card overflow-hidden" aria-hidden="true">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-forge-border">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-5 w-20" />
      </div>

      {/* Task rows */}
      <div className="p-2 space-y-2">
        {[0, 1].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <Skeleton className="h-8 w-8" delay={i * 0.1} />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-28" delay={i * 0.1 + 0.05} />
              <Skeleton className="h-3 w-full" delay={i * 0.1 + 0.1} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============= Log Panel Skeleton =============

function LogPanelSkeleton() {
  return (
    <div className="forge-card p-6" aria-hidden="true">
      <Skeleton className="h-4 w-40 mx-auto" />
    </div>
  );
}

// ============= Minimap Skeleton =============

function MinimapSkeleton() {
  return (
    <div className="forge-card p-3" aria-hidden="true">
      <Skeleton className="h-4 w-20 mb-3" />
      <div className="flex flex-wrap gap-1.5">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-6 w-6 rounded" delay={i * 0.1} />
        ))}
      </div>
    </div>
  );
}

// ============= Worker Grid Skeleton =============

export function WorkerGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4" role="status" aria-label="Loading workers...">
      {/* Summary stats skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Filter bar skeleton */}
      <div className="flex items-center gap-3">
        <div className="flex gap-1 bg-forge-bg rounded-lg p-1">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-7 w-14 rounded-md" delay={i * 0.05} />
          ))}
        </div>
        <div className="flex-1" />
        <Skeleton className="h-7 w-28" delay={0.2} />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <WorkerCardSkeleton key={i} delay={i * 0.1} />
        ))}
      </div>

      <span className="sr-only">Loading worker grid...</span>
    </div>
  );
}

// ============= Full Page Skeleton =============

export interface FleetSkeletonProps {
  /** Whether to show full page or just the grid */
  fullPage?: boolean;
  /** Number of worker card skeletons to show */
  workerCount?: number;
}

export function FleetSkeleton({ fullPage = true, workerCount = 3 }: FleetSkeletonProps) {
  if (!fullPage) {
    return <WorkerGridSkeleton count={workerCount} />;
  }

  return (
    <div
      className="space-y-6 animate-fade-in"
      role="status"
      aria-label="Loading Fleet Command..."
    >
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" delay={0.1} />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-6 w-28" delay={0.15} />
          <Skeleton className="h-9 w-16 hidden sm:block" delay={0.2} />
        </div>
      </div>

      {/* Stats row + Minimap */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Stats */}
        <div className="lg:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCardSkeleton icon={Users} delay={0} />
          <StatCardSkeleton icon={Activity} delay={0.1} />
          <StatCardSkeleton icon={Clock} delay={0.2} />
          <StatCardSkeleton icon={Zap} delay={0.3} />
        </div>

        {/* Minimap */}
        <div className="lg:col-span-1">
          <MinimapSkeleton />
        </div>
      </div>

      {/* Main content area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Worker Grid */}
        <div className="lg:col-span-2">
          <WorkerGridSkeleton count={workerCount} />
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <TaskQueueSkeleton />
          <LogPanelSkeleton />
        </div>
      </div>

      <span className="sr-only">Loading Fleet Command interface...</span>
    </div>
  );
}

export default FleetSkeleton;
