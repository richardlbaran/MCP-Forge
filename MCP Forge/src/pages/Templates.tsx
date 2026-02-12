import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  Plus,
  ArrowRight,
  Tag,
  FileText,
  Database,
  Globe,
  GitBranch,
  MessageSquare,
  FileSpreadsheet,
  Bug,
  Target,
  FolderOpen,
  Chrome,
  Brain,
  Clock,
  Mail,
  Layers,
} from 'lucide-react';
import { useAllTemplates } from '@/store';
import { getAllTags } from '@/lib/generator/templates';

export function Templates() {
  const templates = useAllTemplates();
  const allTags = getAllTags();
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const filteredTemplates = templates.filter((t) => {
    const matchesSearch =
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.display_name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());

    const matchesTag = !selectedTag || t.tags.includes(selectedTag);

    return matchesSearch && matchesTag;
  });

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-forge-text">Templates</h1>
          <p className="text-sm text-forge-text-secondary mt-1">
            Pre-configured MCP server templates ready to scaffold
          </p>
        </div>
        <Link to="/build" className="forge-btn-secondary">
          <Plus className="w-4 h-4" />
          Build Custom Server
        </Link>
      </div>

      {/* Search and filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forge-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates..."
            className="forge-input w-full pl-10"
          />
        </div>
      </div>

      {/* Tags */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setSelectedTag(null)}
          className={`forge-badge ${!selectedTag ? 'forge-badge-accent' : 'forge-badge-default'}`}
        >
          All
        </button>
        {allTags.map((tag) => (
          <button
            key={tag}
            onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
            className={`forge-badge ${
              selectedTag === tag ? 'forge-badge-accent' : 'forge-badge-default'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Template grid */}
      <div className="grid grid-cols-2 gap-4">
        {filteredTemplates.map((template, index) => (
          <motion.div
            key={template.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Link
              to={`/build/${template.name}`}
              className="forge-card-hover block p-4 group"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-forge-surface flex items-center justify-center shrink-0">
                  <TemplateIcon name={template.name} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-forge-text group-hover:text-forge-accent transition-colors">
                      {template.display_name}
                    </h3>
                    <ArrowRight className="w-4 h-4 text-forge-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-sm text-forge-text-secondary line-clamp-2 mb-3">
                    {template.description}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-forge-text-muted">
                    <span>{template.tools.length} tools</span>
                    <span>•</span>
                    <span>{template.variables.length} variables</span>
                    <span>•</span>
                    <span>v{template.version}</span>
                  </div>
                </div>
              </div>

              {/* Tools preview */}
              <div className="mt-4 pt-3 border-t border-forge-border">
                <div className="flex flex-wrap gap-1">
                  {template.tools.slice(0, 4).map((tool) => (
                    <span
                      key={tool.name}
                      className="px-2 py-0.5 bg-forge-bg rounded text-2xs font-mono text-forge-text-muted"
                    >
                      {tool.name}
                    </span>
                  ))}
                  {template.tools.length > 4 && (
                    <span className="px-2 py-0.5 text-2xs text-forge-text-muted">
                      +{template.tools.length - 4} more
                    </span>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div className="flex items-center gap-1 mt-3">
                <Tag className="w-3 h-3 text-forge-text-muted" />
                {template.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="text-2xs text-forge-text-muted"
                  >
                    {tag}
                    {template.tags.indexOf(tag) < Math.min(template.tags.length, 3) - 1 && ','}
                  </span>
                ))}
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-14 h-14 rounded-full bg-forge-surface border border-forge-border flex items-center justify-center mb-5">
            <Search className="w-6 h-6 text-forge-text-muted" />
          </div>
          <p className="text-sm text-forge-text-muted">
            No templates match your search.
          </p>
        </div>
      )}
    </div>
  );
}

function TemplateIcon({ name }: { name: string }) {
  const icons: Record<string, React.ElementType> = {
    _blank: FileText,
    supabase: Database,
    'api-wrapper': Globe,
    github: GitBranch,
    slack: MessageSquare,
    notion: FileSpreadsheet,
    'web-scraper': Globe,
    email: Mail,
    'gtm-hub': Target,
    'health-monitor': Bug,
    'mantic-extractor': Layers,
    'file-system': FolderOpen,
    'chrome-bridge': Chrome,
    'vector-db': Brain,
    scheduler: Clock,
  };
  const Icon = icons[name] || Layers;
  return <Icon className="w-5 h-5 text-forge-text-muted" />;
}
