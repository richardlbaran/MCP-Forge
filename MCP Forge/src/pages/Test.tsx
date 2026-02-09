import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Play,
  Square,
  RefreshCw,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  Plug,
  Wrench,
  Terminal,
} from 'lucide-react';
import { useAllServers } from '@/store';
import { useTestingStore, useSelectedToolSchema } from '@/store/testing';
import { getTestHistory, type TestHistoryEntry } from '@/lib/mcp-client';

export function Test() {
  const { serverName: urlServerName } = useParams();
  const allServers = useAllServers();
  
  const {
    connectionState,
    discoveredTools,
    selectedTool,
    currentParams,
    lastResponse,
    isExecuting,
    logs,
    connect,
    disconnect,
    selectTool,
    setParam,
    executeTool,
    clearLogs,
  } = useTestingStore();

  const toolSchema = useSelectedToolSchema();
  const [selectedServer, setSelectedServer] = useState(urlServerName || '');
  const [history, setHistory] = useState<TestHistoryEntry[]>([]);

  // Load history
  useEffect(() => {
    setHistory(getTestHistory());
  }, [lastResponse]);

  // Auto-connect if server specified in URL
  useEffect(() => {
    if (urlServerName && connectionState === 'disconnected') {
      setSelectedServer(urlServerName);
      connect(urlServerName);
    }
  }, [urlServerName]);

  const handleConnect = async () => {
    if (selectedServer) {
      await connect(selectedServer);
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
  };

  const handleExecute = async () => {
    await executeTool();
  };

  return (
    <div className="h-[calc(100vh-theme(spacing.12))] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-forge-text">Test Harness</h1>
          <p className="text-sm text-forge-text-secondary mt-1">
            Connect to a server, discover tools, and execute them interactively
          </p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-4 gap-4 min-h-0">
        {/* Left panel - Server & Tools */}
        <div className="col-span-1 flex flex-col gap-4">
          {/* Server selector */}
          <div className="forge-panel">
            <div className="forge-panel-header">
              <h2 className="text-sm font-medium text-forge-text">Server</h2>
              <div
                className={`w-2 h-2 rounded-full ${
                  connectionState === 'connected'
                    ? 'bg-forge-success'
                    : connectionState === 'connecting'
                    ? 'bg-forge-warning animate-pulse'
                    : connectionState === 'error'
                    ? 'bg-forge-error'
                    : 'bg-forge-text-muted'
                }`}
              />
            </div>
            <div className="forge-panel-body space-y-3">
              <select
                value={selectedServer}
                onChange={(e) => setSelectedServer(e.target.value)}
                disabled={connectionState === 'connected'}
                className="forge-select w-full text-sm"
              >
                <option value="">Select a server...</option>
                <optgroup label="Workspace">
                  {allServers
                    .filter((s) => s.location === 'workspace')
                    .map((s) => (
                      <option key={s.name} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                </optgroup>
                <optgroup label="Deployed">
                  {allServers
                    .filter((s) => s.location === 'deployed')
                    .map((s) => (
                      <option key={s.name} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                </optgroup>
              </select>

              {connectionState === 'connected' ? (
                <button onClick={handleDisconnect} className="forge-btn-secondary w-full text-sm">
                  <Square className="w-3 h-3" />
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={handleConnect}
                  disabled={!selectedServer || connectionState === 'connecting'}
                  className="forge-btn-primary w-full text-sm"
                >
                  {connectionState === 'connecting' ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <Play className="w-3 h-3" />
                  )}
                  Connect
                </button>
              )}
            </div>
          </div>

          {/* Tools list */}
          <div className="forge-panel flex-1 overflow-hidden flex flex-col">
            <div className="forge-panel-header">
              <h2 className="text-sm font-medium text-forge-text">Tools</h2>
              <span className="text-xs text-forge-text-muted">{discoveredTools.length}</span>
            </div>
            <div className="flex-1 overflow-auto">
              {discoveredTools.length === 0 ? (
                <div className="flex flex-col items-center py-6 px-4">
                  <Wrench className="w-5 h-5 text-forge-text-muted mb-2" />
                  <p className="text-xs text-forge-text-muted text-center">
                    {connectionState === 'connected'
                      ? 'No tools found on this server.'
                      : 'Connect to a server to discover its tools.'}
                  </p>
                </div>
              ) : (
                <div className="p-2">
                  {discoveredTools.map((tool) => (
                    <button
                      key={tool.name}
                      onClick={() => selectTool(tool.name)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        selectedTool === tool.name
                          ? 'bg-forge-accent/10 text-forge-accent'
                          : 'text-forge-text-secondary hover:bg-forge-surface-hover'
                      }`}
                    >
                      <div className="font-mono text-xs">{tool.name}</div>
                      {tool.annotations?.readOnlyHint && (
                        <span className="text-2xs text-forge-info">read-only</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Middle panel - Parameters & Execute */}
        <div className="col-span-2 flex flex-col gap-4">
          {/* Parameters */}
          <div className="forge-panel flex-1 overflow-hidden flex flex-col">
            <div className="forge-panel-header">
              <h2 className="text-sm font-medium text-forge-text">
                {selectedTool || 'Parameters'}
              </h2>
              <button
                onClick={handleExecute}
                disabled={!selectedTool || isExecuting || connectionState !== 'connected'}
                className="forge-btn-primary text-xs py-1"
              >
                {isExecuting ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <Play className="w-3 h-3" />
                )}
                Execute
              </button>
            </div>
            <div className="forge-panel-body flex-1 overflow-auto">
              {!selectedTool ? (
                <div className="flex flex-col items-center py-12">
                  <Plug className="w-5 h-5 text-forge-text-muted mb-2" />
                  <p className="text-sm text-forge-text-muted">
                    Select a tool to configure its parameters.
                  </p>
                </div>
              ) : toolSchema ? (
                <div className="space-y-4">
                  {toolSchema.description && (
                    <p className="text-sm text-forge-text-secondary">
                      {toolSchema.description}
                    </p>
                  )}

                  {toolSchema.inputSchema.properties &&
                    Object.entries(toolSchema.inputSchema.properties).map(
                      ([key, prop]) => (
                        <div key={key}>
                          <label className="flex items-center gap-2 text-sm text-forge-text-secondary mb-1">
                            <code className="text-forge-accent">{key}</code>
                            {toolSchema.inputSchema.required?.includes(key) && (
                              <span className="text-forge-error text-xs">*</span>
                            )}
                            <span className="text-2xs text-forge-text-muted">
                              ({prop.type})
                            </span>
                          </label>
                          {prop.type === 'boolean' ? (
                            <select
                              value={String(currentParams[key] ?? '')}
                              onChange={(e) =>
                                setParam(key, e.target.value === 'true')
                              }
                              className="forge-select w-full text-sm"
                            >
                              <option value="">--</option>
                              <option value="true">true</option>
                              <option value="false">false</option>
                            </select>
                          ) : prop.type === 'number' ? (
                            <input
                              type="number"
                              value={String(currentParams[key] ?? '')}
                              onChange={(e) =>
                                setParam(
                                  key,
                                  e.target.value ? Number(e.target.value) : undefined
                                )
                              }
                              className="forge-input w-full text-sm"
                              placeholder={prop.description}
                            />
                          ) : prop.type === 'object' || prop.type === 'array' ? (
                            <textarea
                              value={
                                typeof currentParams[key] === 'object'
                                  ? JSON.stringify(currentParams[key], null, 2)
                                  : ''
                              }
                              onChange={(e) => {
                                const val = e.target.value;
                                if (!val.trim()) return;
                                try {
                                  setParam(key, JSON.parse(val));
                                  e.target.setCustomValidity('');
                                } catch {
                                  e.target.setCustomValidity('Invalid JSON');
                                }
                              }}
                              className="forge-textarea w-full h-24 text-xs font-mono"
                              placeholder={`${prop.type === 'object' ? '{}' : '[]'}`}
                            />
                          ) : (
                            <input
                              type="text"
                              value={String(currentParams[key] ?? '')}
                              onChange={(e) => setParam(key, e.target.value)}
                              className="forge-input w-full text-sm"
                              placeholder={prop.description}
                            />
                          )}
                        </div>
                      )
                    )}
                </div>
              ) : (
                <p className="text-sm text-forge-text-muted text-center py-8">
                  Loading schema...
                </p>
              )}
            </div>
          </div>

          {/* Response */}
          <div className="forge-panel flex-1 overflow-hidden flex flex-col">
            <div className="forge-panel-header">
              <h2 className="text-sm font-medium text-forge-text">Response</h2>
              {lastResponse && (
                <span
                  className={`forge-badge ${
                    lastResponse.isError ? 'forge-badge-error' : 'forge-badge-success'
                  }`}
                >
                  {lastResponse.isError ? 'Error' : 'Success'}
                </span>
              )}
            </div>
            <div className="forge-panel-body flex-1 overflow-auto bg-forge-bg">
              {isExecuting ? (
                <div className="flex items-center justify-center h-full">
                  <RefreshCw className="w-6 h-6 text-forge-accent animate-spin" />
                </div>
              ) : lastResponse ? (
                <pre className="text-xs font-mono text-forge-text whitespace-pre-wrap p-3">
                  {lastResponse.content
                    .map((c) => c.text || JSON.stringify(c, null, 2))
                    .join('\n')}
                </pre>
              ) : (
                <div className="flex flex-col items-center py-12">
                  <Terminal className="w-5 h-5 text-forge-text-muted mb-2" />
                  <p className="text-sm text-forge-text-muted">
                    Execute a tool to see the response here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right panel - Logs & History */}
        <div className="col-span-1 flex flex-col gap-4">
          {/* Logs */}
          <div className="forge-panel flex-1 overflow-hidden flex flex-col">
            <div className="forge-panel-header">
              <h2 className="text-sm font-medium text-forge-text">Logs</h2>
              <button onClick={clearLogs} className="forge-btn-icon">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-forge-bg p-2">
              {logs.length === 0 ? (
                <p className="text-xs text-forge-text-muted text-center py-4">
                  No logs yet
                </p>
              ) : (
                <div className="space-y-1">
                  {logs.map((log, i) => (
                    <div
                      key={i}
                      className={`text-2xs font-mono ${
                        log.type === 'error'
                          ? 'text-forge-error'
                          : log.direction === 'send'
                          ? 'text-forge-info'
                          : 'text-forge-success'
                      }`}
                    >
                      <span className="text-forge-text-muted">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>{' '}
                      {log.direction === 'send' ? '→' : '←'}{' '}
                      {log.method || log.type}
                      {log.duration_ms && (
                        <span className="text-forge-text-muted"> ({log.duration_ms}ms)</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* History */}
          <div className="forge-panel flex-1 overflow-hidden flex flex-col">
            <div className="forge-panel-header">
              <h2 className="text-sm font-medium text-forge-text">History</h2>
              <span className="text-xs text-forge-text-muted">{history.length}</span>
            </div>
            <div className="flex-1 overflow-auto">
              {history.length === 0 ? (
                <p className="p-4 text-xs text-forge-text-muted text-center">
                  No test history
                </p>
              ) : (
                <div className="p-2 space-y-1">
                  {history.slice(0, 20).map((entry) => (
                    <button
                      key={entry.id}
                      onClick={() => {
                        selectTool(entry.tool);
                        Object.entries(entry.params).forEach(([k, v]) =>
                          setParam(k, v)
                        );
                      }}
                      className="w-full text-left px-2 py-1.5 rounded hover:bg-forge-surface-hover transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {entry.response.isError ? (
                          <XCircle className="w-3 h-3 text-forge-error" />
                        ) : (
                          <CheckCircle className="w-3 h-3 text-forge-success" />
                        )}
                        <span className="text-xs font-mono text-forge-text truncate">
                          {entry.tool}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Clock className="w-2.5 h-2.5 text-forge-text-muted" />
                        <span className="text-2xs text-forge-text-muted">
                          {entry.duration_ms}ms
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
