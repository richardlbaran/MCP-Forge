import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Zap,
  Database,
  Shield,
  Server,
  Globe,
  Users,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Layers,
} from 'lucide-react';

// ===========================================
// TYPES
// ===========================================

interface BlueprintAnswer {
  questionId: string;
  value: string;
  label: string;
}

interface BlueprintOption {
  id: string;
  label: string;
  description: string;
  icon?: typeof Database;
  recommended?: boolean;
  tradeoffs?: { pros: string[]; cons: string[] };
  constraints?: string[];
}

interface BlueprintQuestion {
  id: string;
  phase: string;
  question: string;
  description?: string;
  type: 'single' | 'multi' | 'scale';
  options: BlueprintOption[];
  dependsOn?: { questionId: string; values: string[] };
}

interface BlueprintResult {
  architecture: string;
  database: string;
  auth: string;
  deployment: string;
  api: string;
  recommendations: string[];
  warnings: string[];
  suggestedTemplates: string[];
}

// ===========================================
// BLUEPRINT QUESTIONS
// ===========================================

const PHASES = [
  { id: 'foundation', name: 'Foundation', icon: Layers },
  { id: 'scale', name: 'Scale', icon: Users },
  { id: 'architecture', name: 'Architecture', icon: Server },
  { id: 'data', name: 'Data', icon: Database },
  { id: 'security', name: 'Security', icon: Shield },
];

const QUESTIONS: BlueprintQuestion[] = [
  // PHASE 1: FOUNDATION
  {
    id: 'stage',
    phase: 'foundation',
    question: 'What stage is your project?',
    description: 'This helps us recommend the right level of complexity',
    type: 'single',
    options: [
      { 
        id: 'idea', 
        label: 'Idea / Exploration', 
        description: 'Just figuring things out',
        constraints: ['Keep it simple', 'Validate before building'],
      },
      { 
        id: 'mvp', 
        label: 'MVP', 
        description: 'Building first version to test with users',
        recommended: true,
        constraints: ['Speed over perfection', 'Monolith is fine'],
      },
      { 
        id: 'v1', 
        label: 'v1 / Production', 
        description: 'Real users, real data, needs to be solid',
        constraints: ['Reliability matters', 'Consider scaling'],
      },
      { 
        id: 'scaling', 
        label: 'Scaling', 
        description: 'Growing fast, hitting limits',
        constraints: ['Performance critical', 'May need to break apart'],
      },
    ],
  },
  {
    id: 'audience',
    phase: 'foundation',
    question: 'Who is this for?',
    type: 'single',
    options: [
      { 
        id: 'b2c', 
        label: 'B2C (Consumers)', 
        description: 'Individual users, public signup',
        constraints: ['Social auth important', 'Scale unpredictable'],
      },
      { 
        id: 'b2b', 
        label: 'B2B (Businesses)', 
        description: 'Companies as customers',
        constraints: ['Multi-tenancy needed', 'SSO may be required'],
      },
      { 
        id: 'internal', 
        label: 'Internal Tool', 
        description: 'For your team/company only',
        constraints: ['Simpler auth OK', 'Known user count'],
      },
      { 
        id: 'api', 
        label: 'API / Platform', 
        description: 'Developers building on your platform',
        constraints: ['API design critical', 'Rate limiting needed'],
      },
    ],
  },
  {
    id: 'team_size',
    phase: 'foundation',
    question: 'Team size?',
    type: 'single',
    options: [
      { 
        id: 'solo', 
        label: 'Solo', 
        description: 'Just you',
        recommended: true,
        constraints: ['Minimize complexity', 'Use managed services'],
      },
      { 
        id: 'small', 
        label: '2-5 people', 
        description: 'Small team',
        constraints: ['Monolith still fine', 'Clear ownership'],
      },
      { 
        id: 'medium', 
        label: '5-20 people', 
        description: 'Growing team',
        constraints: ['Consider modular monolith', 'Define boundaries'],
      },
      { 
        id: 'large', 
        label: '20+ people', 
        description: 'Large team',
        constraints: ['Microservices may help', 'Conway\'s Law applies'],
      },
    ],
  },
  {
    id: 'timeline',
    phase: 'foundation',
    question: 'Timeline?',
    type: 'single',
    options: [
      { 
        id: 'days', 
        label: 'Days', 
        description: 'Ship this week',
        constraints: ['Use what you know', 'No new tech'],
      },
      { 
        id: 'weeks', 
        label: 'Weeks', 
        description: '2-4 weeks',
        recommended: true,
        constraints: ['Some learning OK', 'Keep scope tight'],
      },
      { 
        id: 'months', 
        label: 'Months', 
        description: '1-3 months',
        constraints: ['Can build properly', 'Invest in foundation'],
      },
      { 
        id: 'ongoing', 
        label: 'Ongoing', 
        description: 'Long-term project',
        constraints: ['Build for change', 'Documentation matters'],
      },
    ],
  },

  // PHASE 2: SCALE
  {
    id: 'users_launch',
    phase: 'scale',
    question: 'Expected users at launch?',
    type: 'single',
    options: [
      { id: 'tens', label: '10s', description: 'Small pilot group' },
      { id: 'hundreds', label: '100s', description: 'Early adopters', recommended: true },
      { id: 'thousands', label: '1,000s', description: 'Significant launch' },
      { id: 'massive', label: '10,000+', description: 'Viral/enterprise scale' },
    ],
  },
  {
    id: 'traffic_pattern',
    phase: 'scale',
    question: 'Traffic pattern?',
    type: 'single',
    options: [
      { 
        id: 'steady', 
        label: 'Steady', 
        description: 'Consistent throughout day',
        constraints: ['Standard scaling fine'],
      },
      { 
        id: 'spiky', 
        label: 'Spiky', 
        description: 'Unpredictable bursts',
        constraints: ['Auto-scaling needed', 'Consider serverless'],
      },
      { 
        id: 'predictable', 
        label: 'Predictable peaks', 
        description: 'Known busy times (9-5, events)',
        constraints: ['Scheduled scaling OK'],
      },
    ],
  },
  {
    id: 'realtime',
    phase: 'scale',
    question: 'Real-time features needed?',
    description: 'Live updates, chat, collaboration',
    type: 'single',
    options: [
      { id: 'no', label: 'No', description: 'Standard request/response' },
      { id: 'nice', label: 'Nice to have', description: 'Would improve UX' },
      { 
        id: 'critical', 
        label: 'Critical', 
        description: 'Core to the product',
        constraints: ['WebSocket/SSE needed', 'Consider Supabase Realtime'],
      },
    ],
  },

  // PHASE 3: ARCHITECTURE
  {
    id: 'architecture',
    phase: 'architecture',
    question: 'Application architecture?',
    type: 'single',
    options: [
      { 
        id: 'monolith', 
        label: 'Monolith', 
        description: 'Single deployable unit',
        icon: Server,
        recommended: true,
        tradeoffs: {
          pros: ['Simple deployment', 'Easy debugging', 'No network latency'],
          cons: ['Scales as one unit', 'Tech lock-in'],
        },
      },
      { 
        id: 'modular', 
        label: 'Modular Monolith', 
        description: 'Single deploy, strict boundaries',
        icon: Layers,
        tradeoffs: {
          pros: ['Organized', 'Can split later', 'Best of both'],
          cons: ['Requires discipline', 'Still one deploy'],
        },
      },
      { 
        id: 'serverless', 
        label: 'Serverless', 
        description: 'Functions triggered by events',
        icon: Zap,
        tradeoffs: {
          pros: ['Scale to zero', 'No servers', 'Pay per use'],
          cons: ['Cold starts', 'Vendor lock-in', 'Stateless only'],
        },
      },
      { 
        id: 'microservices', 
        label: 'Microservices', 
        description: 'Multiple independent services',
        icon: Globe,
        tradeoffs: {
          pros: ['Independent scaling', 'Tech flexibility', 'Team autonomy'],
          cons: ['Complex', 'Network issues', 'Operational overhead'],
        },
      },
    ],
  },
  {
    id: 'frontend',
    phase: 'architecture',
    question: 'Frontend approach?',
    type: 'single',
    options: [
      { 
        id: 'ssr', 
        label: 'Server-Side Rendering (SSR)', 
        description: 'HTML rendered on server',
        recommended: true,
        tradeoffs: {
          pros: ['Great SEO', 'Fast first paint', 'Works without JS'],
          cons: ['Server per request', 'Hydration complexity'],
        },
      },
      { 
        id: 'spa', 
        label: 'Single Page App (SPA)', 
        description: 'JS app in browser',
        tradeoffs: {
          pros: ['App-like feel', 'Offline capable', 'Clear separation'],
          cons: ['Poor SEO', 'Slow initial load', 'JS required'],
        },
      },
      { 
        id: 'static', 
        label: 'Static (SSG)', 
        description: 'Pre-rendered at build',
        tradeoffs: {
          pros: ['Fastest', 'Free hosting', 'Perfect SEO'],
          cons: ['Build for changes', 'No personalization'],
        },
      },
      { 
        id: 'hybrid', 
        label: 'Hybrid', 
        description: 'Mix of SSR, SPA, and static',
        tradeoffs: {
          pros: ['Best of all worlds', 'Flexible'],
          cons: ['More complex', 'Multiple patterns'],
        },
      },
    ],
  },
  {
    id: 'api_style',
    phase: 'architecture',
    question: 'API style?',
    type: 'single',
    options: [
      { 
        id: 'rest', 
        label: 'REST', 
        description: 'Resource-based URLs, HTTP verbs',
        recommended: true,
        tradeoffs: {
          pros: ['Universal', 'Cacheable', 'Simple'],
          cons: ['Over/under-fetching', 'Multiple roundtrips'],
        },
      },
      { 
        id: 'graphql', 
        label: 'GraphQL', 
        description: 'Query language, client specifies data',
        tradeoffs: {
          pros: ['Exact data needed', 'Typed', 'Single endpoint'],
          cons: ['Complex caching', 'N+1 risk', 'Learning curve'],
        },
      },
      { 
        id: 'trpc', 
        label: 'tRPC', 
        description: 'End-to-end TypeScript type safety',
        tradeoffs: {
          pros: ['Full type safety', 'Great DX', 'No codegen'],
          cons: ['TypeScript only', 'Tight coupling'],
        },
      },
    ],
  },

  // PHASE 4: DATA
  {
    id: 'database',
    phase: 'data',
    question: 'Primary database?',
    type: 'single',
    options: [
      { 
        id: 'postgres', 
        label: 'PostgreSQL', 
        description: 'Relational, feature-rich, ACID',
        icon: Database,
        recommended: true,
        tradeoffs: {
          pros: ['Full ACID', 'Extensions (pgvector)', 'JSON support', 'RLS'],
          cons: ['Vertical scaling', 'Schema migrations'],
        },
      },
      { 
        id: 'mysql', 
        label: 'MySQL', 
        description: 'Relational, widely deployed',
        icon: Database,
        tradeoffs: {
          pros: ['Fast reads', 'Widely known', 'Good replication'],
          cons: ['Less features than Postgres', 'JSON not as good'],
        },
      },
      { 
        id: 'mongodb', 
        label: 'MongoDB', 
        description: 'Document store, flexible schema',
        icon: Database,
        tradeoffs: {
          pros: ['Schema flexibility', 'Horizontal scaling'],
          cons: ['No ACID (improving)', 'Joins expensive', 'Often misused'],
        },
      },
      { 
        id: 'sqlite', 
        label: 'SQLite', 
        description: 'Embedded, single file',
        icon: Database,
        tradeoffs: {
          pros: ['Zero config', 'Fast', 'Turso for distributed'],
          cons: ['Single writer', 'Not for multi-user web'],
        },
      },
    ],
  },
  {
    id: 'db_hosting',
    phase: 'data',
    question: 'Database hosting?',
    type: 'single',
    options: [
      { 
        id: 'supabase', 
        label: 'Supabase', 
        description: 'Managed Postgres + Auth + Realtime',
        recommended: true,
        tradeoffs: {
          pros: ['Full platform', 'Free tier', 'Great DX', 'RLS built-in'],
          cons: ['Vendor lock-in', 'May outgrow'],
        },
      },
      { 
        id: 'planetscale', 
        label: 'PlanetScale', 
        description: 'Serverless MySQL with branching',
        tradeoffs: {
          pros: ['DB branching', 'Serverless', 'Great scaling'],
          cons: ['MySQL only', 'No foreign keys'],
        },
      },
      { 
        id: 'neon', 
        label: 'Neon', 
        description: 'Serverless Postgres with branching',
        tradeoffs: {
          pros: ['Postgres', 'Branching', 'Scale to zero'],
          cons: ['Newer', 'Cold starts'],
        },
      },
      { 
        id: 'rds', 
        label: 'AWS RDS / Cloud SQL', 
        description: 'Managed by cloud provider',
        tradeoffs: {
          pros: ['Full control', 'Enterprise ready'],
          cons: ['More config', 'Always running cost'],
        },
      },
    ],
  },
  {
    id: 'multi_tenant',
    phase: 'data',
    question: 'Multi-tenancy approach?',
    type: 'single',
    options: [
      { 
        id: 'shared_schema', 
        label: 'Shared schema (org_id)', 
        description: 'All tenants in same tables',
        recommended: true,
        tradeoffs: {
          pros: ['Simple', 'Cost efficient', 'Easy queries'],
          cons: ['Data leak risk', 'RLS critical'],
        },
      },
      { 
        id: 'schema_per_tenant', 
        label: 'Schema per tenant', 
        description: 'Each tenant gets own schema',
        tradeoffs: {
          pros: ['Better isolation', 'Per-tenant customization'],
          cons: ['Migration complexity', 'Connection routing'],
        },
      },
      { 
        id: 'db_per_tenant', 
        label: 'Database per tenant', 
        description: 'Complete isolation',
        tradeoffs: {
          pros: ['Full isolation', 'Compliance friendly'],
          cons: ['Expensive', 'Operational overhead'],
        },
      },
    ],
  },

  // PHASE 5: SECURITY
  {
    id: 'auth_method',
    phase: 'security',
    question: 'Authentication method?',
    type: 'single',
    options: [
      { 
        id: 'oauth', 
        label: 'OAuth / Social Login', 
        description: 'Google, GitHub, etc.',
        recommended: true,
        tradeoffs: {
          pros: ['No password management', 'Users trust it', 'Easy'],
          cons: ['Provider dependency', 'Less control'],
        },
      },
      { 
        id: 'email_password', 
        label: 'Email + Password', 
        description: 'Traditional login',
        tradeoffs: {
          pros: ['No dependencies', 'Full control'],
          cons: ['Password resets', 'Security burden'],
        },
      },
      { 
        id: 'passwordless', 
        label: 'Passwordless / Magic Links', 
        description: 'Email link to login',
        tradeoffs: {
          pros: ['No password to steal', 'Great UX'],
          cons: ['Email dependency', 'User education'],
        },
      },
      { 
        id: 'enterprise_sso', 
        label: 'Enterprise SSO', 
        description: 'SAML, OIDC for companies',
        tradeoffs: {
          pros: ['Enterprise requirement', 'User management offloaded'],
          cons: ['Complex setup', 'Per-customer config'],
        },
      },
    ],
  },
  {
    id: 'auth_provider',
    phase: 'security',
    question: 'Auth provider?',
    type: 'single',
    options: [
      { 
        id: 'supabase_auth', 
        label: 'Supabase Auth', 
        description: 'Built into Supabase',
        recommended: true,
        tradeoffs: {
          pros: ['Free', 'RLS integration', 'Simple'],
          cons: ['Tied to Supabase'],
        },
      },
      { 
        id: 'clerk', 
        label: 'Clerk', 
        description: 'Full-featured auth platform',
        tradeoffs: {
          pros: ['Beautiful UI', 'Full featured', 'Great DX'],
          cons: ['Cost at scale', 'Another vendor'],
        },
      },
      { 
        id: 'auth0', 
        label: 'Auth0', 
        description: 'Enterprise auth platform',
        tradeoffs: {
          pros: ['Enterprise features', 'SSO support'],
          cons: ['Complex', 'Expensive'],
        },
      },
      { 
        id: 'custom', 
        label: 'Custom / NextAuth', 
        description: 'Roll your own',
        tradeoffs: {
          pros: ['Full control', 'No vendor'],
          cons: ['Security risk', 'Maintenance'],
        },
      },
    ],
  },
  {
    id: 'compliance',
    phase: 'security',
    question: 'Compliance requirements?',
    type: 'single',
    options: [
      { id: 'none', label: 'None', description: 'No specific requirements', recommended: true },
      { 
        id: 'gdpr', 
        label: 'GDPR', 
        description: 'EU data protection',
        constraints: ['Data deletion', 'Consent tracking', 'EU hosting option'],
      },
      { 
        id: 'hipaa', 
        label: 'HIPAA', 
        description: 'Healthcare data',
        constraints: ['Encryption everywhere', 'Audit logs', 'BAA required'],
      },
      { 
        id: 'soc2', 
        label: 'SOC 2', 
        description: 'Enterprise security audit',
        constraints: ['Access controls', 'Monitoring', 'Policies'],
      },
    ],
  },
];

// ===========================================
// RESULT CALCULATION
// ===========================================

function calculateResult(answers: BlueprintAnswer[]): BlueprintResult {
  const getAnswer = (id: string) => answers.find(a => a.questionId === id)?.value;
  
  const stage = getAnswer('stage');
  const audience = getAnswer('audience');
  const teamSize = getAnswer('team_size');
  const architecture = getAnswer('architecture');
  const database = getAnswer('database');
  const dbHosting = getAnswer('db_hosting');
  const auth = getAnswer('auth_method');
  const authProvider = getAnswer('auth_provider');
  const realtime = getAnswer('realtime');
  const compliance = getAnswer('compliance');
  
  const recommendations: string[] = [];
  const warnings: string[] = [];
  const suggestedTemplates: string[] = [];

  // Architecture recommendations
  if (stage === 'idea' || stage === 'mvp') {
    if (architecture === 'microservices') {
      warnings.push('Microservices is overkill for MVP. Consider monolith first.');
    }
    recommendations.push('Keep it simple. Ship fast, learn, iterate.');
  }

  if (teamSize === 'solo' && architecture === 'microservices') {
    warnings.push('Solo + Microservices is a recipe for burnout. Strongly consider monolith.');
  }

  // Database recommendations
  if (database === 'postgres') {
    recommendations.push('PostgreSQL is excellent choice. Use JSONB for flexible fields.');
    suggestedTemplates.push('supabase-database');
  }

  if (dbHosting === 'supabase') {
    recommendations.push('Supabase gives you Postgres + Auth + Realtime + Storage in one.');
    if (authProvider !== 'supabase_auth') {
      recommendations.push('Consider using Supabase Auth since you\'re already on Supabase.');
    }
  }

  // Multi-tenancy
  if (audience === 'b2b') {
    recommendations.push('Implement multi-tenancy with org_id on every table + RLS policies.');
    suggestedTemplates.push('supabase-database');
  }

  // Real-time
  if (realtime === 'critical') {
    recommendations.push('Use Supabase Realtime or dedicated WebSocket solution.');
    if (dbHosting !== 'supabase') {
      warnings.push('Real-time with non-Supabase DB requires separate pub/sub setup.');
    }
  }

  // Auth recommendations
  if (auth === 'oauth') {
    recommendations.push('Start with Google + GitHub OAuth. Add more providers as needed.');
  }

  if (audience === 'b2b' && auth !== 'enterprise_sso') {
    recommendations.push('B2B customers often require SSO. Plan for it even if not building now.');
  }

  // Compliance
  if (compliance === 'hipaa') {
    warnings.push('HIPAA requires BAA with all vendors. Verify Supabase/hosting compliance.');
    recommendations.push('Enable audit logging for all data access.');
    recommendations.push('Encrypt data at rest and in transit.');
  }

  // Template suggestions based on answers
  suggestedTemplates.push('code-generator');
  suggestedTemplates.push('doc-generator');
  
  if (audience === 'api') {
    suggestedTemplates.push('rest-api-wrapper');
  }

  if (realtime === 'critical') {
    suggestedTemplates.push('content-scheduler');
  }

  return {
    architecture: architecture || 'monolith',
    database: `${database || 'postgres'} on ${dbHosting || 'supabase'}`,
    auth: `${auth || 'oauth'} via ${authProvider || 'supabase_auth'}`,
    deployment: stage === 'scaling' ? 'Containers/K8s' : 'PaaS (Vercel/Railway)',
    api: getAnswer('api_style') || 'rest',
    recommendations,
    warnings,
    suggestedTemplates: [...new Set(suggestedTemplates)],
  };
}

// ===========================================
// COMPONENTS
// ===========================================

function ProgressBar({ currentPhase, phases }: { currentPhase: string; phases: typeof PHASES }) {
  const currentIndex = phases.findIndex(p => p.id === currentPhase);
  
  return (
    <div className="flex items-center justify-between mb-8">
      {phases.map((phase, index) => {
        const Icon = phase.icon;
        const isComplete = index < currentIndex;
        const isCurrent = index === currentIndex;
        
        return (
          <div key={phase.id} className="flex items-center">
            <div className={`
              flex items-center gap-2 px-3 py-2 rounded-lg transition-colors
              ${isComplete ? 'bg-forge-success/20 text-forge-success' : ''}
              ${isCurrent ? 'bg-forge-accent/20 text-forge-accent' : ''}
              ${!isComplete && !isCurrent ? 'bg-forge-surface text-forge-text-muted' : ''}
            `}>
              {isComplete ? (
                <Check className="w-4 h-4" />
              ) : (
                <Icon className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">{phase.name}</span>
            </div>
            {index < phases.length - 1 && (
              <div className={`w-8 h-0.5 mx-2 ${index < currentIndex ? 'bg-forge-success' : 'bg-forge-surface'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function OptionCard({ 
  option, 
  selected, 
  onClick 
}: { 
  option: BlueprintOption; 
  selected: boolean;
  onClick: () => void;
}) {
  const Icon = option.icon;
  
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={`
        relative p-4 rounded-xl text-left transition-all
        ${selected 
          ? 'bg-forge-accent/20 border-2 border-forge-accent' 
          : 'bg-forge-surface/50 border-2 border-forge-border hover:border-forge-accent/50'
        }
      `}
    >
      {option.recommended && !selected && (
        <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-forge-success text-forge-text text-2xs rounded-full">
          Recommended
        </span>
      )}
      
      <div className="flex items-start gap-3">
        {Icon && (
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selected ? 'bg-forge-accent/30' : 'bg-forge-surface'}`}>
            <Icon className={`w-5 h-5 ${selected ? 'text-forge-accent' : 'text-forge-text-muted'}`} />
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className={`font-medium ${selected ? 'text-forge-accent' : 'text-forge-text'}`}>
              {option.label}
            </h4>
            {selected && <Check className="w-4 h-4 text-forge-accent" />}
          </div>
          <p className="text-sm text-forge-text-muted mt-1">{option.description}</p>
          
          {option.tradeoffs && (
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div>
                {option.tradeoffs.pros.slice(0, 2).map((pro, i) => (
                  <div key={i} className="flex items-center gap-1 text-forge-success">
                    <Check className="w-3 h-3" />
                    {pro}
                  </div>
                ))}
              </div>
              <div>
                {option.tradeoffs.cons.slice(0, 2).map((con, i) => (
                  <div key={i} className="flex items-center gap-1 text-forge-error">
                    <AlertTriangle className="w-3 h-3" />
                    {con}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.button>
  );
}

function ResultsView({ 
  result, 
  onStartOver,
  onContinue 
}: { 
  result: BlueprintResult;
  onStartOver: () => void;
  onContinue: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-forge-success/20 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-forge-success" />
        </div>
        <h2 className="text-2xl font-bold text-forge-text">Your Blueprint is Ready</h2>
        <p className="text-forge-text-muted mt-2">Based on your answers, here's your recommended stack</p>
      </div>

      {/* Stack Overview */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-forge-surface border border-forge-border">
          <div className="flex items-center gap-2 text-forge-text-muted text-sm mb-2">
            <Server className="w-4 h-4" />
            Architecture
          </div>
          <p className="text-forge-text font-medium capitalize">{result.architecture}</p>
        </div>
        <div className="p-4 rounded-xl bg-forge-surface border border-forge-border">
          <div className="flex items-center gap-2 text-forge-text-muted text-sm mb-2">
            <Database className="w-4 h-4" />
            Database
          </div>
          <p className="text-forge-text font-medium">{result.database}</p>
        </div>
        <div className="p-4 rounded-xl bg-forge-surface border border-forge-border">
          <div className="flex items-center gap-2 text-forge-text-muted text-sm mb-2">
            <Shield className="w-4 h-4" />
            Authentication
          </div>
          <p className="text-forge-text font-medium">{result.auth}</p>
        </div>
        <div className="p-4 rounded-xl bg-forge-surface border border-forge-border">
          <div className="flex items-center gap-2 text-forge-text-muted text-sm mb-2">
            <Globe className="w-4 h-4" />
            Deployment
          </div>
          <p className="text-forge-text font-medium">{result.deployment}</p>
        </div>
      </div>

      {/* Warnings */}
      {result.warnings.length > 0 && (
        <div className="p-4 rounded-xl bg-forge-error/10 border border-forge-error/30">
          <h3 className="text-forge-error font-medium mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Warnings
          </h3>
          <ul className="space-y-1">
            {result.warnings.map((warning, i) => (
              <li key={i} className="text-sm text-forge-error">• {warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {result.recommendations.length > 0 && (
        <div className="p-4 rounded-xl bg-forge-surface border border-forge-border">
          <h3 className="text-forge-text font-medium mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-forge-accent" />
            Recommendations
          </h3>
          <ul className="space-y-2">
            {result.recommendations.map((rec, i) => (
              <li key={i} className="text-sm text-forge-text-secondary flex items-start gap-2">
                <Check className="w-4 h-4 text-forge-success mt-0.5 shrink-0" />
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggested Templates */}
      <div className="p-4 rounded-xl bg-forge-accent/10 border border-forge-accent/30">
        <h3 className="text-forge-accent font-medium mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4" />
          Suggested MCP Servers to Build
        </h3>
        <div className="flex flex-wrap gap-2">
          {result.suggestedTemplates.map((templateId) => (
            <span key={templateId} className="px-3 py-1.5 bg-forge-accent/20 text-forge-accent rounded-lg text-sm">
              {templateId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 pt-4">
        <button
          onClick={onStartOver}
          className="px-4 py-2 text-forge-text-muted hover:text-forge-text transition-colors"
        >
          Start Over
        </button>
        <button
          onClick={onContinue}
          className="flex-1 px-6 py-3 bg-forge-accent hover:bg-forge-accent/80 text-forge-text rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
        >
          Build These Servers
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ===========================================
// MAIN COMPONENT
// ===========================================

interface BlueprintWizardProps {
  onComplete: (result: BlueprintResult) => void;
  onCancel: () => void;
}

export function BlueprintWizard({ onComplete, onCancel }: BlueprintWizardProps) {
  const [answers, setAnswers] = useState<BlueprintAnswer[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);

  // Filter questions based on dependencies
  const activeQuestions = QUESTIONS.filter(q => {
    if (!q.dependsOn) return true;
    const dependentAnswer = answers.find(a => a.questionId === q.dependsOn!.questionId);
    return dependentAnswer && q.dependsOn.values.includes(dependentAnswer.value);
  });

  const currentQuestion = activeQuestions[currentQuestionIndex];
  const currentPhase = currentQuestion?.phase || 'foundation';
  const progress = ((currentQuestionIndex + 1) / activeQuestions.length) * 100;

  const handleAnswer = (option: BlueprintOption) => {
    const newAnswers = answers.filter(a => a.questionId !== currentQuestion.id);
    newAnswers.push({
      questionId: currentQuestion.id,
      value: option.id,
      label: option.label,
    });
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < activeQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setShowResults(true);
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleStartOver = () => {
    setAnswers([]);
    setCurrentQuestionIndex(0);
    setShowResults(false);
  };

  const currentAnswer = answers.find(a => a.questionId === currentQuestion?.id);

  if (showResults) {
    const result = calculateResult(answers);
    return (
      <div className="max-w-2xl mx-auto">
        <ResultsView 
          result={result} 
          onStartOver={handleStartOver}
          onContinue={() => onComplete(result)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 text-forge-text-muted hover:text-forge-text transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Exit Wizard
        </button>
        <span className="text-sm text-forge-text-muted">
          {currentQuestionIndex + 1} of {activeQuestions.length}
        </span>
      </div>

      {/* Progress */}
      <ProgressBar currentPhase={currentPhase} phases={PHASES} />

      {/* Progress bar */}
      <div className="h-1 bg-forge-surface rounded-full mb-8 overflow-hidden">
        <motion.div
          className="h-full bg-forge-accent"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <h2 className="text-2xl font-bold text-forge-text mb-2">{currentQuestion.question}</h2>
          {currentQuestion.description && (
            <p className="text-forge-text-muted mb-6">{currentQuestion.description}</p>
          )}

          <div className="space-y-3">
            {currentQuestion.options.map((option) => (
              <OptionCard
                key={option.id}
                option={option}
                selected={currentAnswer?.value === option.id}
                onClick={() => handleAnswer(option)}
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8">
        <button
          onClick={handleBack}
          disabled={currentQuestionIndex === 0}
          className="px-4 py-2 text-forge-text-muted hover:text-forge-text disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={!currentAnswer}
          className="px-6 py-3 bg-forge-accent hover:bg-forge-accent/80 disabled:bg-forge-surface disabled:cursor-not-allowed text-forge-text rounded-xl font-medium flex items-center gap-2 transition-colors"
        >
          {currentQuestionIndex === activeQuestions.length - 1 ? 'See Results' : 'Continue'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
