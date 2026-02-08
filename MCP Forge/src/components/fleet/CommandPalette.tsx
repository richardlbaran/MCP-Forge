import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  Trash2,
  Play,
  Square,
  Terminal,
  Scroll,
  Eye,
  EyeOff,
  Server,
  ChevronRight,
  Clock,
  Command,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
  X,
} from 'lucide-react';
import { FleetServer } from '@/store/fleet';

// ============= Types =============

interface Command {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'workers' | 'tasks' | 'view';
  shortcut?: string;
  action?: () => void;
  hasSubMenu?: boolean;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  servers: FleetServer[];
  onSpawnWorker?: (serverId: string) => void;
  onKillAllWorkers?: () => void;
  onSubmitTask?: (tool: string, params: Record<string, unknown>) => void;
  onCancelAllTasks?: () => void;
  onToggleAutoScroll?: () => void;
  onClearLogs?: () => void;
  autoScrollEnabled?: boolean;
}

type SubMenuState = 'none' | 'spawn-server' | 'submit-task';

// ============= Constants =============

const RECENT_COMMANDS_KEY = 'fleet-command-palette-recent';
const MAX_RECENT_COMMANDS = 3;

const CATEGORY_LABELS: Record<string, string> = {
  recent: 'Recent',
  workers: 'Workers',
  tasks: 'Tasks',
  view: 'View',
};

// ============= Component =============

export function CommandPalette({
  isOpen,
  onClose,
  servers,
  onSpawnWorker,
  onKillAllWorkers,
  onSubmitTask,
  onCancelAllTasks,
  onToggleAutoScroll,
  onClearLogs,
  autoScrollEnabled = true,
}: CommandPaletteProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [subMenu, setSubMenu] = useState<SubMenuState>('none');
  const [recentCommandIds, setRecentCommandIds] = useState<string[]>([]);
  
  // Task submission state
  const [taskTool, setTaskTool] = useState('');
  const [taskParams, setTaskParams] = useState('{}');

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Load recent commands from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(RECENT_COMMANDS_KEY);
    if (stored) {
      try {
        setRecentCommandIds(JSON.parse(stored));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Save recent command
  const saveRecentCommand = useCallback((commandId: string) => {
    setRecentCommandIds((prev) => {
      const filtered = prev.filter((id) => id !== commandId);
      const updated = [commandId, ...filtered].slice(0, MAX_RECENT_COMMANDS);
      localStorage.setItem(RECENT_COMMANDS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Define all available commands
  const allCommands = useMemo<Command[]>(() => [
    {
      id: 'spawn-worker',
      name: 'Spawn Worker',
      description: 'Start a new worker process from a server',
      icon: Plus,
      category: 'workers',
      shortcut: '⌘W',
      hasSubMenu: true,
    },
    {
      id: 'kill-all-workers',
      name: 'Kill All Workers',
      description: 'Terminate all running worker processes',
      icon: Trash2,
      category: 'workers',
      shortcut: '⌘⇧W',
      action: () => {
        onKillAllWorkers?.();
        saveRecentCommand('kill-all-workers');
        onClose();
      },
    },
    {
      id: 'submit-task',
      name: 'Submit Task',
      description: 'Submit a new task for execution',
      icon: Play,
      category: 'tasks',
      shortcut: '⌘T',
      hasSubMenu: true,
    },
    {
      id: 'cancel-all-tasks',
      name: 'Cancel All Tasks',
      description: 'Cancel all pending and running tasks',
      icon: Square,
      category: 'tasks',
      shortcut: '⌘⇧T',
      action: () => {
        onCancelAllTasks?.();
        saveRecentCommand('cancel-all-tasks');
        onClose();
      },
    },
    {
      id: 'toggle-auto-scroll',
      name: autoScrollEnabled ? 'Disable Auto-scroll' : 'Enable Auto-scroll',
      description: `Auto-scroll is currently ${autoScrollEnabled ? 'enabled' : 'disabled'}`,
      icon: autoScrollEnabled ? EyeOff : Eye,
      category: 'view',
      shortcut: '⌘S',
      action: () => {
        onToggleAutoScroll?.();
        saveRecentCommand('toggle-auto-scroll');
        onClose();
      },
    },
    {
      id: 'clear-logs',
      name: 'Clear All Logs',
      description: 'Remove all log entries from the view',
      icon: Scroll,
      category: 'view',
      shortcut: '⌘L',
      action: () => {
        onClearLogs?.();
        saveRecentCommand('clear-logs');
        onClose();
      },
    },
  ], [
    autoScrollEnabled,
    onKillAllWorkers,
    onCancelAllTasks,
    onToggleAutoScroll,
    onClearLogs,
    onClose,
    saveRecentCommand,
  ]);

  // Filter commands based on search query
  const filteredCommands = useMemo(() => {
    if (!searchQuery.trim()) return allCommands;
    
    const query = searchQuery.toLowerCase();
    return allCommands.filter((cmd) =>
      cmd.name.toLowerCase().includes(query) ||
      cmd.description.toLowerCase().includes(query) ||
      cmd.category.toLowerCase().includes(query)
    );
  }, [allCommands, searchQuery]);

  // Get recent commands
  const recentCommands = useMemo(() => {
    if (searchQuery.trim()) return [];
    return recentCommandIds
      .map((id) => allCommands.find((cmd) => cmd.id === id))
      .filter((cmd): cmd is Command => cmd !== undefined);
  }, [allCommands, recentCommandIds, searchQuery]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: { category: string; commands: Command[] }[] = [];
    
    if (recentCommands.length > 0) {
      groups.push({ category: 'recent', commands: recentCommands });
    }
    
    const categories = ['workers', 'tasks', 'view'] as const;
    for (const category of categories) {
      const categoryCommands = filteredCommands.filter((cmd) => cmd.category === category);
      if (categoryCommands.length > 0) {
        groups.push({ category, commands: categoryCommands });
      }
    }
    
    return groups;
  }, [filteredCommands, recentCommands]);

  // Flatten commands for keyboard navigation
  const flatCommands = useMemo(() => {
    return groupedCommands.flatMap((group) => group.commands);
  }, [groupedCommands]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedIndex(0);
      setSubMenu('none');
      setTaskTool('');
      setTaskParams('{}');
      // Focus input after animation
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const selectedElement = listRef.current.querySelector('[data-selected="true"]');
    selectedElement?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (subMenu !== 'none') {
      // Handle sub-menu navigation
      if (e.key === 'Escape') {
        e.preventDefault();
        setSubMenu('none');
        setSelectedIndex(0);
        return;
      }
      
      if (subMenu === 'spawn-server') {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, servers.length - 1));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter' && servers[selectedIndex]) {
          e.preventDefault();
          onSpawnWorker?.(servers[selectedIndex].id);
          saveRecentCommand('spawn-worker');
          onClose();
        }
      }
      
      if (subMenu === 'submit-task' && e.key === 'Enter' && e.metaKey) {
        e.preventDefault();
        try {
          const params = JSON.parse(taskParams);
          onSubmitTask?.(taskTool, params);
          saveRecentCommand('submit-task');
          onClose();
        } catch {
          // Invalid JSON, don't submit
        }
      }
      
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, flatCommands.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter': {
        e.preventDefault();
        const selected = flatCommands[selectedIndex];
        if (selected) {
          if (selected.hasSubMenu) {
            if (selected.id === 'spawn-worker') {
              setSubMenu('spawn-server');
              setSelectedIndex(0);
            } else if (selected.id === 'submit-task') {
              setSubMenu('submit-task');
            }
          } else if (selected.action) {
            selected.action();
          }
        }
        break;
      }
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [
    flatCommands,
    selectedIndex,
    subMenu,
    servers,
    taskTool,
    taskParams,
    onSpawnWorker,
    onSubmitTask,
    onClose,
    saveRecentCommand,
  ]);

  // Handle command click
  const handleCommandClick = useCallback((command: Command) => {
    if (command.hasSubMenu) {
      if (command.id === 'spawn-worker') {
        setSubMenu('spawn-server');
        setSelectedIndex(0);
      } else if (command.id === 'submit-task') {
        setSubMenu('submit-task');
      }
    } else if (command.action) {
      command.action();
    }
  }, []);

  // Handle server selection
  const handleServerClick = useCallback((server: FleetServer) => {
    onSpawnWorker?.(server.id);
    saveRecentCommand('spawn-worker');
    onClose();
  }, [onSpawnWorker, onClose, saveRecentCommand]);

  // Handle task submission
  const handleTaskSubmit = useCallback(() => {
    try {
      const params = JSON.parse(taskParams);
      onSubmitTask?.(taskTool, params);
      saveRecentCommand('submit-task');
      onClose();
    } catch {
      // Invalid JSON
    }
  }, [taskTool, taskParams, onSubmitTask, onClose, saveRecentCommand]);

  // Handle click outside
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
          onClick={handleBackdropClick}
          role="dialog"
          aria-modal="true"
          aria-labelledby="command-palette-title"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-forge-bg/60 backdrop-blur-sm" />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-xl forge-card shadow-2xl overflow-hidden"
            onKeyDown={handleKeyDown}
          >
            {/* Main View */}
            <AnimatePresence mode="wait">
              {subMenu === 'none' && (
                <motion.div
                  key="main"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.15 }}
                >
                  {/* Search Input */}
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-forge-border">
                    <Search className="w-5 h-5 text-forge-text-muted flex-shrink-0" />
                    <input
                      ref={inputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setSelectedIndex(0);
                      }}
                      placeholder="Search commands..."
                      className="flex-1 bg-transparent text-forge-text placeholder-forge-text-muted outline-none text-sm"
                      aria-label="Search commands"
                      id="command-palette-title"
                    />
                    <kbd className="hidden sm:flex items-center gap-1 px-2 py-0.5 text-xs text-forge-text-muted bg-forge-surface rounded border border-forge-border">
                      esc
                    </kbd>
                  </div>

                  {/* Command List */}
                  <div
                    ref={listRef}
                    className="max-h-[50vh] overflow-y-auto"
                    role="listbox"
                    aria-label="Commands"
                  >
                    {groupedCommands.length === 0 ? (
                      <div className="px-4 py-8 text-center text-forge-text-muted text-sm">
                        No commands found
                      </div>
                    ) : (
                      groupedCommands.map((group, groupIndex) => {
                        // Calculate the start index for this group
                        let startIndex = 0;
                        for (let i = 0; i < groupIndex; i++) {
                          startIndex += groupedCommands[i].commands.length;
                        }

                        return (
                          <div key={group.category}>
                            <div className="px-4 py-2 text-xs font-medium text-forge-text-muted uppercase tracking-wider bg-forge-bg/50">
                              {group.category === 'recent' && (
                                <Clock className="inline w-3 h-3 mr-1.5 -mt-0.5" />
                              )}
                              {CATEGORY_LABELS[group.category]}
                            </div>
                            {group.commands.map((command, cmdIndex) => {
                              const flatIndex = startIndex + cmdIndex;
                              const isSelected = selectedIndex === flatIndex;
                              const Icon = command.icon;

                              return (
                                <button
                                  key={`${group.category}-${command.id}`}
                                  data-selected={isSelected}
                                  onClick={() => handleCommandClick(command)}
                                  onMouseEnter={() => setSelectedIndex(flatIndex)}
                                  className={`
                                    w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
                                    ${isSelected
                                      ? 'bg-forge-accent/10 text-forge-text'
                                      : 'text-forge-text-secondary hover:bg-forge-surface-hover'
                                    }
                                  `}
                                  role="option"
                                  aria-selected={isSelected}
                                >
                                  <div className={`
                                    w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                                    ${isSelected ? 'bg-forge-accent/20' : 'bg-forge-surface'}
                                  `}>
                                    <Icon className={`w-4 h-4 ${isSelected ? 'text-forge-accent' : 'text-forge-text-muted'}`} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm truncate">
                                      {command.name}
                                    </div>
                                    <div className="text-xs text-forge-text-muted truncate">
                                      {command.description}
                                    </div>
                                  </div>
                                  {command.shortcut && (
                                    <kbd className="hidden sm:block px-1.5 py-0.5 text-xs text-forge-text-muted bg-forge-surface rounded border border-forge-border">
                                      {command.shortcut}
                                    </kbd>
                                  )}
                                  {command.hasSubMenu && (
                                    <ChevronRight className="w-4 h-4 text-forge-text-muted" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between px-4 py-2 border-t border-forge-border bg-forge-bg/50 text-xs text-forge-text-muted">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <ArrowUp className="w-3 h-3" />
                        <ArrowDown className="w-3 h-3" />
                        navigate
                      </span>
                      <span className="flex items-center gap-1">
                        <CornerDownLeft className="w-3 h-3" />
                        select
                      </span>
                    </div>
                    <span className="flex items-center gap-1">
                      <Command className="w-3 h-3" />K to toggle
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Spawn Server Sub-menu */}
              {subMenu === 'spawn-server' && (
                <motion.div
                  key="spawn-server"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.15 }}
                >
                  {/* Header */}
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-forge-border">
                    <button
                      onClick={() => {
                        setSubMenu('none');
                        setSelectedIndex(0);
                      }}
                      className="p-1 rounded hover:bg-forge-surface-hover transition-colors"
                      aria-label="Back to commands"
                    >
                      <X className="w-4 h-4 text-forge-text-muted" />
                    </button>
                    <div className="flex items-center gap-2">
                      <Plus className="w-5 h-5 text-forge-accent" />
                      <span className="font-medium text-forge-text">Spawn Worker</span>
                    </div>
                  </div>

                  <div className="px-4 py-2 text-xs text-forge-text-muted bg-forge-bg/50">
                    Select a server to spawn a worker from
                  </div>

                  {/* Server List */}
                  <div className="max-h-[50vh] overflow-y-auto" role="listbox">
                    {servers.length === 0 ? (
                      <div className="px-4 py-8 text-center text-forge-text-muted text-sm">
                        No servers available
                      </div>
                    ) : (
                      servers.map((server, index) => {
                        const isSelected = selectedIndex === index;

                        return (
                          <button
                            key={server.id}
                            data-selected={isSelected}
                            onClick={() => handleServerClick(server)}
                            onMouseEnter={() => setSelectedIndex(index)}
                            className={`
                              w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
                              ${isSelected
                                ? 'bg-forge-accent/10 text-forge-text'
                                : 'text-forge-text-secondary hover:bg-forge-surface-hover'
                              }
                            `}
                            role="option"
                            aria-selected={isSelected}
                          >
                            <div className={`
                              w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                              ${isSelected ? 'bg-forge-accent/20' : 'bg-forge-surface'}
                            `}>
                              <Server className={`w-5 h-5 ${isSelected ? 'text-forge-accent' : 'text-forge-text-muted'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">
                                {server.name}
                              </div>
                              <div className="text-xs text-forge-text-muted truncate">
                                {server.template} · {server.tools.length} tools
                              </div>
                            </div>
                            <span className={`
                              text-xs px-2 py-0.5 rounded-full
                              ${server.status === 'healthy' ? 'bg-forge-success/10 text-forge-success' : ''}
                              ${server.status === 'warning' ? 'bg-forge-warning/10 text-forge-warning' : ''}
                              ${server.status === 'error' ? 'bg-forge-error/10 text-forge-error' : ''}
                              ${server.status === 'offline' ? 'bg-forge-surface text-forge-text-muted' : ''}
                              ${server.status === 'starting' ? 'bg-forge-info/10 text-forge-info' : ''}
                            `}>
                              {server.status}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center gap-4 px-4 py-2 border-t border-forge-border bg-forge-bg/50 text-xs text-forge-text-muted">
                    <span className="flex items-center gap-1">
                      <ArrowUp className="w-3 h-3" />
                      <ArrowDown className="w-3 h-3" />
                      navigate
                    </span>
                    <span className="flex items-center gap-1">
                      <CornerDownLeft className="w-3 h-3" />
                      spawn
                    </span>
                    <span className="flex items-center gap-1">
                      esc back
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Submit Task Sub-menu */}
              {subMenu === 'submit-task' && (
                <motion.div
                  key="submit-task"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.15 }}
                >
                  {/* Header */}
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-forge-border">
                    <button
                      onClick={() => {
                        setSubMenu('none');
                        setSelectedIndex(0);
                      }}
                      className="p-1 rounded hover:bg-forge-surface-hover transition-colors"
                      aria-label="Back to commands"
                    >
                      <X className="w-4 h-4 text-forge-text-muted" />
                    </button>
                    <div className="flex items-center gap-2">
                      <Play className="w-5 h-5 text-forge-accent" />
                      <span className="font-medium text-forge-text">Submit Task</span>
                    </div>
                  </div>

                  {/* Task Form */}
                  <div className="p-4 space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-forge-text-muted mb-1.5">
                        Tool Name
                      </label>
                      <input
                        type="text"
                        value={taskTool}
                        onChange={(e) => setTaskTool(e.target.value)}
                        placeholder="e.g., read_file, search_code"
                        className="forge-input w-full"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-forge-text-muted mb-1.5">
                        Parameters (JSON)
                      </label>
                      <textarea
                        value={taskParams}
                        onChange={(e) => setTaskParams(e.target.value)}
                        placeholder='{"path": "/example"}'
                        className="forge-input w-full h-24 font-mono text-sm resize-none"
                      />
                    </div>
                    <button
                      onClick={handleTaskSubmit}
                      disabled={!taskTool.trim()}
                      className="forge-btn-primary w-full justify-center"
                    >
                      <Terminal className="w-4 h-4" />
                      Submit Task
                    </button>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center gap-4 px-4 py-2 border-t border-forge-border bg-forge-bg/50 text-xs text-forge-text-muted">
                    <span className="flex items-center gap-1">
                      <Command className="w-3 h-3" />
                      <CornerDownLeft className="w-3 h-3" />
                      submit
                    </span>
                    <span className="flex items-center gap-1">
                      esc back
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export type { CommandPaletteProps };
