import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
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
  FileCode,
  Download,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useForgeStore, useAllServers } from '@/store';
import { generateServer, type GeneratedFiles } from '@/lib/generator';
import { builtInTemplates } from '@/lib/generator/templates';
import { toast } from '@/store/toast';
import type { TemplateDefinition } from '@/types';

type Tab = 'overview' | 'tools' | 'code' | 'history';

// Map file names to display labels
const FILE_LABELS: Record<string, string> = {
  'src/index.ts': 'Server Source (TypeScript)',
  'package.json': 'package.json',
  'tsconfig.json': 'tsconfig.json',
  'README.md': 'README',
  '.env.example': 'Environment Variables',
  'claude-config.json': 'Claude Config',
};

function CodeFileSection({
  fileName,
  content,
  defaultExpanded,
}: {
  fileName: string;
  content: string;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded ?? false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = content;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopied(true);
    toast.success(`Copied ${fileName}`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="forge-card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-forge-surface-hover transition-colors"
      >
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-forge-text-muted" />
        ) : (
          <ChevronRight className="w-4 h-4 text-forge-text-muted" />
        )}
        <FileCode className="w-4 h-4 text-forge-accent" />
        <span className="text-sm font-medium text-forge-text">{FILE_LABELS[fileName] || fileName}</span>
        <span className="text-2xs text-forge-text-muted font-mono ml-auto mr-2">{fileName}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleCopy();
          }}
          className="p-1 hover:bg-forge-bg rounded transition-colors"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-forge-success" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-forge-text-muted" />
          )}
        </button>
      </button>
      {expanded && (
        <div className="border-t border-forge-border">
          <pre className="code-block text-xs overflow-auto max-h-96 p-4">{content}</pre>
        </div>
      )}
    </div>
  );
}

export function ServerDetail() {
  const { serverName } = useParams();
  const navigate = useNavigate();
  const allServers = useAllServers();
  const promoteServer = useForgeStore((s) => s.promoteServer);
  const deleteServer = useForgeStore((s) => s.deleteServer);
  const config = useForgeStore((s) => s.config);

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const server = allServers.find((s) => s.name === serverName);

  // Generate all server files on demand
  const generatedFiles = useMemo<GeneratedFiles | null>(() => {
    if (!server) return null;

    // Find the matching built-in template, or create a minimal one
    const templateDef: TemplateDefinition = builtInTemplates.find(
      (t) => t.name === server.template
    ) || {
      name: server.template,
      display_name: server.template,
      description: `MCP server generated from ${server.template} template`,
      version: server.meta.template_version || '1.0.0',
      author: config.defaults.author,
      tags: [],
      variables: Object.keys(server.variables).map((name) => ({
        name,
        type: 'string' as const,
        required: true,
        description: '',
      })),
      tools: server.tools,
      dependencies: [],
    };

    try {
      return generateServer({
        serverName: server.name,
        description: templateDef.description,
        template: templateDef,
        variables: server.variables,
        tools: server.tools,
        transport: config.defaults.transport,
        port: server.port || 3000,
      });
    } catch {
      return null;
    }
  }, [server, config.defaults.transport, config.defaults.author]);

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

  const handleDownloadAll = () => {
    if (!generatedFiles) return;
    // Download as a single concatenated file with clear separators
    const content = Object.entries(generatedFiles)
      .map(([name, code]) => `// ===== ${name} =====\n\n${code}`)
      .join('\n\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${server.name}-generated.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Downloaded generated files');
  };

  const handlePromote = () => {
    promoteServer(server.name);
    toast.success(`${server.name} promoted to production`);
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deleteServer(server.name, server.location);
    toast.info(`Deleted ${server.name}`);
    navigate('/');
  };

  // Auto-reset confirmation after 4 seconds
  useEffect(() => {
    if (!confirmDelete) return;
    const timer = setTimeout(() => setConfirmDelete(false), 4000);
    return () => clearTimeout(timer);
  }, [confirmDelete]);

  const tabs = [
    { id: 'overview' as Tab, label: 'Overview' },
    { id: 'tools' as Tab, label: `Tools (${server.tools.length})` },
    { id: 'code' as Tab, label: 'Generated Code' },
    { id: 'history' as Tab, label: 'History' },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/"
          className="flex items-center gap-2 text-forge-text-secondary hover:text-forge-text mb-4 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          My Servers
        </Link>

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

            <div className="forge-card p-4 md:col-span-2">
              <h3 className="font-medium text-forge-text mb-3">Actions</h3>
              <div className="flex items-center gap-3 flex-wrap">
                <Link to={`/test/${server.name}`} className="forge-btn-secondary">
                  <FlaskConical className="w-4 h-4" />
                  Open Test Harness
                </Link>
                <button
                  onClick={() => setActiveTab('code')}
                  className="forge-btn-secondary"
                >
                  <FileCode className="w-4 h-4" />
                  View Generated Code
                </button>
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
            {server.tools.length === 0 ? (
              <div className="forge-card flex flex-col items-center justify-center py-12">
                <FlaskConical className="w-5 h-5 text-forge-text-muted mb-2" />
                <p className="text-sm text-forge-text-muted">No tools defined.</p>
              </div>
            ) : (
              server.tools.map((tool) => (
                <div key={tool.name} className="forge-card p-4">
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
              ))
            )}
          </div>
        )}

        {activeTab === 'code' && (
          <div className="space-y-3">
            {/* Header with download */}
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-medium text-forge-text">Generated Server Files</h3>
                <p className="text-sm text-forge-text-muted mt-1">
                  Copy individual files or download all at once
                </p>
              </div>
              <button onClick={handleDownloadAll} className="forge-btn-secondary text-sm">
                <Download className="w-4 h-4" />
                Download All
              </button>
            </div>

            {generatedFiles ? (
              <>
                {/* Main source file expanded by default */}
                <CodeFileSection
                  fileName="src/index.ts"
                  content={generatedFiles['src/index.ts']}
                  defaultExpanded
                />
                <CodeFileSection
                  fileName="package.json"
                  content={generatedFiles['package.json']}
                />
                <CodeFileSection
                  fileName="tsconfig.json"
                  content={generatedFiles['tsconfig.json']}
                />
                <CodeFileSection
                  fileName="claude-config.json"
                  content={generatedFiles['claude-config.json']}
                />
                <CodeFileSection
                  fileName=".env.example"
                  content={generatedFiles['.env.example']}
                />
                <CodeFileSection
                  fileName="README.md"
                  content={generatedFiles['README.md']}
                />
              </>
            ) : (
              <div className="forge-card flex flex-col items-center justify-center py-12">
                <FileCode className="w-5 h-5 text-forge-text-muted mb-2" />
                <p className="text-sm text-forge-text-muted">
                  Unable to generate code for this server configuration.
                </p>
              </div>
            )}
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
