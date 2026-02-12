import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus,
  Server,
  FolderOpen,
  ArrowRight,
  Hammer,
  FlaskConical,
  Layers,
  Clock,
  Zap,
} from 'lucide-react';
import { useForgeStore, useAllServers } from '@/store';
import type { MCPServer, ActivityEntry } from '@/types';

function ServerCard({ server }: { server: MCPServer }) {
  return (
    <Link
      to={`/server/${server.name}`}
      className="forge-card-hover p-4 flex items-center gap-4"
    >
      <div
        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
          server.status === 'running'
            ? 'bg-forge-success animate-pulse'
            : server.status === 'error'
            ? 'bg-forge-error'
            : 'bg-forge-text-muted'
        }`}
      />
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-forge-text truncate">{server.name}</h3>
        <p className="text-xs text-forge-text-muted mt-0.5">
          {server.template} &middot; {server.tools.length} tool{server.tools.length !== 1 ? 's' : ''}
        </p>
      </div>
      <span
        className={`forge-badge shrink-0 ${
          server.location === 'deployed' ? 'forge-badge-promoted' : 'forge-badge-workspace'
        }`}
      >
        {server.location}
      </span>
      <ArrowRight className="w-4 h-4 text-forge-text-muted shrink-0" />
    </Link>
  );
}

function ActivityRow({ activity }: { activity: ActivityEntry }) {
  const iconMap: Record<string, React.ElementType> = {
    server_created: Plus,
    server_promoted: Zap,
    server_deleted: Server,
    tool_tested: FlaskConical,
    template_created: Layers,
  };
  const Icon = iconMap[activity.type] || Clock;

  return (
    <div className="flex items-start gap-3 py-2">
      <div className="w-6 h-6 rounded-full bg-forge-surface flex items-center justify-center mt-0.5 shrink-0">
        <Icon className="w-3 h-3 text-forge-text-muted" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-forge-text">{activity.title}</p>
        <p className="text-2xs text-forge-text-muted mt-0.5">
          {new Date(activity.timestamp).toLocaleString()}
        </p>
      </div>
    </div>
  );
}

export function Projects() {
  const allServers = useAllServers();
  const activities = useForgeStore((s) => s.activities);
  const workspaceServers = allServers.filter((s) => s.location === 'workspace');
  const deployedServers = allServers.filter((s) => s.location === 'deployed');
  const hasServers = allServers.length > 0;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-forge-text">My Servers</h1>
          <p className="text-sm text-forge-text-secondary mt-1">
            {hasServers
              ? `${allServers.length} server${allServers.length !== 1 ? 's' : ''} — click any to view code, test, or deploy`
              : 'Build MCP servers that give Claude new capabilities'}
          </p>
        </div>
        <Link to="/build" className="forge-btn-ghost text-sm">
          <Plus className="w-4 h-4" />
          Build New Server
        </Link>
      </div>

      {!hasServers ? (
        /* ===== Empty state / Onboarding ===== */
        <div className="space-y-8">
          <div className="forge-card flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-full bg-forge-surface border border-forge-border flex items-center justify-center mb-6">
              <Server className="w-7 h-7 text-forge-text-muted" />
            </div>
            <h2 className="text-lg font-medium text-forge-text mb-2">
              No servers yet
            </h2>
            <p className="text-sm text-forge-text-muted text-center max-w-md mb-8">
              MCP servers give Claude new capabilities — like accessing databases,
              calling APIs, or processing files. Pick a template and build one in
              under a minute.
            </p>
            <div className="flex items-center gap-3">
              <Link to="/build" className="forge-btn-ghost">
                <Hammer className="w-4 h-4" />
                Build Your First Server
              </Link>
              <Link to="/templates" className="forge-btn-secondary text-sm">
                Browse Templates
              </Link>
            </div>
          </div>

          {/* How it works */}
          <div>
            <h3 className="text-sm text-forge-text-muted uppercase tracking-wider mb-4">
              How it works
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="forge-card p-5">
                <div className="w-8 h-8 rounded-lg bg-forge-accent/10 flex items-center justify-center mb-3">
                  <span className="text-sm font-bold text-forge-accent">1</span>
                </div>
                <h4 className="font-medium text-forge-text mb-1">Pick a template</h4>
                <p className="text-sm text-forge-text-muted">
                  Choose from 25+ templates — databases, APIs, video processing, and more.
                </p>
              </div>
              <div className="forge-card p-5">
                <div className="w-8 h-8 rounded-lg bg-forge-accent/10 flex items-center justify-center mb-3">
                  <span className="text-sm font-bold text-forge-accent">2</span>
                </div>
                <h4 className="font-medium text-forge-text mb-1">Get the code</h4>
                <p className="text-sm text-forge-text-muted">
                  Forge generates a complete TypeScript server with tools, config, and docs.
                </p>
              </div>
              <div className="forge-card p-5">
                <div className="w-8 h-8 rounded-lg bg-forge-accent/10 flex items-center justify-center mb-3">
                  <span className="text-sm font-bold text-forge-accent">3</span>
                </div>
                <h4 className="font-medium text-forge-text mb-1">Connect to Claude</h4>
                <p className="text-sm text-forge-text-muted">
                  Copy the config into Claude Desktop and your server is live.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ===== Server list ===== */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Deployed servers */}
            {deployedServers.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-forge-text-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Server className="w-3.5 h-3.5 text-forge-promoted" />
                  Deployed ({deployedServers.length})
                </h2>
                <div className="space-y-2">
                  {deployedServers.map((server) => (
                    <motion.div
                      key={server.name}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <ServerCard server={server} />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Workspace servers */}
            {workspaceServers.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-forge-text-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
                  <FolderOpen className="w-3.5 h-3.5 text-forge-workspace" />
                  Workspace ({workspaceServers.length})
                </h2>
                <div className="space-y-2">
                  {workspaceServers.map((server) => (
                    <motion.div
                      key={server.name}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <ServerCard server={server} />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick actions */}
            <div className="pt-2">
              <h2 className="text-sm font-medium text-forge-text-secondary uppercase tracking-wider mb-3">
                Quick Start
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Link
                  to="/build/supabase-database"
                  className="forge-card-hover p-4 text-center group"
                >
                  <p className="text-sm font-medium text-forge-text">Supabase</p>
                  <p className="text-2xs text-forge-text-muted">Database server</p>
                </Link>
                <Link
                  to="/build/rest-api-wrapper"
                  className="forge-card-hover p-4 text-center group"
                >
                  <p className="text-sm font-medium text-forge-text">REST API</p>
                  <p className="text-2xs text-forge-text-muted">Connect any API</p>
                </Link>
                <Link
                  to="/build/code-generator"
                  className="forge-card-hover p-4 text-center group"
                >
                  <p className="text-sm font-medium text-forge-text">Code Gen</p>
                  <p className="text-2xs text-forge-text-muted">Components & routes</p>
                </Link>
              </div>
            </div>
          </div>

          {/* Activity sidebar */}
          <div>
            <h2 className="text-sm font-medium text-forge-text-secondary uppercase tracking-wider mb-3">
              Recent Activity
            </h2>
            <div className="forge-card p-4">
              {activities.length === 0 ? (
                <div className="flex flex-col items-center py-6">
                  <Clock className="w-5 h-5 text-forge-text-muted mb-2" />
                  <p className="text-sm text-forge-text-muted">
                    Activity will appear here as you work.
                  </p>
                </div>
              ) : (
                <div className="space-y-1 divide-y divide-forge-border">
                  {activities.slice(0, 8).map((activity) => (
                    <ActivityRow key={activity.id} activity={activity} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
