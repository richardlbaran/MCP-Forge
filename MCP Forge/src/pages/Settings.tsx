import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { useForgeStore } from '@/store';
import { exportConfigAsYaml } from '@/lib/config';

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onChange(); } }}
      className={`w-10 h-5 rounded-full transition-colors ${
        checked ? 'bg-forge-accent' : 'bg-forge-surface'
      }`}
    >
      <div
        className={`w-4 h-4 bg-white rounded-full transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

export function Settings() {
  const config = useForgeStore((s) => s.config);
  const setConfig = useForgeStore((s) => s.setConfig);
  const memory = useForgeStore((s) => s.memory);
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const yamlConfig = exportConfigAsYaml(config);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-forge-text">Settings</h1>
        <p className="text-sm text-forge-text-secondary mt-1">Configure MCP Forge preferences, paths, and server options</p>
      </div>

      {/* Forge Info */}
      <div className="forge-card p-4">
        <h2 className="font-medium text-forge-text mb-4">Forge Information</h2>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <dt className="text-forge-text-muted">Name</dt>
          <dd className="text-forge-text">{config.forge.name}</dd>
          <dt className="text-forge-text-muted">Version</dt>
          <dd className="text-forge-text font-mono">{config.forge.version}</dd>
          <dt className="text-forge-text-muted">Servers Created</dt>
          <dd className="text-forge-text">{memory.servers_created}</dd>
        </dl>
      </div>

      {/* Paths */}
      <div className="forge-card p-4">
        <h2 className="font-medium text-forge-text mb-4">Paths</h2>
        <div className="space-y-3">
          {Object.entries(config.paths).map(([key, value]) => (
            <div key={key}>
              <label className="block text-sm text-forge-text-muted mb-1 capitalize">
                {key}
              </label>
              <input
                type="text"
                value={value}
                onChange={(e) =>
                  setConfig({
                    paths: { ...config.paths, [key]: e.target.value },
                  })
                }
                className="forge-input w-full text-sm"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Defaults */}
      <div className="forge-card p-4">
        <h2 className="font-medium text-forge-text mb-4">Defaults</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-forge-text-muted mb-1">
              Transport
            </label>
            <select
              value={config.defaults.transport}
              onChange={(e) =>
                setConfig({
                  defaults: {
                    ...config.defaults,
                    transport: e.target.value as 'stdio' | 'http',
                  },
                })
              }
              className="forge-select w-full text-sm"
            >
              <option value="stdio">stdio</option>
              <option value="http">http</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-forge-text-muted mb-1">
              Language
            </label>
            <select
              value={config.defaults.language}
              onChange={(e) =>
                setConfig({
                  defaults: {
                    ...config.defaults,
                    language: e.target.value as 'typescript' | 'python',
                  },
                })
              }
              className="forge-select w-full text-sm"
            >
              <option value="typescript">TypeScript</option>
              <option value="python">Python</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-forge-text-muted mb-1">
              Author
            </label>
            <input
              type="text"
              value={config.defaults.author}
              onChange={(e) =>
                setConfig({
                  defaults: { ...config.defaults, author: e.target.value },
                })
              }
              className="forge-input w-full text-sm"
            />
          </div>
        </div>
      </div>

      {/* Context Bridge */}
      <div className="forge-card p-4">
        <h2 className="font-medium text-forge-text mb-4">ContextCommand Bridge</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm text-forge-text">Enable Bridge</label>
            <Toggle
              checked={config.context_bridge.enabled}
              onChange={() =>
                setConfig({
                  context_bridge: {
                    ...config.context_bridge,
                    enabled: !config.context_bridge.enabled,
                  },
                })
              }
              label="Enable Bridge"
            />
          </div>
          <div>
            <label className="block text-sm text-forge-text-muted mb-1">
              ContextCommand Path
            </label>
            <input
              type="text"
              value={config.context_bridge.contextcommand_path}
              onChange={(e) =>
                setConfig({
                  context_bridge: {
                    ...config.context_bridge,
                    contextcommand_path: e.target.value,
                  },
                })
              }
              className="forge-input w-full text-sm"
              placeholder="~/Projects/contextcommand"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm text-forge-text">Auto-inject Context</label>
            <Toggle
              checked={config.context_bridge.auto_inject}
              onChange={() =>
                setConfig({
                  context_bridge: {
                    ...config.context_bridge,
                    auto_inject: !config.context_bridge.auto_inject,
                  },
                })
              }
              label="Auto-inject Context"
            />
          </div>
        </div>
      </div>

      {/* MCP Server */}
      <div className="forge-card p-4">
        <h2 className="font-medium text-forge-text mb-4">Forge MCP Server</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm text-forge-text">Enable Server</label>
            <Toggle
              checked={config.mcp_server.enabled}
              onChange={() =>
                setConfig({
                  mcp_server: {
                    ...config.mcp_server,
                    enabled: !config.mcp_server.enabled,
                  },
                })
              }
              label="Enable MCP Server"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-forge-text-muted mb-1">
                Server Name
              </label>
              <input
                type="text"
                value={config.mcp_server.name}
                onChange={(e) =>
                  setConfig({
                    mcp_server: { ...config.mcp_server, name: e.target.value },
                  })
                }
                className="forge-input w-full text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-forge-text-muted mb-1">
                Port
              </label>
              <input
                type="number"
                value={config.mcp_server.port}
                onChange={(e) =>
                  setConfig({
                    mcp_server: {
                      ...config.mcp_server,
                      port: parseInt(e.target.value) || 3100,
                    },
                  })
                }
                className="forge-input w-full text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Export Config */}
      <div className="forge-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium text-forge-text">Configuration (YAML)</h2>
          <button
            onClick={() => handleCopy(yamlConfig, 'yaml')}
            className="forge-btn-ghost text-sm"
          >
            {copied === 'yaml' ? (
              <Check className="w-4 h-4 text-forge-success" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            Copy
          </button>
        </div>
        <pre className="code-block text-xs overflow-auto max-h-64">{yamlConfig}</pre>
      </div>

      {/* Forge Memory Stats */}
      <div className="forge-card p-4">
        <h2 className="font-medium text-forge-text mb-4">Forge Memory</h2>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <dt className="text-forge-text-muted">Total Servers Created</dt>
          <dd className="text-forge-text">{memory.servers_created}</dd>
          <dt className="text-forge-text-muted">Tool Invocations</dt>
          <dd className="text-forge-text">
            {Object.values(memory.tool_usage_stats).reduce((a, b) => a + b, 0)}
          </dd>
          <dt className="text-forge-text-muted">Failed Patterns Recorded</dt>
          <dd className="text-forge-text">{memory.failed_patterns.length}</dd>
          <dt className="text-forge-text-muted">Evolution Log Entries</dt>
          <dd className="text-forge-text">{memory.evolution_log.length}</dd>
        </dl>

        {memory.most_used_templates.length > 0 && (
          <div className="mt-4 pt-4 border-t border-forge-border">
            <h3 className="text-sm text-forge-text-muted mb-2">Most Used Templates</h3>
            <div className="flex flex-wrap gap-2">
              {memory.most_used_templates.map((t) => (
                <span key={t} className="forge-badge-default">
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
