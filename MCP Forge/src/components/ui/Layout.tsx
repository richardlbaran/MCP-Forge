import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Hammer,
  FlaskConical,
  Layers,
  Settings,
  Zap,
  Server,
  FolderOpen,
  Target,
  Gauge,
  Video,
} from 'lucide-react';
import { useForgeStore } from '@/store';
import { useProjectStore } from '@/store/projects';

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { path: '/', icon: Target, label: 'Projects' },
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/fleet', icon: Gauge, label: 'Fleet' },
  { path: '/creator', icon: Video, label: 'Creator' },
  { path: '/build', icon: Hammer, label: 'Build' },
  { path: '/test', icon: FlaskConical, label: 'Test' },
  { path: '/templates', icon: Layers, label: 'Templates' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const config = useForgeStore((s) => s.config);
  const workspaceCount = useForgeStore((s) => s.workspaceServers.length);
  const deployedCount = useForgeStore((s) => s.deployedServers.length);
  const activeProjectName = useProjectStore((s) => s.activeProjectName);

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-60 bg-forge-surface border-r border-forge-border flex flex-col">
        {/* Logo */}
        <div className="p-5 border-b border-forge-border">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-forge-accent/10 flex items-center justify-center group-hover:bg-forge-accent/20 transition-colors">
              <Zap className="w-5 h-5 text-forge-accent" />
            </div>
            <div>
              <h1 className="font-semibold text-forge-text text-sm">MCP Forge</h1>
              <p className="text-2xs text-forge-text-muted">v{config.forge.version}</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive =
                location.pathname === item.path ||
                (item.path !== '/' && location.pathname.startsWith(item.path));

              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`
                      flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all
                      ${
                        isActive
                          ? 'bg-forge-accent/10 text-forge-accent'
                          : 'text-forge-text-secondary hover:text-forge-text hover:bg-forge-bg'
                      }
                    `}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Server counts */}
          <div className="mt-6 pt-4 border-t border-forge-border">
            <p className="px-3 text-2xs text-forge-text-muted uppercase tracking-wider mb-2">
              Servers
            </p>
            <div className="space-y-1">
              <div className="flex items-center gap-3 px-3 py-2 text-sm text-forge-text-secondary">
                <FolderOpen className="w-4 h-4 text-forge-workspace" />
                <span>Workspace</span>
                <span className="ml-auto text-xs text-forge-text-muted">{workspaceCount}</span>
              </div>
              <div className="flex items-center gap-3 px-3 py-2 text-sm text-forge-text-secondary">
                <Server className="w-4 h-4 text-forge-promoted" />
                <span>Deployed</span>
                <span className="ml-auto text-xs text-forge-text-muted">{deployedCount}</span>
              </div>
            </div>
          </div>

          {/* Active project */}
          {activeProjectName && (
            <div className="mt-4 pt-4 border-t border-forge-border">
              <p className="px-3 text-2xs text-forge-text-muted uppercase tracking-wider mb-2">
                Active Project
              </p>
              <Link
                to="/"
                className="flex items-center gap-3 px-3 py-2 text-sm text-forge-accent hover:bg-forge-accent-glow rounded-md transition-colors"
              >
                <Target className="w-4 h-4" />
                <span className="truncate">{activeProjectName}</span>
              </Link>
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-forge-border">
          <div className="flex items-center gap-2 text-2xs text-forge-text-muted">
            <div className="w-1.5 h-1.5 rounded-full bg-forge-success" />
            <span>Forge Server Active</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-forge-bg">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="p-6"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
