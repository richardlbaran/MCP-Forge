import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus,
  Hammer,
  FlaskConical,
  ArrowRight,
  Clock,
  Server,
  FolderOpen,
  Layers,
  Zap,
} from 'lucide-react';
import { useForgeStore, useAllServers, useAllTemplates } from '@/store';
import type { MCPServer, ActivityEntry } from '@/types';

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="forge-card p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-semibold text-forge-text">{value}</p>
          <p className="text-sm text-forge-text-secondary">{label}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

function ServerRow({ server }: { server: MCPServer }) {
  return (
    <Link
      to={`/server/${server.name}`}
      className="forge-card-hover p-4 flex items-center gap-4"
    >
      <div
        className={`w-2 h-2 rounded-full ${
          server.status === 'running'
            ? 'bg-forge-success animate-pulse'
            : server.status === 'error'
            ? 'bg-forge-error'
            : 'bg-forge-text-muted'
        }`}
      />
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-forge-text truncate">{server.name}</h3>
        <p className="text-xs text-forge-text-muted">
          {server.template} • {server.tools.length} tools
        </p>
      </div>
      <span
        className={`forge-badge ${
          server.location === 'deployed' ? 'forge-badge-promoted' : 'forge-badge-workspace'
        }`}
      >
        {server.location}
      </span>
      <ArrowRight className="w-4 h-4 text-forge-text-muted" />
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
      <div className="w-6 h-6 rounded-full bg-forge-surface flex items-center justify-center mt-0.5">
        <Icon className="w-3 h-3 text-forge-text-muted" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-forge-text">{activity.title}</p>
        {activity.details && (
          <p className="text-xs text-forge-text-muted">{activity.details}</p>
        )}
        <p className="text-2xs text-forge-text-muted mt-1">
          {new Date(activity.timestamp).toLocaleString()}
        </p>
      </div>
    </div>
  );
}

export function Dashboard() {
  const workspaceServers = useForgeStore((s) => s.workspaceServers);
  const deployedServers = useForgeStore((s) => s.deployedServers);
  const activities = useForgeStore((s) => s.activities);
  const memory = useForgeStore((s) => s.memory);
  const allServers = useAllServers();
  const allTemplates = useAllTemplates();

  const recentServers = allServers
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-forge-text">Dashboard</h1>
          <p className="text-sm text-forge-text-secondary mt-1">
            {memory.servers_created > 0
              ? `${memory.servers_created} servers created`
              : 'Build MCP servers that give Claude new capabilities'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/test" className="forge-btn-secondary">
            <FlaskConical className="w-4 h-4" />
            Test Harness
          </Link>
          <Link to="/build" className="forge-btn-ghost text-sm">
            <Hammer className="w-4 h-4" />
            Build Server
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Workspace"
          value={workspaceServers.length}
          icon={FolderOpen}
          color="bg-forge-workspace/10 text-forge-workspace"
        />
        <StatCard
          label="Deployed"
          value={deployedServers.length}
          icon={Server}
          color="bg-forge-promoted/10 text-forge-promoted"
        />
        <StatCard
          label="Templates"
          value={allTemplates.length}
          icon={Layers}
          color="bg-forge-info/10 text-forge-info"
        />
        <StatCard
          label="Tools Built"
          value={allServers.reduce((sum, s) => sum + s.tools.length, 0)}
          icon={Zap}
          color="bg-forge-accent/10 text-forge-accent"
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Recent Servers */}
        <div className="col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-forge-text">Recent Servers</h2>
            <Link to="/build" className="text-sm text-forge-accent hover:underline">
              View all
            </Link>
          </div>

          {recentServers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-14 h-14 rounded-full bg-forge-surface border border-forge-border flex items-center justify-center mb-5">
                <Server className="w-6 h-6 text-forge-text-muted" />
              </div>
              <p className="text-sm text-forge-text-muted mb-6">
                Build your first MCP server to give Claude new capabilities.
              </p>
              <Link to="/build" className="forge-btn-ghost text-sm">
                <Hammer className="w-4 h-4" />
                Build Server
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentServers.map((server) => (
                <motion.div
                  key={server.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <ServerRow server={server} />
                </motion.div>
              ))}
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-4 gap-3 pt-2">
            <Link
              to="/build/supabase"
              className="forge-card-hover p-4 text-center group"
            >
              <div className="w-10 h-10 rounded-lg bg-forge-surface flex items-center justify-center mx-auto mb-2 group-hover:bg-forge-surface-hover transition-colors">
                <span className="text-lg">⚡</span>
              </div>
              <p className="text-sm font-medium text-forge-text">Supabase</p>
              <p className="text-2xs text-forge-text-muted">Database</p>
            </Link>
            <Link
              to="/build/github"
              className="forge-card-hover p-4 text-center group"
            >
              <div className="w-10 h-10 rounded-lg bg-forge-surface flex items-center justify-center mx-auto mb-2 group-hover:bg-forge-surface-hover transition-colors">
                <span className="text-lg">🐙</span>
              </div>
              <p className="text-sm font-medium text-forge-text">GitHub</p>
              <p className="text-2xs text-forge-text-muted">Issues & PRs</p>
            </Link>
            <Link
              to="/build/slack"
              className="forge-card-hover p-4 text-center group"
            >
              <div className="w-10 h-10 rounded-lg bg-forge-surface flex items-center justify-center mx-auto mb-2 group-hover:bg-forge-surface-hover transition-colors">
                <span className="text-lg">💬</span>
              </div>
              <p className="text-sm font-medium text-forge-text">Slack</p>
              <p className="text-2xs text-forge-text-muted">Messaging</p>
            </Link>
            <Link
              to="/build/_blank"
              className="forge-card-hover p-4 text-center group"
            >
              <div className="w-10 h-10 rounded-lg bg-forge-surface flex items-center justify-center mx-auto mb-2 group-hover:bg-forge-surface-hover transition-colors">
                <Plus className="w-5 h-5 text-forge-text-muted" />
              </div>
              <p className="text-sm font-medium text-forge-text">Custom</p>
              <p className="text-2xs text-forge-text-muted">From scratch</p>
            </Link>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="space-y-4">
          <h2 className="font-medium text-forge-text">Recent Activity</h2>
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

          {/* Most Used Templates */}
          {memory.most_used_templates.length > 0 && (
            <>
              <h2 className="font-medium text-forge-text pt-2">Favorite Templates</h2>
              <div className="forge-card p-3">
                <div className="space-y-1">
                  {memory.most_used_templates.slice(0, 5).map((template, i) => (
                    <Link
                      key={template}
                      to={`/build/${template}`}
                      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-forge-surface-hover transition-colors"
                    >
                      <span className="text-xs text-forge-text-muted w-4">{i + 1}.</span>
                      <span className="text-sm text-forge-text">{template}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
