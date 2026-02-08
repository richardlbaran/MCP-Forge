# MCP Forge v2.1

**The Factory That Builds Factories**

A personal forge for rapidly creating, testing, and deploying MCP (Model Context Protocol) servers. Built for developers who want Claude to be able to do *anything*.

## Philosophy

This is infrastructure, not a product. MANTIC schema is the foundation—not a feature.

**ContextCommand defines WHAT you're building (the schema)**
**MCP Forge builds HOW Claude helps you build it (the factory)**
**MANTIC is the language both speak (the protocol)**

Every architectural decision optimizes for:

1. **Speed of iteration** — idea to working server in under 5 minutes
2. **Pattern compounding** — each project makes the next one easier
3. **Self-reference** — Claude can interact with the forge itself
4. **Delta-driven** — the forge thinks in MANTIC
5. **Local sovereignty** — you own everything

## Quick Start

```bash
# Install dependencies
npm install

# Start the dashboard
npm run dev

# Start the forge's MCP server (for Claude)
npm run serve
```

## Architecture

```
mcp-forge/
├── src/
│   ├── components/         # UI components
│   ├── pages/
│   │   ├── Projects.tsx    # PRIMARY — MANTIC schema view
│   │   ├── Dashboard.tsx   # Server overview
│   │   ├── Build.tsx       # Server builder wizard
│   │   ├── Test.tsx        # MCP test harness
│   │   └── Templates.tsx   # Template browser
│   ├── store/
│   │   ├── projects.ts     # MANTIC project schemas
│   │   ├── forge.ts        # Server state
│   │   └── testing.ts      # Test harness state
│   ├── lib/
│   │   ├── mantic/         # FOUNDATION — MANTIC types & logic
│   │   ├── generator/      # Code generation (injects PROJECT_SCHEMA)
│   │   ├── mcp-client/     # Built-in test client
│   │   └── file-system/    # Workspace management
│   └── mcp-server/         # Forge's own MCP server
├── templates/              # Server templates (with MANTIC triggers)
├── workspace/              # WIP servers (git-ignored)
├── servers/                # Production servers
└── forge.yaml              # Master configuration
```

## Key Concepts

### Projects Page (Primary Navigation)

The forge thinks in MANTIC. The Projects page shows:
- **Identity**: What you're building
- **Deltas**: Decisions, requirements, constraints, risks, priorities
- **Stack**: Technologies in use
- **Coverage**: What deltas are addressed by deployed servers
- **Suggestions**: Templates that match your project's deltas

### Delta-Driven Suggestions

Templates declare what deltas they address:
```yaml
name: supabase
addresses:
  decisions: ["Supabase", "PostgreSQL", "database"]
  constraints: ["row-level security", "RLS"]
  risks: ["database access", "query performance"]
triggers:
  - decision_contains: "supabase"
  - stack_includes: "Supabase"
```

When you select a project, the forge suggests templates that match.

### PROJECT_SCHEMA Injection

Every generated server knows its project:
```typescript
const PROJECT_SCHEMA = {
  identity: { name: "ContextCommand", mission: "..." },
  deltas: {
    decisions: [{ content: "Using Supabase", confidence: 0.92 }],
    constraints: [{ content: "No data leaves user control", confidence: 0.98 }],
    risks: [{ content: "User adoption friction", confidence: 0.75 }]
  },
  stack: ["React", "TypeScript", "Supabase"]
};

// Tools can now reason about constraints
function violatesConstraint(action) { ... }
```

### Forge's Own MCP Server

Claude can interact with the forge directly:
```
> get_project_schema              # Get active project's MANTIC schema
> suggest_servers                 # Get suggestions based on deltas  
> analyze_coverage                # Check what deltas are addressed
> scaffold_server template="supabase" name="my-db" project="ContextCommand"
> test_tool server="my-db" tool="query" params={...}
> promote_server name="my-db"
```

## Template Library

| Template | Addresses | Triggers |
|----------|-----------|----------|
| `supabase` | database decisions, RLS constraints | decision_contains: "supabase" |
| `gtm-hub` | launch priorities, adoption risks | priority_contains: "launch" |
| `health-monitor` | code quality risks, tech debt | risk_contains: "technical debt" |
| `mantic-extractor` | MANTIC decisions | decision_contains: "mantic" |
| `chrome-bridge` | Chrome extension decisions | stack_includes: "Chrome Extension" |
| `file-system` | offline constraints | constraint_contains: "offline" |
| `api-wrapper` | API integration decisions | decision_contains: "api" |

## Configuration (forge.yaml)

```yaml
forge:
  name: "Rich's Forge"
  version: "2.1.0"

# The foundation
schema:
  protocol: mantic
  version: "1.0"
  projects_path: ~/Projects/contextcommand/projects
  auto_inject: true
  min_confidence: 0.5

paths:
  workspace: ./workspace
  servers: ./servers
  templates: ./templates

mcp_server:
  enabled: true
  name: "mcp-forge"
  port: 3100
  expose_tools:
    - get_project_schema
    - suggest_servers
    - analyze_coverage
    - scaffold_server
    - test_tool
    - promote_server
```

## The Mental Model

| Before (v2.0) | After (v2.1) |
|---------------|--------------|
| ContextCommand bridge is optional | MANTIC schema is foundational |
| Projects are implicit | Projects page is primary navigation |
| Templates are generic | Templates declare what deltas they address |
| Servers get "context" injected | Servers get full PROJECT_SCHEMA |
| Dashboard shows servers | Dashboard shows delta coverage |
| Suggestions are template-based | Suggestions are delta-driven |

## Fleet Command

Real-time worker management dashboard for monitoring and controlling MCP server workers.

### Features

- **Live worker status monitoring** — See all workers in a responsive grid with real-time status updates
- **Task queue management** — Submit, monitor, and cancel tasks with progress tracking
- **Real-time log streaming** — Subscribe to worker logs with auto-scroll and filtering
- **Command palette (⌘K)** — Quick actions for spawning workers, submitting tasks, and more
- **Fleet minimap** — Bird's-eye view of all workers and their states

### Running Fleet Command

```bash
# 1. Start the Fleet WebSocket server
npm run fleet:server

# 2. Start the dashboard (in another terminal)
npm run dev

# 3. Navigate to the Fleet page in your browser
```

The Fleet server runs on `ws://localhost:3001/fleet` by default.

See [docs/fleet-command.md](docs/fleet-command.md) for comprehensive documentation.

---

## Development

```bash
# Run dashboard
npm run dev

# Run forge MCP server  
npm run serve

# Run Fleet server
npm run fleet:server

# Build everything
npm run build
```

## The Vision

By the end of 2026: Think "I need Claude to do X" → working MCP server in under 5 minutes.

By 2027: Claude builds its own tools through the forge with minimal guidance.

---

**ContextCommand defines WHAT. MCP Forge builds HOW. MANTIC is the language.**

Build the forge. Build the future.
