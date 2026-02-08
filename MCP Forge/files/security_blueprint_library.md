# Security Blueprint Library
## Build-a-Bear for Apps: Security Domain

---

# CATEGORY 1: AUTHENTICATION DEPTH

> "How deeply do we verify identity?"

## Option 1A: Single-Factor (Password Only)
```
Pattern: Username/password is the only credential
```

**Best for:**
- Internal tools with low-sensitivity data
- Rapid prototypes
- When friction must be minimized

**Trade-offs:**
- ✅ Simplest implementation
- ✅ Users understand it
- ✅ No additional dependencies
- ❌ Vulnerable to credential stuffing
- ❌ Phishing susceptible
- ❌ Password reuse risk

**Requirements this creates:**
- Password strength policy
- Secure password hashing (bcrypt, argon2)
- Rate limiting on login
- Account lockout policy

---

## Option 1B: Multi-Factor Authentication (MFA)
```
Pattern: Password + second factor (TOTP, SMS, or push)
```

**Best for:**
- Any application with sensitive data
- B2B applications
- Compliance requirements (SOC2, HIPAA)

**Trade-offs:**
- ✅ Dramatically reduces account takeover
- ✅ Compliance checkbox
- ✅ Industry standard
- ❌ User friction
- ❌ Recovery complexity
- ❌ SMS is weak (SIM swapping)

**Implementation options:**
- TOTP apps (Google Authenticator, Authy)
- Push notifications (Duo, Auth0 Guardian)
- Hardware keys (YubiKey, WebAuthn)
- SMS (last resort, better than nothing)

---

## Option 1C: Passwordless
```
Pattern: No password at all - magic links, WebAuthn, or passkeys
```

**Best for:**
- Consumer apps prioritizing UX
- Modern security posture
- Mobile-first applications

**Trade-offs:**
- ✅ No password to steal or forget
- ✅ Phishing resistant (WebAuthn)
- ✅ Better UX (often)
- ❌ Email/device dependency
- ❌ User education needed
- ❌ Recovery complexity

---

## Option 1D: Risk-Based/Adaptive
```
Pattern: Authentication requirements vary based on risk signals
```

**Best for:**
- Financial applications
- Enterprise with varied access patterns
- When balancing security and UX

**Trade-offs:**
- ✅ Low friction for normal use
- ✅ High friction for suspicious activity
- ✅ Sophisticated security
- ❌ Complex to implement
- ❌ False positives frustrate users
- ❌ Need risk scoring infrastructure

---

# CATEGORY 2: AUTHORIZATION MODEL

> "How do we control what users can access?"

## Option 2A: Role-Based Access Control (RBAC)
```
Pattern: Users assigned roles, roles have permissions
```

**Best for:**
- Most applications
- Clear organizational hierarchy
- When roles are relatively static

**Trade-offs:**
- ✅ Easy to understand
- ✅ Maps to org structure
- ✅ Simple to audit
- ❌ Role explosion over time
- ❌ Coarse-grained
- ❌ Doesn't handle resource-level access well

**Common roles:**
- admin, owner, member, viewer
- super_admin, org_admin, team_admin, user

**Implementation:**
```sql
CREATE TABLE user_roles (
  user_id UUID,
  role TEXT,
  org_id UUID, -- for multi-tenant
  UNIQUE(user_id, org_id)
);
```

---

## Option 2B: Attribute-Based Access Control (ABAC)
```
Pattern: Access decisions based on attributes of user, resource, and environment
```

**Best for:**
- Complex access requirements
- When decisions depend on resource attributes
- Fine-grained control needed

**Trade-offs:**
- ✅ Very flexible
- ✅ Handles complex scenarios
- ✅ Policy-based (can be externalized)
- ❌ Complex to implement and reason about
- ❌ Performance considerations
- ❌ Harder to audit

**Example policy:**
```
ALLOW if user.department == resource.department 
       AND user.clearance >= resource.classification
       AND time.hour BETWEEN 9 AND 17
```

---

## Option 2C: Resource-Based / Owner-Based
```
Pattern: Users can access resources they own or are shared with them
```

**Best for:**
- User-generated content platforms
- Document/file sharing
- Social applications

**Trade-offs:**
- ✅ Intuitive (my stuff, shared stuff)
- ✅ Simple permission model
- ✅ Easy to implement with RLS
- ❌ Sharing becomes complex
- ❌ No organizational hierarchy
- ❌ Orphan resource problems

**Implementation (Supabase RLS):**
```sql
-- Users can see their own resources
CREATE POLICY "Users can view own" ON resources
  FOR SELECT USING (user_id = auth.uid());

-- Or resources shared with them
CREATE POLICY "Users can view shared" ON resources
  FOR SELECT USING (
    id IN (SELECT resource_id FROM shares WHERE shared_with = auth.uid())
  );
```

---

## Option 2D: Permission-Based (Fine-Grained)
```
Pattern: Explicit permissions on specific resources
```

**Best for:**
- Document collaboration (Google Docs style)
- When sharing is core feature
- Granular control requirements

**Trade-offs:**
- ✅ Very precise control
- ✅ Flexible sharing
- ✅ User-controlled permissions
- ❌ Permission table explosion
- ❌ Complex permission checks
- ❌ Inheritance is tricky

**Implementation:**
```sql
CREATE TABLE permissions (
  user_id UUID,
  resource_type TEXT,
  resource_id UUID,
  permission TEXT, -- 'view', 'edit', 'delete', 'share'
  granted_by UUID,
  granted_at TIMESTAMPTZ
);
```

---

## Option 2E: Multi-Tenant Hierarchy
```
Pattern: Organization → Teams → Users → Resources
```

**Best for:**
- B2B SaaS
- When customers have their own structure
- Enterprise features

**Trade-offs:**
- ✅ Maps to business reality
- ✅ Supports org admins
- ✅ Data isolation by tenant
- ❌ Complex permission inheritance
- ❌ Cross-org features are hard
- ❌ Query complexity

**Implementation:**
```sql
CREATE TABLE organizations (id UUID, name TEXT);
CREATE TABLE teams (id UUID, org_id UUID, name TEXT);
CREATE TABLE memberships (user_id UUID, team_id UUID, role TEXT);

-- RLS: Users see their org's data
CREATE POLICY "Org isolation" ON resources
  FOR ALL USING (
    org_id IN (
      SELECT org_id FROM team_memberships 
      WHERE user_id = auth.uid()
    )
  );
```

---

# CATEGORY 3: DATA PROTECTION

> "How do we protect data at rest and in transit?"

## Option 3A: Transport Only (HTTPS)
```
Pattern: Data encrypted in transit, plain text at rest
```

**Best for:**
- Low-sensitivity data
- When database is trusted
- Simple applications

**Trade-offs:**
- ✅ Simple (just use HTTPS)
- ✅ No performance overhead
- ✅ Database queries work normally
- ❌ Data exposed if DB compromised
- ❌ Not compliant for sensitive data
- ❌ Backups contain plain text

---

## Option 3B: Database-Level Encryption (TDE)
```
Pattern: Database encrypts at rest, transparent to application
```

**Best for:**
- Most production applications
- Compliance checkbox (data at rest)
- When using managed database

**Trade-offs:**
- ✅ Transparent to application
- ✅ Protects against disk theft
- ✅ Compliance requirement satisfied
- ❌ DB admin still sees data
- ❌ Doesn't protect against SQL injection
- ❌ Key management at DB level

**Implementation:** 
- Supabase: Enabled by default
- AWS RDS: Enable encryption
- GCP Cloud SQL: Enable encryption

---

## Option 3C: Column-Level Encryption
```
Pattern: Specific sensitive columns encrypted in application
```

**Best for:**
- PII protection (SSN, credit cards)
- When some data is more sensitive
- Compliance with specific field requirements

**Trade-offs:**
- ✅ Protects specific sensitive fields
- ✅ Database queries work on non-encrypted
- ✅ Key per data type possible
- ❌ Can't query encrypted columns
- ❌ Application complexity
- ❌ Key management required

**Implementation:**
```typescript
// Encrypt before storing
const encryptedSSN = encrypt(ssn, KEY);

// Decrypt after retrieving
const ssn = decrypt(row.encrypted_ssn, KEY);
```

---

## Option 3D: End-to-End Encryption (E2E)
```
Pattern: Data encrypted on client, server only sees ciphertext
```

**Best for:**
- Messaging applications
- When you want zero-knowledge
- Privacy-focused products

**Trade-offs:**
- ✅ Server never sees plaintext
- ✅ Maximum privacy
- ✅ Regulatory benefits
- ❌ No server-side search
- ❌ Key management complexity
- ❌ Recovery is a problem
- ❌ Features limited by encryption

---

## Option 3E: Field-Level with Searchable Encryption
```
Pattern: Encrypt but enable limited search capability
```

**Best for:**
- When you need both privacy and functionality
- Healthcare, finance with search needs
- Compliance + usability

**Trade-offs:**
- ✅ Search on encrypted data
- ✅ Compliance friendly
- ❌ Complex implementation
- ❌ Performance overhead
- ❌ Limited query types

---

# CATEGORY 4: SESSION SECURITY

> "How do we manage authenticated sessions?"

## Option 4A: Short-Lived Sessions (Minutes)
```
Pattern: Sessions expire quickly, frequent re-auth
```

**Best for:**
- Banking applications
- High-security contexts
- When idle = risk

**Trade-offs:**
- ✅ Limits exposure window
- ✅ Reduces session hijack risk
- ❌ Poor UX (constant login)
- ❌ Token refresh complexity

---

## Option 4B: Medium Sessions with Sliding Expiry
```
Pattern: Sessions last hours, activity extends them
```

**Best for:**
- Most web applications
- Balance of security and UX
- Active usage patterns

**Trade-offs:**
- ✅ Good UX for active users
- ✅ Reasonable security
- ✅ Standard pattern
- ❌ Long sessions if continuous use
- ❌ Need activity tracking

**Implementation:**
- Access token: 15 minutes
- Refresh token: 7 days
- Activity resets refresh window

---

## Option 4C: Long Sessions (Days/Weeks)
```
Pattern: Stay logged in for extended periods
```

**Best for:**
- Consumer apps (social, content)
- Mobile applications
- Low-sensitivity data

**Trade-offs:**
- ✅ Best UX
- ✅ Mobile-friendly
- ❌ Session hijack window long
- ❌ Device theft risk
- ❌ May need device management

---

## Option 4D: Device-Bound Sessions
```
Pattern: Session tied to specific device, tracked
```

**Best for:**
- When device trust matters
- Account security features
- "Sessions" management UI

**Trade-offs:**
- ✅ User can see active sessions
- ✅ Can revoke specific devices
- ✅ Anomaly detection possible
- ❌ Device fingerprinting complexity
- ❌ Privacy considerations
- ❌ More infrastructure

---

# CATEGORY 5: API SECURITY

> "How do we secure API access?"

## Option 5A: Cookie-Based (Same Origin)
```
Pattern: HttpOnly cookies, same-site policy
```

**Best for:**
- Web applications
- When client and API same origin
- Simplest security model

**Trade-offs:**
- ✅ Browser handles security
- ✅ HttpOnly prevents XSS token theft
- ✅ CSRF protection built-in (SameSite)
- ❌ Doesn't work cross-origin
- ❌ Not for mobile/third-party

---

## Option 5B: Bearer Tokens (JWT)
```
Pattern: Token in Authorization header
```

**Best for:**
- SPAs
- Mobile applications
- Microservices

**Trade-offs:**
- ✅ Stateless servers
- ✅ Works cross-origin
- ✅ Contains claims (no DB lookup)
- ❌ Token stored in JS (XSS vulnerable)
- ❌ Can't revoke without infrastructure
- ❌ Size overhead

**Security measures:**
- Short expiry (15 min)
- Refresh token rotation
- Token in memory, not localStorage

---

## Option 5C: API Keys
```
Pattern: Static keys for machine-to-machine
```

**Best for:**
- Third-party integrations
- Webhooks
- Server-to-server

**Trade-offs:**
- ✅ Simple to implement
- ✅ Easy to rotate
- ✅ Scoped to specific access
- ❌ Not for user contexts
- ❌ Long-lived = more risk
- ❌ Need secure storage

**Implementation:**
```sql
CREATE TABLE api_keys (
  id UUID,
  key_hash TEXT, -- never store plaintext
  user_id UUID,
  scopes TEXT[],
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);
```

---

## Option 5D: OAuth 2.0 / OIDC
```
Pattern: Third-party token issuance
```

**Best for:**
- When others integrate with you
- Enterprise SSO
- Marketplace/platform play

**Trade-offs:**
- ✅ Industry standard
- ✅ Delegated auth
- ✅ Scoped permissions
- ❌ Complex implementation
- ❌ Token management
- ❌ Learning curve

---

# CATEGORY 6: INPUT VALIDATION

> "How do we prevent injection attacks?"

## Option 6A: Parameterized Queries Only
```
Pattern: Never interpolate user input into queries
```

**Best for:**
- Every application (this is baseline)
- SQL injection prevention
- Command injection prevention

**Trade-offs:**
- ✅ Prevents SQL injection
- ✅ Easy with modern ORMs
- ✅ No performance overhead
- ❌ Requires discipline
- ❌ Dynamic queries need care

**Implementation:**
```typescript
// NEVER do this
const query = `SELECT * FROM users WHERE id = '${userId}'`;

// ALWAYS do this
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId);
```

---

## Option 6B: Schema Validation (Zod/Yup)
```
Pattern: Validate all input against explicit schemas
```

**Best for:**
- All applications
- Type safety
- Clear contracts

**Trade-offs:**
- ✅ Type-safe validation
- ✅ Clear error messages
- ✅ Documentation doubles as validation
- ❌ Schema maintenance
- ❌ Runtime overhead (minimal)

**Implementation:**
```typescript
const CreateProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  isPublic: z.boolean().default(false),
});

// In handler
const validated = CreateProjectSchema.parse(req.body);
```

---

## Option 6C: Sanitization + Validation
```
Pattern: Clean input before validation
```

**Best for:**
- User-generated content
- Rich text inputs
- When allowing some HTML

**Trade-offs:**
- ✅ Allows formatted content
- ✅ Removes malicious tags
- ❌ Allowlist vs blocklist decisions
- ❌ Sanitization can break content
- ❌ Must sanitize on output too

**Implementation:**
```typescript
import DOMPurify from 'dompurify';

const clean = DOMPurify.sanitize(userHTML, {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
  ALLOWED_ATTR: ['href']
});
```

---

## Option 6D: Content Security Policy (CSP)
```
Pattern: Browser-enforced rules about content sources
```

**Best for:**
- XSS mitigation
- All web applications
- Defense in depth

**Trade-offs:**
- ✅ Blocks inline scripts
- ✅ Controls resource loading
- ✅ Reports violations
- ❌ Can break functionality
- ❌ Complex to configure
- ❌ Third-party scripts are tricky

**Implementation:**
```
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://trusted.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
```

---

# CATEGORY 7: RATE LIMITING

> "How do we prevent abuse?"

## Option 7A: Fixed Window
```
Pattern: X requests per time window
```

**Best for:**
- Simple APIs
- When precision isn't critical
- Easy implementation

**Trade-offs:**
- ✅ Simple to implement
- ✅ Easy to understand
- ❌ Burst at window boundaries
- ❌ Not smooth

---

## Option 7B: Sliding Window
```
Pattern: Rolling time window for smoother limits
```

**Best for:**
- Production APIs
- When avoiding burst issues
- Better UX

**Trade-offs:**
- ✅ Smoother limiting
- ✅ No boundary gaming
- ❌ More state to track
- ❌ Slightly more complex

---

## Option 7C: Token Bucket
```
Pattern: Tokens replenish over time, spent on requests
```

**Best for:**
- When allowing controlled bursts
- Variable rate needs
- Sophisticated limiting

**Trade-offs:**
- ✅ Allows controlled bursts
- ✅ Smooth rate limiting
- ✅ Flexible
- ❌ More complex
- ❌ Tuning required

---

## Option 7D: Tiered Limits
```
Pattern: Different limits for different users/plans
```

**Best for:**
- SaaS with tiers
- When monetizing API
- Fair use enforcement

**Implementation:**
```typescript
const RATE_LIMITS = {
  free: { requests: 100, window: '1h' },
  pro: { requests: 1000, window: '1h' },
  enterprise: { requests: 10000, window: '1h' },
};
```

---

# CATEGORY 8: SECRETS MANAGEMENT

> "How do we handle sensitive configuration?"

## Option 8A: Environment Variables
```
Pattern: Secrets in env vars, not code
```

**Best for:**
- Most applications
- 12-factor apps
- Simple deployments

**Trade-offs:**
- ✅ Simple
- ✅ Works everywhere
- ✅ Platform support
- ❌ No versioning
- ❌ No fine-grained access
- ❌ Rotation is manual

---

## Option 8B: Secrets Manager (AWS/GCP/Vault)
```
Pattern: Centralized, managed secrets storage
```

**Best for:**
- Enterprise applications
- When rotation is required
- Audit requirements

**Trade-offs:**
- ✅ Rotation support
- ✅ Audit logging
- ✅ Fine-grained access
- ❌ Additional infrastructure
- ❌ Cost
- ❌ Complexity

---

## Option 8C: Encrypted Config Files
```
Pattern: Config encrypted, decrypted at deploy
```

**Best for:**
- When env vars insufficient
- Complex configuration
- Git-ops workflows

**Trade-offs:**
- ✅ Config versioned with code
- ✅ Complex secrets supported
- ❌ Key management
- ❌ Decryption step required

---

# QUICK REFERENCE: SECURITY BY CONTEXT

## For MVP / Low Sensitivity
- Auth: Single-factor (password)
- Authorization: Resource-based (RLS)
- Data: Transport encryption (HTTPS)
- Sessions: Medium with refresh
- API: Cookie-based
- Rate limiting: Fixed window
- Secrets: Environment variables

## For B2B SaaS
- Auth: MFA available, required for admins
- Authorization: RBAC + multi-tenant
- Data: Database-level encryption
- Sessions: Sliding expiry + device tracking
- API: Bearer tokens + API keys for integrations
- Rate limiting: Tiered by plan
- Secrets: Secrets manager

## For Compliance (HIPAA, SOC2)
- Auth: MFA required
- Authorization: ABAC or detailed RBAC with audit
- Data: Column-level encryption for PII
- Sessions: Short-lived + re-auth for sensitive ops
- API: OAuth 2.0 with scopes
- Rate limiting: Adaptive
- Secrets: Secrets manager with rotation

## For Consumer Privacy-First
- Auth: Passwordless + MFA option
- Authorization: Resource-based
- Data: E2E encryption where possible
- Sessions: Device-bound, user-visible
- API: Bearer tokens in memory
- Rate limiting: Sliding window
- Secrets: Environment variables

---

# COHERENCE RULES

```
IF handling PII THEN:
  - Data protection: At minimum column-level encryption
  - Audit logging required
  - Access control must be fine-grained

IF multi-tenant B2B THEN:
  - Authorization must include org isolation
  - RLS required
  - Sessions should track organization context

IF public API THEN:
  - API keys required
  - Rate limiting required
  - OAuth 2.0 for user-context access

IF compliance required THEN:
  - MFA required (at least for admins)
  - Audit logging required
  - Secrets manager recommended
  - Regular rotation policy
```

---

# NEXT: Combine with Architecture Blueprint

Your security choices constrain and are constrained by architecture:

| Architecture | Security Implication |
|--------------|---------------------|
| Serverless | Stateless auth (JWTs), secrets in env/manager |
| Microservices | Service-to-service auth, API gateway |
| Multi-tenant | RLS required, org isolation |
| Edge deployment | Token validation at edge, short TTLs |
