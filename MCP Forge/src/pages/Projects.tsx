import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Target,
  Shield,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Lightbulb,
  Flag,
  Hammer,
  ArrowRight,
} from 'lucide-react';
import { useProjectStore } from '@/store/projects';
import { useAllServers } from '@/store';
import { suggestServersForProject } from '@/lib/generator/templates';
import type { DeltaType } from '@/lib/mantic';

const deltaIcons: Record<DeltaType, React.ElementType> = {
  decision: CheckCircle,
  requirement: Target,
  constraint: Shield,
  risk: AlertTriangle,
  question: HelpCircle,
  assumption: Lightbulb,
  artifact: Hammer,
  priority: Flag,
  identity: Target,
};

const deltaColors: Record<DeltaType, string> = {
  decision: 'text-forge-success',
  requirement: 'text-forge-info',
  constraint: 'text-forge-warning',
  risk: 'text-forge-error',
  question: 'text-forge-promoted',
  assumption: 'text-forge-workspace',
  artifact: 'text-forge-text-muted',
  priority: 'text-forge-accent',
  identity: 'text-forge-accent',
};

function DeltaSection({ 
  type, 
  deltas, 
  expanded,
  onToggle 
}: { 
  type: DeltaType; 
  deltas: Array<{ content: string; confidence: number }>;
  expanded: boolean;
  onToggle: () => void;
}) {
  const Icon = deltaIcons[type];
  const color = deltaColors[type];

  if (deltas.length === 0) return null;

  return (
    <div className="border-b border-forge-border last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-forge-surface-hover transition-colors"
      >
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-forge-text-muted" />
        ) : (
          <ChevronRight className="w-4 h-4 text-forge-text-muted" />
        )}
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-sm font-medium text-forge-text capitalize">{type}s</span>
        <span className="ml-auto text-xs text-forge-text-muted">{deltas.length}</span>
      </button>
      
      {expanded && (
        <div className="px-4 pb-3 pl-11 space-y-2">
          {deltas.map((delta, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="flex-1">
                <p className="text-sm text-forge-text-secondary">{delta.content}</p>
              </div>
              <span className="text-2xs text-forge-text-muted shrink-0">
                {Math.round(delta.confidence * 100)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Projects() {
  const { projects, activeProjectName, setActiveProject, getActiveProject } = useProjectStore();
  const allServers = useAllServers();
  
  const activeProject = getActiveProject();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    decision: true,
    constraint: true,
    risk: true,
  });

  const toggleSection = (type: string) => {
    setExpandedSections(prev => ({ ...prev, [type]: !prev[type] }));
  };

  // Get suggestions for active project
  const suggestions = activeProject ? suggestServersForProject(activeProject) : [];
  
  // Get deployed servers for this project
  const projectServers = allServers.filter(s => 
    // In real impl, servers would be tagged with project
    s.location === 'deployed'
  );

  // Calculate coverage (simplified)
  const totalDeltas = activeProject ? 
    Object.values(activeProject.deltas).flat().length : 0;
  const addressedCount = Math.floor(totalDeltas * 0.6); // Placeholder
  const coveragePercent = totalDeltas > 0 ? Math.round((addressedCount / totalDeltas) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-forge-text">Projects</h1>
          <p className="text-sm text-forge-text-secondary mt-1">
            MANTIC schema defines what you're building — deltas drive server suggestions
          </p>
        </div>
        <button className="forge-btn-secondary">
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Project selector & schema */}
        <div className="col-span-2 space-y-4">
          {/* Active project selector */}
          <div className="forge-card p-4">
            <div className="flex items-center gap-4">
              <label className="text-sm text-forge-text-muted">Active Project:</label>
              <select
                value={activeProjectName || ''}
                onChange={(e) => setActiveProject(e.target.value || null)}
                className="forge-select flex-1"
              >
                <option value="">Select a project...</option>
                {projects.map(p => (
                  <option key={p.identity.name} value={p.identity.name}>
                    {p.identity.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Project schema */}
          {activeProject ? (
            <div className="forge-card overflow-hidden">
              {/* Identity */}
              <div className="p-4 border-b border-forge-border bg-forge-surface-hover">
                <h2 className="font-medium text-forge-text text-lg">
                  {activeProject.identity.name}
                </h2>
                <p className="text-sm text-forge-text-secondary mt-1">
                  {activeProject.identity.mission}
                </p>
                {activeProject.identity.type && (
                  <span className="inline-block mt-2 forge-badge-default">
                    {activeProject.identity.type}
                  </span>
                )}
              </div>

              {/* Stack */}
              {activeProject.stack.length > 0 && (
                <div className="px-4 py-3 border-b border-forge-border">
                  <p className="text-xs text-forge-text-muted mb-2">Stack</p>
                  <div className="flex flex-wrap gap-1">
                    {activeProject.stack.map(tech => (
                      <span key={tech} className="forge-badge-accent">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Delta sections */}
              <div>
                <DeltaSection
                  type="decision"
                  deltas={activeProject.deltas.decisions}
                  expanded={expandedSections.decision}
                  onToggle={() => toggleSection('decision')}
                />
                <DeltaSection
                  type="requirement"
                  deltas={activeProject.deltas.requirements}
                  expanded={expandedSections.requirement}
                  onToggle={() => toggleSection('requirement')}
                />
                <DeltaSection
                  type="constraint"
                  deltas={activeProject.deltas.constraints}
                  expanded={expandedSections.constraint}
                  onToggle={() => toggleSection('constraint')}
                />
                <DeltaSection
                  type="risk"
                  deltas={activeProject.deltas.risks}
                  expanded={expandedSections.risk}
                  onToggle={() => toggleSection('risk')}
                />
                <DeltaSection
                  type="priority"
                  deltas={activeProject.deltas.priorities}
                  expanded={expandedSections.priority}
                  onToggle={() => toggleSection('priority')}
                />
                <DeltaSection
                  type="question"
                  deltas={activeProject.deltas.questions}
                  expanded={expandedSections.question}
                  onToggle={() => toggleSection('question')}
                />
                <DeltaSection
                  type="assumption"
                  deltas={activeProject.deltas.assumptions}
                  expanded={expandedSections.assumption}
                  onToggle={() => toggleSection('assumption')}
                />
              </div>

              {/* Meta */}
              <div className="px-4 py-3 bg-forge-bg text-xs text-forge-text-muted">
                Extracted: {new Date(activeProject.meta.extracted_at).toLocaleDateString()} • 
                Source: {activeProject.meta.source}
                {activeProject.meta.health_score && (
                  <> • Health: {Math.round(activeProject.meta.health_score * 100)}%</>
                )}
              </div>
            </div>
          ) : (
            <div className="forge-card flex flex-col items-center justify-center py-16">
              <div className="w-14 h-14 rounded-full bg-forge-surface border border-forge-border flex items-center justify-center mb-5">
                <Target className="w-6 h-6 text-forge-text-muted" />
              </div>
              <p className="text-sm text-forge-text-muted">
                Select a project to view its MANTIC schema.
              </p>
            </div>
          )}
        </div>

        {/* Right sidebar - Coverage & Suggestions */}
        <div className="space-y-4">
          {/* Delta Coverage */}
          {activeProject && (
            <div className="forge-card p-4">
              <h3 className="font-medium text-forge-text mb-4">Delta Coverage</h3>
              
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-forge-text-secondary">Overall</span>
                  <span className="text-forge-text">{coveragePercent}%</span>
                </div>
                <div className="h-2 bg-forge-bg rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-forge-accent transition-all"
                    style={{ width: `${coveragePercent}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2 text-sm">
                {(['decision', 'requirement', 'constraint', 'risk'] as const).map(type => {
                  const deltas = activeProject.deltas[`${type}s` as keyof typeof activeProject.deltas];
                  const count = deltas.length;
                  const addressed = Math.floor(count * 0.5); // Placeholder
                  return (
                    <div key={type} className="flex items-center gap-2">
                      <span className="text-forge-text-muted capitalize w-24">{type}s</span>
                      <div className="flex-1 h-1.5 bg-forge-bg rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${deltaColors[type].replace('text-', 'bg-')}`}
                          style={{ width: count > 0 ? `${(addressed / count) * 100}%` : '0%' }}
                        />
                      </div>
                      <span className="text-forge-text-muted text-xs w-12 text-right">
                        {addressed}/{count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Suggested Servers */}
          {activeProject && suggestions.length > 0 && (
            <div className="forge-card p-4">
              <h3 className="font-medium text-forge-text mb-3">Suggested Servers</h3>
              <p className="text-xs text-forge-text-muted mb-4">
                Based on your project's deltas
              </p>
              
              <div className="space-y-2">
                {suggestions.slice(0, 5).map(suggestion => (
                  <Link
                    key={suggestion.template}
                    to={`/build/${suggestion.template}`}
                    className="block p-3 rounded-lg border border-forge-border hover:border-forge-accent hover:bg-forge-accent-glow transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm text-forge-text group-hover:text-forge-accent">
                        {suggestion.display_name}
                      </span>
                      <ArrowRight className="w-3 h-3 text-forge-text-muted group-hover:text-forge-accent" />
                    </div>
                    <p className="text-xs text-forge-text-muted line-clamp-1">
                      {suggestion.reason}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="h-1 flex-1 bg-forge-bg rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-forge-accent"
                          style={{ width: `${suggestion.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-2xs text-forge-text-muted">
                        {Math.round(suggestion.confidence * 100)}%
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Deployed Servers */}
          {projectServers.length > 0 && (
            <div className="forge-card p-4">
              <h3 className="font-medium text-forge-text mb-3">Deployed Servers</h3>
              <div className="space-y-2">
                {projectServers.map(server => (
                  <Link
                    key={server.name}
                    to={`/server/${server.name}`}
                    className="flex items-center gap-3 p-2 rounded hover:bg-forge-surface-hover transition-colors"
                  >
                    <div className="w-2 h-2 rounded-full bg-forge-success" />
                    <span className="text-sm text-forge-text">{server.name}</span>
                    <span className="text-xs text-forge-text-muted ml-auto">
                      {server.tools.length} tools
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Unaddressed Deltas */}
          {activeProject && (
            <div className="forge-card p-4">
              <h3 className="font-medium text-forge-text mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-forge-warning" />
                Unaddressed Risks
              </h3>
              <div className="space-y-2">
                {activeProject.deltas.risks.slice(0, 3).map((risk, i) => (
                  <div key={i} className="p-2 bg-forge-bg rounded text-xs">
                    <p className="text-forge-text-secondary">{risk.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
