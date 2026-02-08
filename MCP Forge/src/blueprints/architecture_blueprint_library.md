# Architecture Blueprint Library
## Build-a-Bear for Apps: Architecture Domain

---

## HOW TO USE THIS LIBRARY

1. **Browse categories** - Each section covers a major architectural decision
2. **Understand trade-offs** - Every choice has consequences
3. **Mark your selections** - Use the selector prompt to generate choices
4. **Output coherent spec** - Selections combine into architectural requirements

---

# CATEGORY 1: APPLICATION ARCHITECTURE PATTERN

> "How is the overall application structured?"

## Option 1A: Monolithic
```
Pattern: Single deployable unit containing all functionality
```

**Best for:**
- MVPs and early-stage products
- Small teams (1-5 developers)
- Simple domains with clear boundaries
- When speed-to-market is critical

**Trade-offs:**
- ✅ Simple deployment (one artifact)
- ✅ Easy local development
- ✅ No network latency between components
- ✅ Simpler debugging and tracing
- ❌ Scaling means scaling everything
- ❌ Technology lock-in (one stack for all)
- ❌ Longer build times as codebase grows
- ❌ Risk of "big ball of mud" without discipline

**Typical stack:** Next.js, Rails, Django, Laravel

**Constraints this creates:**
- Single database (usually)
- Shared deployment lifecycle
- Team must coordinate on releases

---

## Option 1B: Modular Monolith
```
Pattern: Single deployable unit with strict internal module boundaries
```

**Best for:**
- Teams planning eventual service extraction
- Medium complexity domains
- When you want monolith simplicity with future flexibility

**Trade-offs:**
- ✅ Monolith simplicity with better organization
- ✅ Modules can become services later
- ✅ Enforced boundaries prevent spaghetti
- ✅ Easier refactoring than microservices
- ❌ Requires discipline to maintain boundaries
- ❌ Still one deployment unit
- ❌ Shared database (usually)

**Typical stack:** Next.js with feature folders, Rails engines, NestJS modules

**Constraints this creates:**
- Need clear module interface contracts
- Shared deployment but isolated domains
- Database schemas per module (logical separation)

---

## Option 1C: Microservices
```
Pattern: Multiple independently deployable services, each owning a capability
```

**Best for:**
- Large teams (20+ engineers)
- Complex domains with natural boundaries
- When different parts need different scaling
- When different parts need different technologies

**Trade-offs:**
- ✅ Independent scaling per service
- ✅ Technology flexibility per service
- ✅ Independent deployment cycles
- ✅ Fault isolation (one service fails, others survive)
- ❌ Network complexity (latency, failures)
- ❌ Distributed debugging is hard
- ❌ Operational overhead (many deployments)
- ❌ Data consistency challenges

**Typical stack:** Kubernetes, Docker, service mesh, multiple languages

**Constraints this creates:**
- Need service discovery mechanism
- Need distributed tracing
- Need API gateway
- Need eventual consistency strategies
- Team per service (Conway's Law)

---

## Option 1D: Serverless / Functions-as-a-Service
```
Pattern: Individual functions triggered by events, no server management
```

**Best for:**
- Highly variable traffic (spiky workloads)
- Event-driven architectures
- When you want zero ops burden
- Cost-sensitive with low baseline traffic

**Trade-offs:**
- ✅ Zero server management
- ✅ Scale to zero (pay nothing when idle)
- ✅ Automatic scaling
- ✅ Built-in high availability
- ❌ Cold start latency
- ❌ Execution time limits
- ❌ Vendor lock-in
- ❌ Harder to test locally
- ❌ State management complexity

**Typical stack:** AWS Lambda, Vercel Functions, Cloudflare Workers, Supabase Edge Functions

**Constraints this creates:**
- Stateless function design
- External state storage (database, cache)
- Event-driven patterns required
- Vendor-specific APIs

---

## Option 1E: Hybrid (Monolith + Functions)
```
Pattern: Core application as monolith, specific features as serverless functions
```

**Best for:**
- Monolith teams adding async processing
- When some features need independent scaling
- Gradual serverless adoption

**Trade-offs:**
- ✅ Best of both worlds
- ✅ Incremental adoption
- ✅ Functions for spiky workloads
- ❌ Two deployment models to manage
- ❌ Complexity of coordination
- ❌ Need to decide what goes where

**Typical stack:** Next.js + Vercel Functions, Rails + AWS Lambda

---

# CATEGORY 2: FRONTEND ARCHITECTURE

> "How is the user interface structured and delivered?"

## Option 2A: Single Page Application (SPA)
```
Pattern: JavaScript app that runs entirely in browser, fetches data via API
```

**Best for:**
- Highly interactive applications (dashboards, tools)
- When offline capability matters
- Rich, app-like experiences

**Trade-offs:**
- ✅ Smooth, app-like interactions
- ✅ Can work offline
- ✅ Clear frontend/backend separation
- ❌ Poor initial SEO (without SSR)
- ❌ Longer initial load time
- ❌ JavaScript required

**Typical stack:** React + Vite, Vue, Angular

---

## Option 2B: Server-Side Rendering (SSR)
```
Pattern: HTML rendered on server for each request, hydrated with JS
```

**Best for:**
- Content sites needing SEO
- E-commerce
- When first-paint speed is critical

**Trade-offs:**
- ✅ Great SEO out of the box
- ✅ Fast first contentful paint
- ✅ Works without JavaScript (partially)
- ❌ Server load per request
- ❌ More complex deployment
- ❌ Hydration complexity

**Typical stack:** Next.js, Nuxt, Remix, SvelteKit

---

## Option 2C: Static Site Generation (SSG)
```
Pattern: HTML pre-rendered at build time, served from CDN
```

**Best for:**
- Blogs, documentation, marketing sites
- Content that doesn't change per-user
- Maximum performance and minimal cost

**Trade-offs:**
- ✅ Fastest possible load times
- ✅ Free/cheap hosting (CDN)
- ✅ Inherently secure (no server)
- ✅ Perfect SEO
- ❌ Build required for content changes
- ❌ No personalization without JS
- ❌ Build times scale with pages

**Typical stack:** Astro, Next.js static export, Hugo, Eleventy

---

## Option 2D: Hybrid (ISR / On-Demand)
```
Pattern: Static pages that can regenerate on-demand or on schedule
```

**Best for:**
- Sites with mostly static content + some dynamic
- E-commerce with many products
- When you want SSG benefits with some freshness

**Trade-offs:**
- ✅ SSG performance with dynamic capability
- ✅ Incremental updates without full rebuild
- ❌ More complex caching logic
- ❌ Stale content windows

**Typical stack:** Next.js ISR, Netlify On-Demand Builders

---

## Option 2E: Multi-Page Application (MPA) with Islands
```
Pattern: Traditional server-rendered pages with interactive "islands" of JS
```

**Best for:**
- Content-heavy sites with some interactivity
- When minimal JS is a goal
- Progressive enhancement focus

**Trade-offs:**
- ✅ Minimal JavaScript shipped
- ✅ Fast time-to-interactive
- ✅ Great accessibility baseline
- ❌ Page loads between navigations
- ❌ Less "app-like" feel

**Typical stack:** Astro, Eleventy + Alpine.js

---

# CATEGORY 3: API ARCHITECTURE

> "How do clients communicate with the backend?"

## Option 3A: REST
```
Pattern: Resource-based URLs, HTTP verbs, stateless requests
```

**Best for:**
- CRUD-heavy applications
- Public APIs
- Teams familiar with REST
- When caching is important

**Trade-offs:**
- ✅ Universal understanding
- ✅ HTTP caching works naturally
- ✅ Tooling everywhere
- ✅ Simple to debug (URLs in browser)
- ❌ Over-fetching / under-fetching
- ❌ Multiple round trips for complex data
- ❌ API versioning challenges

**Constraints this creates:**
- Need to design resource hierarchy
- Pagination strategy required
- Error response format decision

---

## Option 3B: GraphQL
```
Pattern: Query language for APIs, client specifies exact data needed
```

**Best for:**
- Complex data relationships
- Mobile apps (bandwidth sensitive)
- Rapidly evolving frontends
- Multiple client types with different needs

**Trade-offs:**
- ✅ No over-fetching / under-fetching
- ✅ Strong typing and introspection
- ✅ Single endpoint
- ✅ Great developer experience
- ❌ Caching more complex
- ❌ Query complexity attacks possible
- ❌ Learning curve
- ❌ N+1 query problems

**Typical stack:** Apollo, Hasura, GraphQL Yoga

**Constraints this creates:**
- Need DataLoader pattern for N+1
- Need query complexity limits
- Need to design schema carefully

---

## Option 3C: tRPC
```
Pattern: End-to-end type safety, TypeScript on both ends
```

**Best for:**
- Full-stack TypeScript applications
- When client and server are same codebase
- Teams wanting maximum type safety

**Trade-offs:**
- ✅ End-to-end type safety
- ✅ No code generation needed
- ✅ Feels like calling functions
- ✅ Excellent DX in monorepos
- ❌ TypeScript only
- ❌ Tight coupling to implementation
- ❌ Not suitable for public APIs

**Typical stack:** Next.js + tRPC, T3 Stack

---

## Option 3D: gRPC
```
Pattern: Binary protocol, protocol buffers, bi-directional streaming
```

**Best for:**
- Microservices communication
- When performance is critical
- Streaming data needs
- Polyglot environments

**Trade-offs:**
- ✅ Very fast (binary protocol)
- ✅ Strong contracts (protobuf)
- ✅ Bi-directional streaming
- ✅ Works across languages
- ❌ Not browser-native (needs proxy)
- ❌ Harder to debug
- ❌ Learning curve

---

## Option 3E: WebSockets / Real-time
```
Pattern: Persistent connections for bi-directional real-time communication
```

**Best for:**
- Chat applications
- Live dashboards
- Collaborative tools
- Gaming

**Trade-offs:**
- ✅ True real-time
- ✅ Efficient for frequent updates
- ✅ Bi-directional
- ❌ Connection state management
- ❌ Scaling complexity
- ❌ Mobile/network challenges

**Typical stack:** Socket.io, Supabase Realtime, Ably, Pusher

---

# CATEGORY 4: DATA ARCHITECTURE

> "How is data stored and accessed?"

## Option 4A: Single Relational Database
```
Pattern: One PostgreSQL/MySQL for all data
```

**Best for:**
- Most applications (seriously)
- ACID compliance needs
- Complex queries and joins
- When consistency matters

**Trade-offs:**
- ✅ ACID transactions
- ✅ Flexible querying (SQL)
- ✅ Mature tooling
- ✅ Single source of truth
- ❌ Vertical scaling limits
- ❌ Schema changes can be painful
- ❌ Not ideal for unstructured data

**Typical stack:** PostgreSQL (recommended), MySQL

---

## Option 4B: Relational + Document Store
```
Pattern: Relational DB for structured + MongoDB/DynamoDB for flexible
```

**Best for:**
- When you have both structured and unstructured data
- User-generated content with varying shapes
- Event logging / analytics

**Trade-offs:**
- ✅ Right tool for each data type
- ✅ Document store flexibility
- ❌ Two systems to manage
- ❌ Data consistency challenges
- ❌ Query across stores is hard

---

## Option 4C: Event Sourcing
```
Pattern: Store events, derive current state from event replay
```

**Best for:**
- Audit-critical systems (finance, healthcare)
- When history is as important as current state
- Complex domain logic

**Trade-offs:**
- ✅ Complete audit trail
- ✅ Can replay/rebuild state
- ✅ Temporal queries ("what was state at X?")
- ❌ Complex to implement
- ❌ Storage grows forever
- ❌ Eventual consistency

---

## Option 4D: CQRS (Command Query Responsibility Segregation)
```
Pattern: Separate models for read and write operations
```

**Best for:**
- High-read, low-write systems
- When read and write shapes differ significantly
- Scaling reads independently

**Trade-offs:**
- ✅ Optimized read models
- ✅ Independent scaling
- ✅ Simpler queries
- ❌ Sync between models
- ❌ Eventual consistency
- ❌ More moving parts

---

## Option 4E: Database-per-Service
```
Pattern: Each service owns its data, no shared database
```

**Best for:**
- Microservices architectures
- When services need different database types
- Strong service boundaries

**Trade-offs:**
- ✅ Complete service isolation
- ✅ Right database per use case
- ✅ Independent scaling
- ❌ Cross-service queries are hard
- ❌ Distributed transactions
- ❌ Data duplication

---

# CATEGORY 5: STATE MANAGEMENT

> "How is application state handled?"

## Option 5A: Server-First (Minimal Client State)
```
Pattern: Server is source of truth, client fetches as needed
```

**Best for:**
- Content-heavy applications
- When real-time sync matters
- Simpler applications

**Trade-offs:**
- ✅ Simple mental model
- ✅ Always fresh data
- ✅ Less client complexity
- ❌ More network requests
- ❌ Latency on every action
- ❌ Offline doesn't work

**Typical stack:** React Query, SWR, server components

---

## Option 5B: Client-Heavy (Rich Client State)
```
Pattern: Client maintains significant state, syncs with server
```

**Best for:**
- Complex interactive UIs
- Offline-first applications
- When responsiveness is critical

**Trade-offs:**
- ✅ Instant UI responses
- ✅ Offline capability
- ✅ Reduced server load
- ❌ Sync complexity
- ❌ State bugs harder to debug
- ❌ Stale data risks

**Typical stack:** Redux, Zustand, MobX

---

## Option 5C: Optimistic Updates
```
Pattern: Update UI immediately, reconcile with server
```

**Best for:**
- Social features (likes, comments)
- When perceived speed matters
- Low-conflict operations

**Trade-offs:**
- ✅ Feels instant
- ✅ Great UX
- ❌ Rollback complexity
- ❌ Conflict resolution needed

---

## Option 5D: Real-time Sync (CRDT/Multiplayer)
```
Pattern: Multiple clients edit simultaneously, automatic merge
```

**Best for:**
- Collaborative tools (Figma, Notion)
- Multiplayer experiences
- When multiple users edit same data

**Trade-offs:**
- ✅ True collaboration
- ✅ No conflicts (by design)
- ❌ Complex implementation
- ❌ Specialized libraries needed
- ❌ Testing is hard

**Typical stack:** Yjs, Automerge, Liveblocks

---

# CATEGORY 6: AUTHENTICATION ARCHITECTURE

> "How do users prove who they are?"

## Option 6A: Session-Based (Server Sessions)
```
Pattern: Server stores session, client holds session ID in cookie
```

**Best for:**
- Traditional web apps
- When you control all clients
- Simpler security model

**Trade-offs:**
- ✅ Simple to implement
- ✅ Easy to invalidate
- ✅ Server controls everything
- ❌ Requires server state
- ❌ Scaling sessions is complex
- ❌ Not great for mobile/SPA

---

## Option 6B: Token-Based (JWT)
```
Pattern: Server issues signed token, client sends with requests
```

**Best for:**
- SPAs and mobile apps
- Microservices
- When stateless servers matter

**Trade-offs:**
- ✅ Stateless servers
- ✅ Works across domains
- ✅ Self-contained claims
- ❌ Can't easily revoke
- ❌ Token size
- ❌ Refresh token complexity

---

## Option 6C: OAuth/OIDC (Delegated Auth)
```
Pattern: Users authenticate via third party (Google, GitHub, etc.)
```

**Best for:**
- Consumer apps
- When you don't want password management
- B2B with SSO requirements

**Trade-offs:**
- ✅ No password management
- ✅ Users trust familiar providers
- ✅ Enterprise SSO possible
- ❌ Dependency on providers
- ❌ Complex flows
- ❌ Less control

**Typical stack:** Auth0, Clerk, Supabase Auth, NextAuth

---

## Option 6D: Passwordless (Magic Links, WebAuthn)
```
Pattern: No passwords, verify via email/SMS/biometrics
```

**Best for:**
- Modern consumer apps
- When reducing friction matters
- Security-conscious applications

**Trade-offs:**
- ✅ No password to steal
- ✅ Great UX (often)
- ✅ Phishing resistant (WebAuthn)
- ❌ Email/SMS dependency
- ❌ Device dependency (WebAuthn)
- ❌ User education needed

---

# CATEGORY 7: DEPLOYMENT ARCHITECTURE

> "How does code get to production?"

## Option 7A: Platform-as-a-Service (PaaS)
```
Pattern: Deploy code, platform handles infrastructure
```

**Best for:**
- Small teams
- When you want zero ops
- Standard web applications

**Trade-offs:**
- ✅ Zero infrastructure management
- ✅ Fast deployment
- ✅ Built-in scaling
- ❌ Less control
- ❌ Can get expensive at scale
- ❌ Vendor lock-in

**Typical stack:** Vercel, Netlify, Railway, Render, Heroku

---

## Option 7B: Containers (Docker + Orchestration)
```
Pattern: Package app in containers, orchestrate deployment
```

**Best for:**
- Complex applications
- Multi-service architectures
- When you need control

**Trade-offs:**
- ✅ Consistent environments
- ✅ Full control
- ✅ Portable
- ❌ Operational complexity
- ❌ Kubernetes learning curve
- ❌ Need DevOps skills

**Typical stack:** Docker, Kubernetes, ECS, Cloud Run

---

## Option 7C: Edge Deployment
```
Pattern: Code runs at edge locations worldwide
```

**Best for:**
- Global applications
- When latency is critical
- Static + dynamic hybrid

**Trade-offs:**
- ✅ Lowest latency globally
- ✅ Built-in CDN
- ✅ Scale without thinking
- ❌ Edge runtime limitations
- ❌ Database proximity challenges
- ❌ Debugging distributed systems

**Typical stack:** Cloudflare Workers, Vercel Edge, Deno Deploy

---

## Option 7D: Self-Hosted / Bare Metal
```
Pattern: You manage the servers
```

**Best for:**
- Compliance requirements
- Cost optimization at scale
- Maximum control

**Trade-offs:**
- ✅ Full control
- ✅ Can be cheapest at scale
- ✅ No vendor dependencies
- ❌ All operational burden
- ❌ Need infrastructure team
- ❌ Scaling is manual

---

# CATEGORY 8: SCALING ARCHITECTURE

> "How does the system handle growth?"

## Option 8A: Vertical Scaling (Scale Up)
```
Pattern: Bigger servers when needed
```

**Best for:**
- Early stage (just make server bigger)
- Databases (often only option)
- Simple scaling needs

**Trade-offs:**
- ✅ Simple - just upgrade
- ✅ No code changes
- ❌ Hardware limits
- ❌ Single point of failure
- ❌ Expensive at top end

---

## Option 8B: Horizontal Scaling (Scale Out)
```
Pattern: More servers behind load balancer
```

**Best for:**
- Stateless applications
- When vertical limits hit
- High availability needs

**Trade-offs:**
- ✅ Near-infinite scaling
- ✅ Built-in redundancy
- ❌ Stateless requirement
- ❌ Session management
- ❌ More complex deployment

---

## Option 8C: Auto-Scaling
```
Pattern: Infrastructure automatically adjusts to load
```

**Best for:**
- Variable traffic patterns
- Cost optimization
- Hands-off operations

**Trade-offs:**
- ✅ Match resources to demand
- ✅ Cost efficient
- ❌ Cold start delays
- ❌ Configuration complexity
- ❌ Can be unpredictable

---

## Option 8D: Geographic Distribution
```
Pattern: Multiple deployments across regions
```

**Best for:**
- Global user base
- Compliance (data residency)
- Disaster recovery

**Trade-offs:**
- ✅ Lower latency globally
- ✅ Regional compliance
- ✅ Disaster recovery
- ❌ Data sync complexity
- ❌ Operational overhead
- ❌ Cost multiplication

---

# CATEGORY 9: ERROR HANDLING ARCHITECTURE

> "How does the system handle failures?"

## Option 9A: Fail Fast
```
Pattern: Errors bubble up immediately, system stops
```

**Best for:**
- Development environments
- When data integrity is critical
- Debugging

**Trade-offs:**
- ✅ Errors visible immediately
- ✅ No silent failures
- ❌ Poor UX if not handled
- ❌ System less resilient

---

## Option 9B: Graceful Degradation
```
Pattern: Features fail individually, core keeps working
```

**Best for:**
- User-facing production systems
- When availability > consistency
- Complex systems with many features

**Trade-offs:**
- ✅ Better user experience
- ✅ Partial functionality preserved
- ❌ Complexity in handling states
- ❌ Silent failures possible

---

## Option 9C: Circuit Breaker
```
Pattern: Stop calling failing service, use fallback
```

**Best for:**
- Microservices
- Third-party API dependencies
- When cascading failures are risk

**Trade-offs:**
- ✅ Prevents cascade failures
- ✅ Gives failing service recovery time
- ❌ Additional infrastructure
- ❌ Fallback logic needed

---

## Option 9D: Retry with Backoff
```
Pattern: Retry failed operations with increasing delays
```

**Best for:**
- Transient failures
- Network operations
- External API calls

**Trade-offs:**
- ✅ Handles temporary failures
- ✅ Simple to implement
- ❌ Can amplify issues
- ❌ Latency during retries

---

# QUICK REFERENCE: COMMON COMBINATIONS

## The "Indie Hacker" Stack
- **Architecture:** Monolithic
- **Frontend:** SSR (Next.js)
- **API:** tRPC or REST
- **Data:** Single PostgreSQL
- **State:** Server-first (React Query)
- **Auth:** OAuth (Supabase/Clerk)
- **Deploy:** PaaS (Vercel)
- **Scale:** Vertical (upgrade Supabase)

## The "Startup Series A" Stack
- **Architecture:** Modular Monolith
- **Frontend:** SSR + SPA hybrid
- **API:** GraphQL
- **Data:** PostgreSQL + Redis
- **State:** Optimistic updates
- **Auth:** Custom + OAuth
- **Deploy:** Containers (Cloud Run)
- **Scale:** Horizontal with auto-scale

## The "Enterprise" Stack
- **Architecture:** Microservices
- **Frontend:** Micro-frontends
- **API:** gRPC internal, GraphQL external
- **Data:** Database-per-service
- **State:** Event-driven
- **Auth:** OIDC with enterprise SSO
- **Deploy:** Kubernetes
- **Scale:** Geographic distribution

## The "AI-Native" Stack
- **Architecture:** Serverless/Functions
- **Frontend:** SPA with streaming
- **API:** REST + WebSockets
- **Data:** PostgreSQL + Vector DB
- **State:** Server-first with optimistic
- **Auth:** OAuth
- **Deploy:** Edge + Functions
- **Scale:** Auto-scale by function

---

# NEXT STEPS

This library is the foundation. To use it:

1. **Run the Selector Prompt** (next document)
2. **Answer questions about your requirements**
3. **Generate coherent architecture spec**
4. **Feed into your master prompts**

The selector prompt will ask about:
- Team size
- Scale expectations
- Complexity level
- Time constraints
- Technical expertise
- Specific requirements (real-time, offline, etc.)

And output a coherent set of selections from this library.
