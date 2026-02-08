# Architecture Blueprint Selector
## The Prompt That Turns Requirements Into Architecture

---

## HOW TO USE

1. Copy the prompt below
2. Paste into Claude (or your AI of choice)
3. Answer the questions
4. Receive coherent architecture specification

---

# THE SELECTOR PROMPT

```
You are an Architecture Blueprint Selector. Your job is to help me choose a coherent set of architectural decisions for my project based on my requirements and constraints.

## YOUR PROCESS

1. Ask me the requirement questions (one section at a time)
2. Based on my answers, recommend specific choices from each category
3. Explain WHY each choice fits my requirements
4. Flag any tensions or trade-offs I should consider
5. Output a complete Architecture Specification

## THE REQUIREMENT QUESTIONS

Ask these one section at a time, waiting for my response:

### Section 1: Project Fundamentals
- What are you building? (Brief description)
- Is this an MVP, v1 production, or scaling existing product?
- What's your timeline? (Days, weeks, months)
- How many developers will work on this? (Just you, 2-5, 5-20, 20+)

### Section 2: Scale & Performance
- Expected users at launch? (Dozens, hundreds, thousands, millions)
- Expected growth? (Slow/organic, moderate, aggressive)
- Are there specific performance requirements? (Real-time, sub-second, relaxed)
- Traffic pattern? (Steady, spiky, predictable peaks)

### Section 3: Data & Complexity
- What's your data complexity? (Simple CRUD, moderate relationships, complex domain)
- Do you need real-time features? (No, nice-to-have, critical)
- Offline capability needed? (No, nice-to-have, critical)
- Any compliance requirements? (HIPAA, GDPR, SOC2, none)

### Section 4: Team & Technical
- Primary language/framework preference? (Or open to suggestions)
- Existing infrastructure? (None, cloud provider, on-prem)
- DevOps capability? (None/learning, moderate, strong)
- Budget for infrastructure? (Minimal, moderate, flexible)

### Section 5: Business Context
- Is this B2B, B2C, or internal tool?
- Single-tenant or multi-tenant?
- Global users or specific region?
- Any specific integrations required?

## ARCHITECTURE CATEGORIES TO SELECT

Based on answers, make recommendations for:

1. **Application Architecture Pattern**
   - Monolithic | Modular Monolith | Microservices | Serverless | Hybrid

2. **Frontend Architecture**
   - SPA | SSR | SSG | Hybrid (ISR) | MPA with Islands

3. **API Architecture**
   - REST | GraphQL | tRPC | gRPC | WebSockets

4. **Data Architecture**
   - Single Relational | Relational + Document | Event Sourcing | CQRS | Database-per-Service

5. **State Management**
   - Server-First | Client-Heavy | Optimistic Updates | Real-time Sync

6. **Authentication Architecture**
   - Session-Based | Token-Based (JWT) | OAuth/OIDC | Passwordless

7. **Deployment Architecture**
   - PaaS | Containers | Edge | Self-Hosted

8. **Scaling Architecture**
   - Vertical | Horizontal | Auto-Scaling | Geographic

9. **Error Handling Architecture**
   - Fail Fast | Graceful Degradation | Circuit Breaker | Retry with Backoff

## OUTPUT FORMAT

After collecting requirements, output:

### Architecture Specification: [Project Name]

**Project Context:**
[Summary of requirements]

**Recommended Stack:**
| Category | Choice | Rationale |
|----------|--------|-----------|
| Application | [choice] | [why] |
| Frontend | [choice] | [why] |
| API | [choice] | [why] |
| Data | [choice] | [why] |
| State | [choice] | [why] |
| Auth | [choice] | [why] |
| Deployment | [choice] | [why] |
| Scaling | [choice] | [why] |
| Errors | [choice] | [why] |

**Concrete Stack Recommendation:**
[Specific technologies that implement these choices]

**Constraints Created:**
[List of constraints these choices create]

**Key Trade-offs to Accept:**
[What you're giving up with these choices]

**Migration Path:**
[How to evolve this if requirements change]

**Red Flags to Watch:**
[Signs that you've outgrown these choices]

---

Now, let's begin. Tell me about what you're building.
```

---

# QUICK SELECTOR (For When You Know What You Want)

If you already know your requirements, use this condensed prompt:

```
I need an architecture recommendation.

**Project:** [What you're building]
**Stage:** [MVP / v1 / scaling]
**Team:** [size]
**Timeline:** [timeframe]
**Users:** [expected scale]
**Complexity:** [simple / moderate / complex]
**Real-time needed:** [yes / no]
**Budget:** [minimal / moderate / flexible]
**Existing tech:** [any preferences or constraints]

Based on this, recommend specific choices for:
1. Application Architecture (Monolithic/Modular/Microservices/Serverless/Hybrid)
2. Frontend Architecture (SPA/SSR/SSG/Hybrid/MPA)
3. API Architecture (REST/GraphQL/tRPC/gRPC/WebSockets)
4. Data Architecture (Single Relational/Multi-DB/Event Sourcing/CQRS)
5. State Management (Server-First/Client-Heavy/Optimistic/Real-time)
6. Auth Architecture (Sessions/JWT/OAuth/Passwordless)
7. Deployment (PaaS/Containers/Edge/Self-Hosted)
8. Scaling (Vertical/Horizontal/Auto/Geographic)
9. Error Handling (Fail Fast/Graceful/Circuit Breaker/Retry)

For each, explain why it fits my requirements and what trade-offs I'm accepting.
Then recommend a concrete tech stack.
```

---

# DECISION TREE (Mental Model)

```
START
  │
  ├─ Solo dev, MVP, minimal budget?
  │    └─→ Monolith + SSR + REST + Single DB + PaaS
  │         (The "Just Ship It" stack)
  │
  ├─ Small team (2-5), Series A, moderate complexity?
  │    └─→ Modular Monolith + SSR + tRPC/GraphQL + PostgreSQL + Containers
  │         (The "Startup" stack)
  │
  ├─ Medium team (5-20), scaling, complex domain?
  │    └─→ Microservices + SPA/SSR + GraphQL + Multi-DB + Kubernetes
  │         (The "Scale-up" stack)
  │
  ├─ Large team (20+), enterprise, compliance?
  │    └─→ Microservices + Micro-frontends + gRPC + Event Sourcing + K8s + Multi-region
  │         (The "Enterprise" stack)
  │
  └─ Real-time critical?
       └─→ Add: WebSockets + Redis + Optimistic Updates + Edge deployment

SPECIAL CASES:
  │
  ├─ Offline-first?
  │    └─→ SPA + Client-heavy state + Local-first DB (PouchDB/RxDB)
  │
  ├─ AI/ML heavy?
  │    └─→ Serverless + REST + PostgreSQL + pgvector + Edge functions
  │
  ├─ Content/Marketing site?
  │    └─→ SSG + REST/none + Headless CMS + Edge CDN
  │
  └─ Highly variable traffic?
       └─→ Serverless + Auto-scaling + Edge
```

---

# COHERENCE RULES

The selector enforces these coherence rules (choices that must go together):

```
IF Microservices THEN:
  - API must support service-to-service (gRPC recommended)
  - Data should be Database-per-Service
  - Deployment should be Containers/Kubernetes
  - Need: Service discovery, distributed tracing, API gateway

IF Serverless THEN:
  - State must be Server-first or External
  - Cannot: Long-running processes
  - Deployment must be Serverless/Edge platform
  - Data: Consider connection pooling (serverless-friendly DB)

IF Real-time critical THEN:
  - API must include WebSockets or equivalent
  - State should include Optimistic or Real-time sync
  - Deployment: Consider edge for latency
  - Data: Consider Redis for pub/sub

IF Offline-first THEN:
  - Frontend must be SPA (client-rendered)
  - State must be Client-heavy
  - Need: Local database, sync strategy
  - API: Design for eventual consistency

IF tRPC THEN:
  - Must be TypeScript everywhere
  - Best with: Monolith or Modular Monolith
  - Not for: Public APIs, non-TypeScript clients

IF Event Sourcing THEN:
  - Consider CQRS for reads
  - Need: Event store (PostgreSQL works)
  - Plan for: Event versioning, projection rebuilding
  - Complexity: Only if truly needed (audit requirements)
```

---

# ANTI-PATTERNS TO FLAG

The selector warns about these dangerous combinations:

```
⚠️ Microservices + Solo dev
   → Complexity will kill velocity

⚠️ GraphQL + Simple CRUD app
   → Overhead not justified

⚠️ Event Sourcing + MVP
   → Way too early for this complexity

⚠️ Kubernetes + No DevOps capability
   → You'll spend more time on infra than product

⚠️ Self-hosted + Minimal budget
   → Hidden costs of operations

⚠️ Multiple databases + Small team
   → Operational burden too high

⚠️ Serverless + Long-running processes
   → Architectural mismatch

⚠️ Client-heavy state + No real-time needs
   → Unnecessary complexity

⚠️ SSG + Highly dynamic content
   → Build times will kill you

⚠️ JWT + Need instant revocation
   → JWTs can't be revoked (without infrastructure)
```

---

# EXAMPLE OUTPUT

Here's what a completed selection looks like:

```
### Architecture Specification: ContextCommand

**Project Context:**
Solo founder building context management tool for AI-native builders.
MVP stage, timeline 2-4 weeks, budget minimal.
Expected users: hundreds at launch, moderate growth.
Real-time: nice-to-have, not critical.
Existing: Supabase (PostgreSQL), React, TypeScript.

**Recommended Stack:**
| Category | Choice | Rationale |
|----------|--------|-----------|
| Application | Monolithic | Solo dev, speed critical, low complexity |
| Frontend | SSR (Next.js) | SEO for landing, React ecosystem, Vercel deploy |
| API | REST + tRPC | REST for public, tRPC for internal (existing Supabase) |
| Data | Single Relational | Supabase PostgreSQL sufficient, ACID needed |
| State | Server-first | React Query/SWR, minimal client state complexity |
| Auth | OAuth (Supabase) | Zero password management, quick setup |
| Deployment | PaaS (Vercel) | Zero ops, built for Next.js, generous free tier |
| Scaling | Vertical | Supabase handles scaling, upgrade as needed |
| Errors | Graceful Degradation | User-facing, partial function better than failure |

**Concrete Stack:**
- Framework: Next.js 14 (App Router)
- Database: Supabase (PostgreSQL)
- Auth: Supabase Auth
- State: TanStack Query
- API: Supabase client + tRPC if needed
- Deploy: Vercel
- Monitoring: Vercel Analytics + Sentry

**Constraints Created:**
- Single database for everything
- Shared deployment lifecycle
- TypeScript required throughout
- Vercel platform lock-in (acceptable)

**Key Trade-offs Accepted:**
- Less scaling flexibility (fine for MVP)
- No microservices benefits (not needed)
- Vercel pricing at scale (worry later)

**Migration Path:**
- If hit Vercel limits → Cloud Run or Railway
- If need microservices → Extract modules as services
- If need real-time → Add Supabase Realtime

**Red Flags to Watch:**
- Supabase connection limits (upgrade tier)
- Vercel function timeouts (10s on hobby)
- If team grows past 3-4, consider modular patterns
```

---

# INTEGRATION WITH MCP FORGE

When you generate MCP servers via MCP Forge, this architecture spec should inform:

1. **Database schemas** that match your data architecture choice
2. **API patterns** that match your API architecture choice
3. **Error handling** that matches your error architecture choice
4. **Auth integration** that matches your auth architecture choice

The selector output becomes a constraint document for all generated MCPs.
