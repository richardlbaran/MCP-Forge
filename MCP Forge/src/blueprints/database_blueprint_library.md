# Database Blueprint Library
## Build-a-Bear for Apps: Database Domain

---

# CATEGORY 1: DATABASE ENGINE

> "What type of database is the primary data store?"

## Option 1A: PostgreSQL
```
Engine: Relational, ACID-compliant, feature-rich
```

**Best for:**
- 90% of applications (seriously, start here)
- Complex queries and relationships
- When you might need multiple features later
- JSONB for flexible data within structure

**Trade-offs:**
- ✅ Full ACID compliance
- ✅ Extremely mature and stable
- ✅ Extensions (PostGIS, pgvector, etc.)
- ✅ JSON support (best of both worlds)
- ✅ Full-text search built in
- ❌ Horizontal scaling requires planning
- ❌ Not the fastest for simple key-value

**When to choose:** Default choice. Only choose something else if PostgreSQL genuinely can't do what you need.

---

## Option 1B: MySQL / MariaDB
```
Engine: Relational, ACID-compliant, widely deployed
```

**Best for:**
- WordPress/PHP ecosystems
- When ops team knows MySQL
- Read-heavy workloads

**Trade-offs:**
- ✅ Very fast reads
- ✅ Widely understood
- ✅ Good replication
- ❌ Less feature-rich than Postgres
- ❌ JSON support not as good
- ❌ Full-text search less capable

---

## Option 1C: SQLite
```
Engine: Embedded relational database, single file
```

**Best for:**
- Desktop/mobile applications
- Edge/serverless (with caveats)
- Local-first architectures
- Development/testing

**Trade-offs:**
- ✅ Zero configuration
- ✅ Single file deployment
- ✅ Incredibly fast for local
- ✅ New: Turso/LiteFS for distributed
- ❌ Single writer limitation
- ❌ Not for traditional multi-user web

---

## Option 1D: MongoDB
```
Engine: Document store, flexible schema
```

**Best for:**
- Truly unstructured data
- Rapid prototyping (debatable)
- When schema genuinely varies per document
- Content management with varying shapes

**Trade-offs:**
- ✅ Schema flexibility
- ✅ Easy horizontal scaling
- ✅ Good developer experience
- ❌ No true ACID transactions (improving)
- ❌ Joins are expensive
- ❌ Data integrity is your problem
- ❌ Often misused (Postgres JSONB works)

**Honest assessment:** In 2024+, PostgreSQL with JSONB handles most "document store" needs better.

---

## Option 1E: DynamoDB / Cassandra
```
Engine: Wide-column, distributed, eventually consistent
```

**Best for:**
- Massive scale (millions of ops/second)
- When consistency can be eventual
- Time-series data
- Known access patterns

**Trade-offs:**
- ✅ Near-infinite scale
- ✅ Predictable performance
- ✅ High availability
- ❌ Access patterns must be known upfront
- ❌ No ad-hoc queries
- ❌ Eventual consistency complexity
- ❌ Expensive at low scale

---

## Option 1F: Redis
```
Engine: In-memory key-value store
```

**Best for:**
- Caching layer
- Session storage
- Real-time features (pub/sub)
- Rate limiting
- NOT as primary database (usually)

**Trade-offs:**
- ✅ Extremely fast
- ✅ Rich data structures
- ✅ Pub/sub built in
- ❌ Memory is expensive
- ❌ Persistence has trade-offs
- ❌ Data loss risk if not configured

---

## Option 1G: Vector Database (Pinecone, Weaviate, pgvector)
```
Engine: Optimized for embedding similarity search
```

**Best for:**
- AI/ML applications
- Semantic search
- Recommendation systems
- RAG (Retrieval Augmented Generation)

**Trade-offs:**
- ✅ Fast similarity search
- ✅ Built for AI workloads
- ❌ Specialized use case
- ❌ Often used WITH relational DB

**Recommendation:** Start with pgvector (PostgreSQL extension) before dedicated vector DB.

---

# CATEGORY 2: MANAGED VS SELF-HOSTED

> "Who manages the database infrastructure?"

## Option 2A: Managed Database Service
```
Pattern: Cloud provider runs the database
```

**Best for:**
- Most applications
- When you want to focus on product
- Small teams without DBA

**Options:**
- Supabase (PostgreSQL + extras)
- PlanetScale (MySQL, branching)
- Neon (PostgreSQL, branching, serverless)
- AWS RDS / Aurora
- GCP Cloud SQL
- MongoDB Atlas

**Trade-offs:**
- ✅ Zero ops
- ✅ Automatic backups
- ✅ Automatic scaling (some)
- ✅ Security handled
- ❌ More expensive at scale
- ❌ Less control
- ❌ Vendor lock-in (varying degrees)

---

## Option 2B: Self-Managed on Cloud
```
Pattern: You run database on cloud VMs
```

**Best for:**
- Cost optimization at scale
- Specific configuration needs
- When team has DB expertise

**Trade-offs:**
- ✅ Full control
- ✅ Cost efficient at scale
- ✅ Any configuration
- ❌ Operational burden
- ❌ Need expertise
- ❌ Backups are your job
- ❌ Security is your job

---

## Option 2C: Serverless Database
```
Pattern: Database scales to zero, pay per query
```

**Best for:**
- Variable workloads
- Development environments
- Low-traffic applications
- Cost-sensitive projects

**Options:**
- Neon (PostgreSQL)
- PlanetScale (MySQL)
- Supabase (can scale to zero)
- Turso (SQLite distributed)

**Trade-offs:**
- ✅ Scale to zero
- ✅ Pay for what you use
- ✅ No capacity planning
- ❌ Cold start latency
- ❌ Connection pooling complexity
- ❌ Pricing unpredictable at scale

---

# CATEGORY 3: SCHEMA DESIGN PHILOSOPHY

> "How strictly do we enforce data structure?"

## Option 3A: Strict Schema (Relational Modeling)
```
Pattern: All data in defined tables with relationships
```

**Best for:**
- Data integrity critical
- Complex relationships
- Reporting/analytics needs
- When data shape is known

**Trade-offs:**
- ✅ Data integrity enforced
- ✅ Clear relationships
- ✅ Query flexibility
- ✅ Database catches errors
- ❌ Schema migrations required
- ❌ Less flexible to change
- ❌ Normalization decisions

---

## Option 3B: Hybrid (Relational + JSONB)
```
Pattern: Core structure defined, flexible fields in JSON
```

**Best for:**
- Core data is structured, extras vary
- User preferences, settings
- Plugin/extension data
- Feature flags, metadata

**Trade-offs:**
- ✅ Best of both worlds
- ✅ Indexed JSON queries (Postgres)
- ✅ Schema evolves easily
- ❌ Less type safety in JSON
- ❌ Query syntax more complex

**Example:**
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID REFERENCES users(id),
  -- Structured fields above, flexible below
  settings JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}'
);

-- Query JSON
SELECT * FROM projects 
WHERE settings->>'theme' = 'dark';
```

---

## Option 3C: Schema-Per-Tenant
```
Pattern: Each tenant gets isolated schema/database
```

**Best for:**
- B2B with data isolation requirements
- Compliance (HIPAA, etc.)
- When tenants might need custom schema

**Trade-offs:**
- ✅ Complete tenant isolation
- ✅ Easy per-tenant backup/restore
- ✅ Per-tenant customization
- ❌ Schema migrations across tenants
- ❌ Connection management
- ❌ Resource overhead

---

## Option 3D: Event Log + Projections
```
Pattern: Store events, derive current state
```

**Best for:**
- Audit requirements
- Complex domain logic
- When history matters

**Trade-offs:**
- ✅ Complete audit trail
- ✅ Time travel queries
- ✅ Rebuild state from events
- ❌ Complexity
- ❌ Storage grows forever
- ❌ Learning curve

---

# CATEGORY 4: MULTI-TENANCY PATTERN

> "How do we isolate tenant data?"

## Option 4A: Shared Database, Shared Schema
```
Pattern: All tenants in same tables, org_id column
```

**Best for:**
- Most SaaS applications
- When cost efficiency matters
- Simpler operations

**Implementation:**
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL
);

-- RLS for isolation
CREATE POLICY "Tenant isolation" ON projects
  USING (org_id = current_setting('app.org_id')::uuid);
```

**Trade-offs:**
- ✅ Simple operations
- ✅ Cost efficient
- ✅ Easy to query across tenants (admin)
- ❌ Noisy neighbor risk
- ❌ Data leak risk if RLS wrong
- ❌ Harder compliance story

---

## Option 4B: Shared Database, Separate Schemas
```
Pattern: Each tenant gets a PostgreSQL schema
```

**Best for:**
- When stronger isolation needed
- Per-tenant schema variations
- Compliance requirements

**Implementation:**
```sql
CREATE SCHEMA tenant_123;
CREATE TABLE tenant_123.projects (...);

-- Set search_path per connection
SET search_path TO tenant_123, public;
```

**Trade-offs:**
- ✅ Better isolation
- ✅ Per-tenant schema possible
- ✅ Easier per-tenant operations
- ❌ Schema migration complexity
- ❌ Connection routing
- ❌ More schemas to manage

---

## Option 4C: Separate Databases
```
Pattern: Each tenant gets their own database
```

**Best for:**
- Enterprise with strict requirements
- Compliance (HIPAA, etc.)
- When tenants pay for isolation

**Trade-offs:**
- ✅ Complete isolation
- ✅ Per-tenant backup/restore
- ✅ Per-tenant scaling
- ✅ Easy to export tenant data
- ❌ Operational complexity
- ❌ Cost (one DB per tenant)
- ❌ Aggregation across tenants hard

---

## Option 4D: Shard by Tenant
```
Pattern: Multiple databases, tenants routed to shards
```

**Best for:**
- Massive scale
- When single DB is bottleneck
- Gradual migration possible

**Trade-offs:**
- ✅ Horizontal scaling
- ✅ Isolation between shards
- ❌ Routing complexity
- ❌ Cross-shard queries impossible
- ❌ Rebalancing is hard

---

# CATEGORY 5: MIGRATION STRATEGY

> "How do we evolve the schema over time?"

## Option 5A: Manual Migrations
```
Pattern: Hand-written SQL migration files
```

**Best for:**
- Full control
- Complex migrations
- When you understand the database

**Tools:**
- Raw SQL files
- golang-migrate
- dbmate
- Flyway

**Trade-offs:**
- ✅ Full control
- ✅ Understand what's happening
- ✅ Can optimize migrations
- ❌ Manual work
- ❌ Can forget steps
- ❌ Rollback is manual

---

## Option 5B: ORM-Generated Migrations
```
Pattern: ORM generates migrations from model changes
```

**Best for:**
- Rapid development
- When schema matches models
- Teams less comfortable with SQL

**Tools:**
- Prisma
- Drizzle
- TypeORM
- Django migrations

**Trade-offs:**
- ✅ Fast iteration
- ✅ Type safety
- ✅ Less SQL knowledge needed
- ❌ Generated SQL may be suboptimal
- ❌ Complex migrations need escape hatch
- ❌ ORM lock-in

---

## Option 5C: Database Branching
```
Pattern: Branch database like code, merge when ready
```

**Best for:**
- Team workflows
- Preview deployments
- Testing migrations

**Tools:**
- PlanetScale
- Neon
- Supabase (branching)

**Trade-offs:**
- ✅ Safe migration testing
- ✅ Preview environments
- ✅ Collaboration
- ❌ Platform-specific
- ❌ Cost of branches
- ❌ Data sync considerations

---

## Option 5D: Zero-Downtime Migrations
```
Pattern: Migrations that don't require downtime
```

**Best for:**
- Production systems
- When uptime is critical
- Gradual rollouts

**Patterns:**
- Add column (nullable), backfill, make required
- Create new table, migrate data, swap
- Expand-contract pattern

**Trade-offs:**
- ✅ No downtime
- ✅ Rollback possible
- ❌ More complex
- ❌ Multiple deployments
- ❌ Temporary dual-writes

---

# CATEGORY 6: QUERY PATTERNS

> "How does the application access data?"

## Option 6A: ORM / Query Builder
```
Pattern: Application code generates SQL
```

**Best for:**
- Standard CRUD operations
- Type safety
- Team comfort with ORM patterns

**Options:**
- Prisma (type-safe, great DX)
- Drizzle (lightweight, SQL-like)
- Kysely (type-safe query builder)
- TypeORM (full ORM)

**Trade-offs:**
- ✅ Type safety
- ✅ Faster development
- ✅ Prevents injection
- ❌ N+1 query risk
- ❌ Complex queries need escape hatch
- ❌ Performance overhead (minor)

---

## Option 6B: Raw SQL
```
Pattern: Hand-written SQL queries
```

**Best for:**
- Performance-critical queries
- Complex reporting
- When you need full control

**Trade-offs:**
- ✅ Full control
- ✅ Best performance
- ✅ Use all DB features
- ❌ Injection risk if not careful
- ❌ No type safety (without tooling)
- ❌ More verbose

---

## Option 6C: Database Functions
```
Pattern: Logic in stored procedures/functions
```

**Best for:**
- Complex operations
- When latency matters (no round trips)
- Security (least privilege)

**Trade-offs:**
- ✅ No network round trips
- ✅ Can enforce business logic in DB
- ✅ RLS-friendly
- ❌ Logic split between app and DB
- ❌ Testing more complex
- ❌ Version control challenges

---

## Option 6D: GraphQL Layer
```
Pattern: GraphQL server translates to SQL
```

**Best for:**
- Complex, nested data fetching
- Multiple client types
- When clients need flexibility

**Options:**
- Hasura (auto-generates from schema)
- PostGraphile
- Custom resolver layer

**Trade-offs:**
- ✅ Client flexibility
- ✅ One query for nested data
- ❌ N+1 at GraphQL layer
- ❌ Query complexity attacks
- ❌ Another layer to manage

---

# CATEGORY 7: CACHING STRATEGY

> "How do we reduce database load?"

## Option 7A: Application-Level Cache
```
Pattern: Cache in application memory
```

**Best for:**
- Single instance applications
- Small datasets
- Request-scoped caching

**Trade-offs:**
- ✅ Simplest
- ✅ No infrastructure
- ✅ Fastest access
- ❌ Not shared across instances
- ❌ Memory limits
- ❌ Cache invalidation per instance

---

## Option 7B: Redis/Memcached
```
Pattern: Shared cache service
```

**Best for:**
- Multi-instance deployments
- Session storage
- Frequently accessed data

**Trade-offs:**
- ✅ Shared across instances
- ✅ Fast
- ✅ Rich data structures (Redis)
- ❌ Additional infrastructure
- ❌ Cache invalidation complexity
- ❌ Cost

---

## Option 7C: CDN / Edge Cache
```
Pattern: Cache at network edge
```

**Best for:**
- Static assets
- API responses (carefully)
- Global applications

**Trade-offs:**
- ✅ Lowest latency globally
- ✅ Reduces origin load
- ❌ Invalidation is hard
- ❌ Personalized content tricky
- ❌ Cache key design matters

---

## Option 7D: Materialized Views
```
Pattern: Pre-computed query results in database
```

**Best for:**
- Complex aggregations
- Dashboard data
- Analytics queries

**Trade-offs:**
- ✅ Fast complex queries
- ✅ Stays in database
- ✅ Refreshable
- ❌ Stale data between refreshes
- ❌ Storage overhead
- ❌ Refresh time for large datasets

**Implementation:**
```sql
CREATE MATERIALIZED VIEW project_stats AS
SELECT 
  project_id,
  COUNT(*) as snippet_count,
  MAX(created_at) as last_activity
FROM snippets
GROUP BY project_id;

-- Refresh
REFRESH MATERIALIZED VIEW project_stats;
```

---

# CATEGORY 8: BACKUP & RECOVERY

> "How do we protect against data loss?"

## Option 8A: Managed Backups
```
Pattern: Database provider handles backups
```

**Best for:**
- Most applications
- When using managed database

**Trade-offs:**
- ✅ Zero effort
- ✅ Point-in-time recovery
- ✅ Tested by provider
- ❌ Recovery time varies
- ❌ May have retention limits
- ❌ Cross-region may cost extra

---

## Option 8B: Scheduled Dumps
```
Pattern: Regular pg_dump to object storage
```

**Best for:**
- Small databases
- Self-managed databases
- Additional safety layer

**Trade-offs:**
- ✅ Simple
- ✅ Portable format
- ✅ Can store anywhere
- ❌ Only recovers to dump time
- ❌ Larger DBs take time
- ❌ Impact during dump

---

## Option 8C: Continuous Archiving (WAL)
```
Pattern: Stream write-ahead logs to storage
```

**Best for:**
- Point-in-time recovery
- Minimal data loss tolerance
- Compliance requirements

**Trade-offs:**
- ✅ Recover to any point in time
- ✅ Minimal data loss (seconds)
- ❌ Complex setup
- ❌ Storage costs
- ❌ Recovery complexity

---

## Option 8D: Multi-Region Replication
```
Pattern: Real-time copy to another region
```

**Best for:**
- Disaster recovery
- Global read performance
- Compliance (data residency)

**Trade-offs:**
- ✅ Survives region failure
- ✅ Fast failover
- ❌ Cost (double+ infrastructure)
- ❌ Consistency complexity
- ❌ Operational overhead

---

# QUICK REFERENCE: DATABASE BY USE CASE

## For MVP / Side Project
- **Engine:** PostgreSQL (Supabase)
- **Managed:** Yes (Supabase free tier)
- **Schema:** Strict with JSONB for flexibility
- **Multi-tenant:** Shared schema with RLS
- **Migrations:** Supabase migrations or Prisma
- **Queries:** Supabase client (or Prisma)
- **Caching:** None (add later if needed)
- **Backup:** Supabase managed

## For Production SaaS
- **Engine:** PostgreSQL
- **Managed:** Supabase Pro / Neon / RDS
- **Schema:** Strict relational
- **Multi-tenant:** Shared schema with org_id + RLS
- **Migrations:** Prisma or dbmate
- **Queries:** ORM + raw SQL for complex
- **Caching:** Redis for sessions, hot data
- **Backup:** Managed + additional dumps

## For Enterprise / Compliance
- **Engine:** PostgreSQL
- **Managed:** AWS RDS / GCP Cloud SQL
- **Schema:** Strict with audit tables
- **Multi-tenant:** Separate schemas or databases
- **Migrations:** Zero-downtime patterns
- **Queries:** Query builder with audit logging
- **Caching:** Redis with encryption
- **Backup:** WAL archiving + multi-region

## For AI Application
- **Engine:** PostgreSQL + pgvector
- **Managed:** Supabase (has pgvector)
- **Schema:** Relational + vector column
- **Multi-tenant:** Shared schema
- **Migrations:** Standard
- **Queries:** ORM + raw for vector search
- **Caching:** Redis for embeddings cache
- **Backup:** Standard + vector index aware

---

# COHERENCE RULES

```
IF using Supabase THEN:
  - Engine is PostgreSQL
  - Use Supabase client or Prisma
  - RLS for authorization
  - Supabase Auth for users

IF multi-tenant B2B THEN:
  - Every table needs org_id (usually)
  - RLS policies on every table
  - Consider schema-per-tenant for enterprise tier

IF serverless deployment THEN:
  - Need connection pooling
  - Consider serverless-friendly DB (Neon, PlanetScale)
  - Watch for connection limits

IF real-time features THEN:
  - Supabase Realtime or
  - PostgreSQL LISTEN/NOTIFY or
  - Separate pub/sub (Redis)

IF event sourcing THEN:
  - Events table is source of truth
  - Projections for read models
  - Consider PostgreSQL (works well)
```

---

# ANTI-PATTERNS TO AVOID

```
⚠️ MongoDB for relational data
   → Use PostgreSQL with JSONB instead

⚠️ No indexes on foreign keys
   → Always index columns used in JOINs and WHERE

⚠️ SELECT * in production
   → Select only needed columns

⚠️ N+1 queries
   → Use JOINs or batch fetching

⚠️ Storing files in database
   → Use object storage (S3, Supabase Storage)

⚠️ No RLS on multi-tenant tables
   → Data leaks waiting to happen

⚠️ Using database as queue
   → Use proper queue (BullMQ, SQS) for jobs

⚠️ No connection pooling with serverless
   → Will exhaust connections quickly
```
