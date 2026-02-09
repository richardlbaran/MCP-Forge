import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  FlaskConical,
  Trash2,
  Copy,
  Check,
  ArrowUpRight,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { useForgeStore, useAllServers } from '@/store';
import { generateClaudeConfig } from '@/lib/generator';

type Tab = 'overview' | 'tools' | 'code' | 'history';

export function ServerDetail() {
  const { serverName } = useParams();
  const navigate = useNavigate();
  const allServers = useAllServers();
  const promoteServer = useForgeStore((s) => s.promoteServer);
  const deleteServer = useForgeStore((s) => s.deleteServer);

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const server = allServers.find((s) => s.name === serverName);

  if (!server) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="w-14 h-14 rounded-full bg-forge-surface border border-forge-border flex items-center justify-center mb-5">
          <ArrowLeft className="w-6 h-6 text-forge-text-muted" />
        </div>
        <p className="text-sm text-forge-text-muted mb-6">
          Server "{serverName}" was not found.
        </p>
        <Link to="/" className="forge-btn-ghost text-sm">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers without clipboard API
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePromote = () => {
    promoteServer(server.name);
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deleteServer(server.name, server.location);
    navigate('/');
  };

  // Auto-reset confirmation after 4 seconds
  useEffect(() => {
    if (!confirmDelete) return;
    const timer = setTimeout(() => setConfirmDelete(false), 4000);
    return () => clearTimeout(timer);
  }, [confirmDelete]);

  const claudeConfig = generateClaudeConfig(server);

  const tabs = [
    { id: 'overview' as Tab, label: 'Overview' },
    { id: 'tools' as Tab, label: 'Tools' },
    { id: 'code' as Tab, label: 'Config' },
    { id: 'history' as Tab, label: 'History' },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-forge-text-secondary hover:text-forge-text mb-4 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`w-3 h-3 rounded-full ${
                server.status === 'running'
                  ? 'bg-forge-success animate-pulse'
                  : server.status === 'error'
                  ? 'bg-forge-error'
                  : 'bg-forge-text-muted'
              }`}
            />
            <div>
              <h1 className="text-2xl font-semibold text-forge-text">{server.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span
                  className={`forge-badge ${
                    server.location === 'deployed'
                      ? 'forge-badge-promoted'
                      : 'forge-badge-workspace'
                  }`}
                >
                  {server.location}
                </span>
                <span className="text-sm text-forge-text-muted">
                  {server.template} • {server.tools.length} tools
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link to={`/test/${server.name}`} className="forge-btn-secondary">
              <FlaskConical className="w-4 h-4" />
              Test
            </Link>
            {server.location === 'workspace' && (
              <button onClick={handlePromote} className="forge-btn-primary">
                <ArrowUpRight className="w-4 h-4" />
                Promote
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-forge-border mb-6">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={activeTab === tab.id ? 'forge-tab-active' : 'forge-tab'}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
      >
        {activeTab === 'overview' && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="forge-card p-4">
              <h3 className="font-medium text-forge-text mb-3">Server Info</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-forge-text-muted">Status</dt>
                  <dd className="text-forge-text capitalize">{server.status}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-forge-text-muted">Template</dt>
                  <dd className="text-forge-text">{server.template}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-forge-text-muted">Location</dt>
                  <dd className="text-forge-text capitalize">{server.location}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-forge-text-muted">Tools</dt>
                  <dd className="text-forge-text">{server.tools.length}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-forge-text-muted">Created</dt>
                  <dd className="text-forge-text">
                    {new Date(server.created_at).toLocaleDateString()}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="forge-card p-4">
              <h3 className="font-medium text-forge-text mb-3">Environment Variables</h3>
              {Object.keys(server.variables).length === 0 ? (
                <p className="text-sm text-forge-text-muted">No variables configured</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(server.variables).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2 text-sm">
                      <code className="text-forge-accent">{key}</code>
                      <span className="text-forge-text-muted">=</span>
                      <span className="text-forge-text font-mono">
                        {value ? '••••••••' : '(not set)'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="forge-card p-4 col-span-2">
              <h3 className="font-medium text-forge-text mb-3">Actions</h3>
              <div className="flex items-center gap-3">
                <Link to={`/test/${server.name}`} className="forge-btn-secondary">
                  <FlaskConical className="w-4 h-4" />
                  Open Test Harness
                </Link>
                <button onClick={handleDelete} className={confirmDelete ? 'forge-btn-danger animate-pulse' : 'forge-btn-danger'}>
                  {confirmDelete ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  {confirmDelete ? 'Click again to confirm' : 'Delete Server'}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tools' && (
          <div className="space-y-3">
            {server.tools.map((tool, i) => (
              <div key={i} className="forge-card p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-mono text-forge-text">{tool.name}</h4>
                    <p className="text-sm text-forge-text-secondary mt-1">
                      {tool.description}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {tool.annotations?.readOnlyHint && (
                      <span className="forge-badge-info">read-only</span>
                    )}
                    {tool.annotations?.destructiveHint && (
                      <span className="forge-badge-warning">destructive</span>
                    )}
                  </div>
                </div>
                {Object.keys(tool.parameters).length > 0 && (
                  <div className="mt-3 pt-3 border-t border-forge-border">
                    <h5 className="text-xs text-forge-text-muted mb-2">Parameters</h5>
                    <div className="space-y-1">
                      {Object.entries(tool.parameters).map(([key, param]) => (
                        <div key={key} className="flex items-center gap-2 text-xs">
                          <code className="text-forge-accent">{key}</code>
                          <span className="text-forge-text-muted">
                            ({param.type}{param.required && ', required'})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'code' && (
          <div className="space-y-4">
            <div className="forge-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-forge-text">Claude Code Configuration</h3>
                <button
                  onClick={() => handleCopy(claudeConfig)}
                  className="forge-btn-ghost text-sm"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-forge-success" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  Copy
                </button>
              </div>
              <p className="text-sm text-forge-text-muted mb-3">
                Add to <code className="text-forge-accent">~/.claude/claude_desktop_config.json</code>
              </p>
              <pre className="code-block text-xs overflow-auto">{claudeConfig}</pre>
            </div>

            <div className="forge-card p-4">
              <h3 className="font-medium text-forge-text mb-3">Forge Metadata</h3>
              <pre className="code-block text-xs overflow-auto">
                {JSON.stringify(server.meta, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="forge-card p-4">
            <div className="flex items-center gap-2 text-forge-text-muted mb-4">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Server Timeline</span>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-forge-success mt-1.5" />
                <div>
                  <p className="text-sm text-forge-text">Created</p>
                  <p className="text-xs text-forge-text-muted">
                    {new Date(server.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              {server.promoted_at && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-forge-promoted mt-1.5" />
                  <div>
                    <p className="text-sm text-forge-text">Promoted to production</p>
                    <p className="text-xs text-forge-text-muted">
                      {new Date(server.promoted_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-forge-info mt-1.5" />
                <div>
                  <p className="text-sm text-forge-text">Last updated</p>
                  <p className="text-xs text-forge-text-muted">
                    {new Date(server.updated_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
