import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  Menu,
  X,
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

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const config = useForgeStore((s) => s.config);
  const workspaceCount = useForgeStore((s) => s.workspaceServers.length);
  const deployedCount = useForgeStore((s) => s.deployedServers.length);
  const activeProjectName = useProjectStore((s) => s.activeProjectName);

  return (
    <>
      {/* Logo */}
      <div className="p-5 border-b border-forge-border">
        <Link to="/" className="flex items-center gap-3 group" onClick={onNavigate}>
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
      <nav className="flex-1 p-3 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path));

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={onNavigate}
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
              onClick={onNavigate}
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
    </>
  );
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-60 bg-forge-surface border-r border-forge-border flex-col shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-forge-surface border-b border-forge-border px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-forge-accent" />
          <span className="font-semibold text-forge-text text-sm">MCP Forge</span>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-forge-text-muted hover:text-forge-text transition-colors"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-40 bg-black/50"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.aside
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="md:hidden fixed top-0 left-0 bottom-0 z-50 w-60 bg-forge-surface border-r border-forge-border flex flex-col"
            >
              <SidebarContent onNavigate={() => setMobileMenuOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-forge-bg md:h-screen">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="p-4 md:p-6 pt-16 md:pt-6"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
