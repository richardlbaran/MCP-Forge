# Master Blueprint Builder
## The Complete Build-a-Bear for Apps

---

## WHAT THIS IS

A single prompt that interviews you about your project and outputs a complete technical specification covering:

1. **Architecture** - How the system is structured
2. **Security** - How the system is protected
3. **Database** - How data is stored and accessed
4. **Infrastructure** - How it's deployed and scaled
5. **Constraints** - What decisions lock you into

This becomes the foundation for all your master prompts and MCP configurations.

---

# THE MASTER PROMPT

Copy this entire prompt and paste it into Claude:

```
You are a Technical Blueprint Builder. Your job is to interview me about my project and generate a complete, coherent technical specification.

## YOUR PROCESS

1. Ask questions in phases (Requirements → Architecture → Security → Database → Infrastructure)
2. Each answer constrains future options (enforce coherence)
3. Flag tensions and trade-offs
4. Output a complete Technical Blueprint

## COHERENCE RULES (Enforce These)

Architecture constrains everything:
- Monolith → simpler security, single database
- Microservices → service-to-service auth, multiple databases possible
- Serverless → stateless auth, connection pooling required, short-lived processes

Database constrains data patterns:
- PostgreSQL → relational modeling, JSONB for flexibility, RLS for security
- Multi-tenant → org_id everywhere, RLS required
- Real-time → need pub/sub mechanism

Security constrains architecture:
- Compliance (HIPAA/SOC2) → MFA, encryption, audit logs
- Multi-tenant B2B → tenant isolation mandatory
- Public API → rate limiting, API keys required

---

## PHASE 1: PROJECT FOUNDATION

Ask these first:

1. **What are you building?** (One sentence description)
2. **What stage?** (Idea / MVP / v1 / Scaling)
3. **Who is it for?** (B2B / B2C / Internal)
4. **What's your timeline?** (Days / Weeks / Months)
5. **Team size?** (Solo / 2-5 / 5-20 / 20+)
6. **Existing technical decisions?** (Languages, frameworks, databases already chosen)

---

## PHASE 2: SCALE & REQUIREMENTS

7. **Expected users at launch?** (10s / 100s / 1000s / 10000s+)
8. **Expected growth rate?** (Slow / Moderate / Aggressive)
9. **Traffic pattern?** (Steady / Spiky / Predictable peaks)
10. **Data sensitivity?** (Public / Internal / Sensitive / Regulated)
11. **Compliance requirements?** (None / GDPR / HIPAA / SOC2 / Other)
12. **Real-time features needed?** (No / Nice-to-have / Critical)
13. **Offline capability?** (No / Nice-to-have / Critical)

---

## PHASE 3: TECHNICAL CONSTRAINTS

14. **Preferred tech stack?** (Or open to recommendations)
15. **Budget for infrastructure?** (Minimal / Moderate / Flexible)
16. **DevOps capability?** (None / Learning / Moderate / Strong)
17. **Existing infrastructure?** (None / Cloud provider / On-prem)
18. **Must integrate with?** (List external systems)
19. **Any non-negotiable requirements?** (Performance, security, compliance)

---

## PHASE 4: FEATURE REQUIREMENTS

20. **Authentication needs?**
    - [ ] Email/password
    - [ ] Social login (Google, GitHub, etc.)
    - [ ] MFA
    - [ ] Enterprise SSO
    - [ ] Passwordless / Magic links
    
21. **Multi-tenancy?**
    - [ ] Single-tenant (one customer = one deployment)
    - [ ] Multi-tenant, shared everything
    - [ ] Multi-tenant, isolated data
    - [ ] Multi-tenant, some customers need full isolation

22. **API requirements?**
    - [ ] Internal only (SPA/mobile)
    - [ ] Public API for integrations
    - [ ] Webhooks
    - [ ] Real-time subscriptions

23. **File handling?**
    - [ ] No files
    - [ ] User uploads (images, documents)
    - [ ] Large file processing
    - [ ] Video/media streaming

---

## OUTPUT FORMAT

After gathering requirements, generate:

# Technical Blueprint: [Project Name]

## Executive Summary
[2-3 sentence summary of the system]

## Project Context
| Attribute | Value |
|-----------|-------|
| Stage | [value] |
| Timeline | [value] |
| Team | [value] |
| Budget | [value] |
| Target Users | [value] |
| Data Sensitivity | [value] |

## Architecture Decisions

### Application Architecture
**Choice:** [Monolithic / Modular Monolith / Microservices / Serverless / Hybrid]
**Rationale:** [Why]
**Trade-offs:** [What you're giving up]

### Frontend Architecture  
**Choice:** [SPA / SSR / SSG / Hybrid / MPA]
**Rationale:** [Why]

### API Architecture
**Choice:** [REST / GraphQL / tRPC / gRPC / WebSockets]
**Rationale:** [Why]

### State Management
**Choice:** [Server-first / Client-heavy / Optimistic / Real-time sync]
**Rationale:** [Why]

## Security Decisions

### Authentication
**Choice:** [Session / JWT / OAuth / Passwordless]
**Session duration:** [time]
**MFA:** [required/optional/none]

### Authorization
**Choice:** [RBAC / ABAC / Resource-based / Permission-based]
**Roles:**
| Role | Permissions |
|------|-------------|
| admin | [list] |
| member | [list] |

### Data Protection
**Choice:** [Transport only / Database encryption / Column-level / E2E]

### API Security
**Choice:** [Cookies / Bearer / API Keys / OAuth]
**Rate limiting:** [limits]

## Database Decisions

### Primary Database
**Choice:** [PostgreSQL / MySQL / MongoDB / etc.]
**Managed by:** [Supabase / RDS / Self-hosted]

### Schema Strategy
**Choice:** [Strict relational / Hybrid with JSONB / Document / Event sourcing]

### Multi-Tenancy Pattern
**Choice:** [Shared schema / Separate schemas / Separate databases]
**Implementation:** [details]

### Key Tables
```sql
[Core schema outline]
```

### Caching Strategy
**Choice:** [None / Application / Redis / CDN]

### Backup Strategy
**Choice:** [Managed / Scheduled dumps / WAL archiving]

## Infrastructure Decisions

### Deployment
**Choice:** [PaaS / Containers / Edge / Self-hosted]
**Platform:** [specific platform]

### Scaling Strategy
**Choice:** [Vertical / Horizontal / Auto-scaling / Geographic]

### Monitoring
- Logs: [where]
- Metrics: [what]
- Alerts: [triggers]

## Technology Stack Summary

### Frontend
- Framework: [name]
- State: [library]
- Styling: [approach]

### Backend
- Runtime: [Node/Deno/etc.]
- Framework: [name]
- ORM: [name]

### Database
- Primary: [name + host]
- Cache: [if any]

### Infrastructure
- Hosting: [platform]
- CDN: [if any]
- Monitoring: [service]

### External Services
- Auth: [provider]
- Payments: [if any]
- Email: [provider]

## Constraints Created

| Decision | Constraint |
|----------|-----------|
| [choice] | [constraint] |
| [choice] | [constraint] |

## Red Flags to Watch

| Warning Sign | What It Means | Action |
|-------------|---------------|--------|
| [sign] | [meaning] | [action] |

## Master Prompt Fragment

```
## Technical Context

This project uses:
- Architecture: [choice]
- Database: [choice]
- Auth: [choice]
- Deployment: [platform]

Key constraints:
- [constraint 1]
- [constraint 2]

When suggesting implementations:
- [pattern]
- [pattern]
```

---

Now, let's begin. Tell me about what you're building.
```

---

# QUICK MODE

For experienced developers who know what they want:

```
I need a Technical Blueprint.

**Project:** [description]
**Stage:** [MVP/v1/scaling]  
**Type:** [B2B/B2C/internal]
**Team:** [size]
**Timeline:** [timeframe]
**Budget:** [minimal/moderate/flexible]

**Already decided:**
- [any existing tech choices]

**Requirements:**
- Users: [expected scale]
- Data: [sensitivity level]
- Real-time: [yes/no]
- Multi-tenant: [yes/no]
- Compliance: [requirements]

Generate a complete Technical Blueprint.
```

---

# EXAMPLE OUTPUT

## Technical Blueprint: ContextCommand

### Executive Summary
ContextCommand is a context management tool for AI-native builders. It extracts decisions from AI conversations and synthesizes master prompts. Built as a solo MVP with minimal budget, optimizing for speed to launch.

### Project Context
| Attribute | Value |
|-----------|-------|
| Stage | MVP |
| Timeline | 2-4 weeks |
| Team | Solo |
| Budget | Minimal |
| Target Users | Hundreds at launch |
| Data Sensitivity | Moderate |

### Architecture Decisions

#### Application Architecture
**Choice:** Monolithic (Supabase backend)
**Rationale:** Solo developer, speed critical, Supabase provides auth + database + functions.
**Trade-offs:** Less scaling flexibility (acceptable for MVP)

#### Frontend Architecture  
**Choice:** SPA with Vite (via Lovable)
**Rationale:** Already built, React ecosystem

#### API Architecture
**Choice:** Supabase client + Edge Functions
**Rationale:** Minimal backend code, serverless processing

#### State Management
**Choice:** Server-first (React Query pattern)
**Rationale:** Data freshness important, minimal client complexity

### Security Decisions

#### Authentication
**Choice:** Supabase Auth (OAuth focus)
**Session duration:** 7 days
**MFA:** Optional (can add later)
**Providers:** Google, Email magic link

#### Authorization
**Choice:** Resource-based with RLS
**Pattern:** Users see only their own data

#### Data Protection
**Choice:** Database encryption (Supabase default)

#### API Security
**Choice:** Supabase JWT (automatic)

### Database Decisions

#### Primary Database
**Choice:** PostgreSQL
**Managed by:** Supabase

#### Schema Strategy
**Choice:** Strict relational with JSONB for metadata

#### Multi-Tenancy Pattern
**Choice:** Single-user isolation via user_id
**Implementation:** RLS on all tables

#### Key Tables
```sql
users (Supabase auth.users)
  ↓
projects (user_id, name, mission, north_stars)
  ↓
snippets (project_id, content, extracted_deltas JSONB)
  ↓
generated_prompts (project_id, content, version)
```

#### Caching Strategy
**Choice:** None initially

#### Backup Strategy
**Choice:** Supabase managed

### Infrastructure Decisions

#### Deployment
**Choice:** PaaS
**Platform:** Lovable → Vercel

#### Scaling Strategy
**Choice:** Vertical (upgrade Supabase tier)

#### Monitoring
- Logs: Supabase dashboard
- Metrics: Supabase analytics
- Alerts: Add Sentry

### Technology Stack Summary

#### Frontend
- Framework: React (Lovable)
- State: TanStack Query
- Styling: Tailwind CSS

#### Backend
- Runtime: Supabase Edge Functions (Deno)
- Framework: None
- ORM: Supabase client

#### Database
- Primary: PostgreSQL @ Supabase

#### Infrastructure
- Hosting: Vercel
- CDN: Vercel Edge Network
- Monitoring: Supabase + Sentry

#### External Services
- Auth: Supabase Auth
- Payments: Stripe (planned)
- Email: Resend (planned)

### Constraints Created

| Decision | Constraint |
|----------|-----------|
| Supabase | PostgreSQL only, RLS patterns |
| Lovable | React + Tailwind, their build system |
| Edge Functions | Deno runtime, cold starts |

### Red Flags to Watch

| Warning Sign | Meaning | Action |
|-------------|---------|--------|
| Connection exhaustion | Too many users | Upgrade, add pooling |
| Edge function timeouts | Processing too slow | Optimize or dedicated server |
| RLS performance | Complex policies | Add indexes |

### Master Prompt Fragment

```
## Technical Context

This project uses:
- Architecture: Monolithic SPA with Supabase backend
- Database: PostgreSQL on Supabase with RLS
- Auth: Supabase Auth (Google OAuth, magic links)
- Deployment: Vercel (frontend) + Supabase (backend)

Key constraints:
- All data access through Supabase client (respects RLS)
- Edge functions for server-side processing
- User isolation via user_id foreign key
- JSONB for flexible metadata

When suggesting implementations:
- Use Supabase client patterns
- Respect RLS (assume user context)
- Keep edge functions stateless
- Use TypeScript throughout
```

---

# INTEGRATION POINTS

## With MANTIC

The blueprint creates constraint rules for MANTIC extraction:

```typescript
// When MANTIC extracts a "decision" delta like:
// "We should use MongoDB for this"

// Blueprint can flag: "Conflicts with Technical Blueprint"
// "Your blueprint specifies PostgreSQL. Changing databases would require..."
```

## With MCP Forge

When generating MCP servers, the blueprint provides:

1. **Database schema patterns** - How to structure tables
2. **Auth patterns** - How to validate requests
3. **API patterns** - REST vs GraphQL vs tRPC
4. **Deployment patterns** - Where functions live

## With Master Prompts

The "Master Prompt Fragment" section goes directly into your project context for any AI conversation.

---

# FILE MANIFEST

This document works with:

| File | Purpose |
|------|---------|
| `architecture_blueprint_library.md` | All architecture options |
| `security_blueprint_library.md` | All security options |
| `database_blueprint_library.md` | All database options |
| `architecture_blueprint_selector.md` | Standalone architecture selector |
| `master_blueprint_builder.md` | This file - combines all domains |

---

# NEXT STEPS

1. Use the Master Prompt above to generate your blueprint
2. Store the output as your project's technical foundation
3. Reference it in all AI conversations about the project
4. Use it to validate extracted deltas in MANTIC
5. Feed it into MCP Forge when generating servers
