# Forge Design Bot — Self-Improving MCP Server

A design bot that proposes, reviews, and iterates on UI/UX improvements to MCP Forge — with human approval gates that prevent endless loops and a persistent design memory that gets smarter every session.

## How It Works

```
You: "Improve the Fleet Command empty states"
           │
           ▼
┌─────────────────────────┐
│  START SESSION           │
│  Load design memory      │
│  Read files in scope     │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  PROPOSE (iteration 1)   │◄──── Design memory constrains proposals
│  Generate improvement    │      Rejected patterns are auto-blocked
│  Self-critique           │
└────────┬────────────────┘
         │
         ▼  Confidence ≥ 0.85 OR iteration limit hit?
         │
    ┌────┴────┐
    │ YES     │ NO ──► Iterate again (up to limit)
    ▼         │
┌─────────────────────────┐
│  ★ HUMAN GATE ★         │
│                          │
│  [Approve] → Apply + learn what you like
│  [Reject]  → Log reason + learn what to avoid
│  [Revise]  → Feedback + more iterations (bounded)
│                          │
└──────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│  UPDATE DESIGN MEMORY    │
│  Approved → "do more of this"
│  Rejected → "never do this again"
│  Session learnings logged │
└──────────────────────────┘
```

## Hard Limits (Non-Negotiable)

| Limit | Value | Purpose |
|-------|-------|---------|
| Max iterations before gate | 3 | Forces human review regularly |
| Absolute max iterations | 10 | Even with "continue", it stops here |
| Confidence stop threshold | 0.85 | High-confidence = stop and ask human |
| Minimum proposal confidence | 0.50 | Don't show garbage proposals |
| Max files per proposal | 5 | Keep changes reviewable |

## Installation

```bash
cd ~/MCP\ Forge
# Copy this entire folder into your project, or keep it standalone

# Install dependencies
cd forge-design-bot
npm install

# Build
npm run build
```

## Add to Claude Desktop / Claude Code

Add to `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "forge-design-bot": {
      "command": "node",
      "args": ["/Users/richy_rich/MCP Forge/forge-design-bot/dist/index.js"],
      "env": {
        "DESIGN_MEMORY_PATH": "/Users/richy_rich/MCP Forge/forge-design-bot/design_memory.json"
      }
    }
  }
}
```

Then restart Claude Code: `/exit` → `claude`

## Usage

### Basic Flow

```
You: Use forge_design_start_session with objective "Fix Fleet empty states" 
     and scope ["src/pages/Fleet.tsx"]

Bot: Session started. Here's the design context. Reading file...

Bot: [reads file, generates proposal]
     Proposal ready. Confidence: 0.82
     Changes: Added EmptyState component with icon, message, action button.
     Follows gallery aesthetic. Subtle fade-in animation.
     
     STOPPED: Awaiting human review.

You: forge_design_approve ← Changes written, memory updated
 OR: forge_design_reject with reason "too much animation"  ← Memory learns
 OR: forge_design_revise with feedback "simpler, no animation" ← Gets more iterations
```

### Design Memory Grows Over Time

After 5 sessions:
- Bot knows you reject animations
- Bot knows you approve minimal empty states
- Bot knows Fleet.tsx has strong preferences
- Proposals start matching your taste on first try

After 20 sessions:
- Acceptance rate approaches 80%+
- Bot avoids all previously rejected patterns
- Component pattern library reflects YOUR design system

## Tools Reference

| Tool | Purpose | Destructive? |
|------|---------|-------------|
| `forge_design_start_session` | Begin improvement session | No |
| `forge_design_read_file` | Read source files | No |
| `forge_design_propose` | Generate proposal | No |
| `forge_design_approve` | Accept + learn | No |
| `forge_design_reject` | Reject + learn | No |
| `forge_design_revise` | Request changes | No |
| `forge_design_apply` | Write to disk (with .bak backup) | Yes |
| `forge_design_status` | Check limits + state | No |
| `forge_design_memory` | View learned preferences | No |
| `forge_design_add_principle` | Add design rule | No |

## Design Memory File

`design_memory.json` is the persistent brain. It contains:
- **Design principles** — immutable rules (your aesthetic)
- **Component patterns** — how things should look
- **Color palette** — exact hex values and usage rules
- **Rejected patterns** — things you've said NO to (grows over time)
- **Approved patterns** — things you've said YES to (grows over time)
- **Session log** — every session's learnings

**Back this file up.** It's the accumulated intelligence of every design session.

## Architecture

```
forge-design-bot/
├── design_memory.json          ← The brain (persistent, back this up)
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                ← MCP server with 10 tools
│   ├── types.ts                ← All type definitions
│   └── services/
│       ├── design-memory.ts    ← Read/write/learn from memory
│       └── session-manager.ts  ← Iteration control + approval gates
└── dist/                       ← Built JS (run this)
```
