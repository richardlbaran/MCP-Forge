import type { TemplateDefinition } from '@/types';
import type { TemplateTrigger, TemplateAddresses } from '@/lib/mantic';

// Extended template definition with MANTIC awareness
export interface MANTICTemplateDefinition extends TemplateDefinition {
  addresses?: TemplateAddresses;
  triggers?: TemplateTrigger[];
}

// ============= Built-in Templates =============

export const builtInTemplates: MANTICTemplateDefinition[] = [
  // ─────────────────────────────────────────
  // BLANK STARTER
  // ─────────────────────────────────────────
  {
    name: '_blank',
    display_name: 'Blank Server',
    description: 'A minimal starting point. One tool, zero dependencies. Build exactly what you need from scratch.',
    version: '1.0.0',
    author: 'MCP Forge',
    tags: ['starter', 'minimal', 'custom'],
    variables: [],
    tools: [
      {
        name: 'hello',
        description: 'A simple hello world tool to verify the server works. Returns a greeting message.',
        parameters: {
          name: { type: 'string', required: false, default: 'World', description: 'Name to greet' },
        },
        annotations: { readOnlyHint: true, idempotentHint: true },
      },
    ],
    dependencies: [],
    triggers: [],
    addresses: {},
  },

  // ─────────────────────────────────────────
  // SUPABASE DATABASE
  // ─────────────────────────────────────────
  {
    name: 'supabase',
    display_name: 'Supabase Database',
    description: 'Full Supabase access — query, insert, update, delete, and call Postgres functions. RLS-aware with parameterized queries and pagination support.',
    version: '2.0.0',
    author: 'MCP Forge',
    tags: ['database', 'supabase', 'postgres', 'backend', 'data'],
    variables: [
      { name: 'SUPABASE_URL', type: 'string', required: true, description: 'Your Supabase project URL (e.g. https://abc.supabase.co)' },
      { name: 'SUPABASE_ANON_KEY', type: 'string', required: true, secret: true, description: 'Supabase anon/public key for client-side access with RLS enforcement' },
      { name: 'SUPABASE_SERVICE_KEY', type: 'string', required: false, secret: true, description: 'Service role key for admin operations that bypass RLS. Use with caution.' },
    ],
    tools: [
      {
        name: 'query',
        description: 'Execute a SELECT query on any table. Supports column selection, filtering, ordering, pagination, and joins through foreign key relationships.',
        parameters: {
          table: { type: 'string', required: true, description: 'Table name to query' },
          select: { type: 'string', required: false, default: '*', description: 'Columns to select. Use * for all, or specify columns like "id, name, email". For joins: "*, profiles(*)"' },
          filter: { type: 'object', required: false, description: 'Filter conditions as key-value pairs. Example: {"status": "active", "role": "admin"}' },
          order: { type: 'string', required: false, description: 'Column to order by. Prefix with - for descending. Example: "-created_at"' },
          limit: { type: 'number', required: false, default: 100, description: 'Maximum rows to return (1-1000)' },
          offset: { type: 'number', required: false, default: 0, description: 'Number of rows to skip for pagination' },
        },
        annotations: { readOnlyHint: true, idempotentHint: true },
      },
      {
        name: 'insert',
        description: 'Insert one or more rows into a table. Returns the inserted rows with any server-generated values (IDs, timestamps).',
        parameters: {
          table: { type: 'string', required: true, description: 'Table name' },
          data: { type: 'object', required: true, description: 'Row data as an object, or an array of objects for bulk insert. Example: {"name": "Alice", "email": "alice@example.com"}' },
          upsert: { type: 'boolean', required: false, default: false, description: 'If true, update existing rows on conflict instead of failing' },
        },
        annotations: { destructiveHint: true },
      },
      {
        name: 'update',
        description: 'Update rows matching filter conditions. Always requires a filter to prevent accidental full-table updates.',
        parameters: {
          table: { type: 'string', required: true, description: 'Table name' },
          data: { type: 'object', required: true, description: 'Fields to update as key-value pairs. Example: {"status": "archived"}' },
          filter: { type: 'object', required: true, description: 'Filter to match rows. At least one condition required. Example: {"id": "abc-123"}' },
        },
        annotations: { destructiveHint: true },
      },
      {
        name: 'delete',
        description: 'Delete rows matching filter conditions. Always requires a filter. Returns the deleted rows for confirmation.',
        parameters: {
          table: { type: 'string', required: true, description: 'Table name' },
          filter: { type: 'object', required: true, description: 'Filter to match rows for deletion. At least one condition required.' },
        },
        annotations: { destructiveHint: true },
      },
      {
        name: 'rpc',
        description: 'Call a Postgres function (stored procedure). Useful for complex queries, aggregations, or business logic that lives in the database.',
        parameters: {
          function_name: { type: 'string', required: true, description: 'Name of the Postgres function to call' },
          params: { type: 'object', required: false, description: 'Function parameters as key-value pairs' },
        },
      },
      {
        name: 'schema',
        description: 'Inspect the database schema — list tables, columns, types, and relationships. Useful for understanding the data model before querying.',
        parameters: {
          table: { type: 'string', required: false, description: 'Specific table to inspect. Omit to list all tables.' },
        },
        annotations: { readOnlyHint: true, idempotentHint: true },
      },
    ],
    dependencies: ['@supabase/supabase-js'],
    addresses: {
      decisions: ['Supabase', 'PostgreSQL', 'database', 'backend', 'data storage'],
      constraints: ['row-level security', 'RLS', 'data access', 'multi-tenant'],
      risks: ['database access', 'query performance', 'data integrity', 'authorization'],
      requirements: ['CRUD operations', 'data persistence', 'real-time data'],
    },
    triggers: [
      { decision_contains: 'supabase' },
      { decision_contains: 'postgres' },
      { stack_includes: 'Supabase' },
      { requirement_contains: 'database' },
      { requirement_contains: 'data storage' },
    ],
  },

  // ─────────────────────────────────────────
  // REST API WRAPPER
  // ─────────────────────────────────────────
  {
    name: 'api-wrapper',
    display_name: 'REST API Wrapper',
    description: 'Connect to any REST API with configurable authentication, rate limiting, and response transformation. Supports Bearer, API key, and Basic auth.',
    version: '2.0.0',
    author: 'MCP Forge',
    tags: ['api', 'rest', 'http', 'integration', 'external'],
    variables: [
      { name: 'API_BASE_URL', type: 'string', required: true, description: 'Base URL for the API (e.g. https://api.example.com/v1)' },
      { name: 'API_KEY', type: 'string', required: false, secret: true, description: 'API key for authentication. Sent via the header specified in API_AUTH_HEADER.' },
      { name: 'API_AUTH_HEADER', type: 'string', required: false, default: 'Authorization', description: 'Header name for authentication (e.g. Authorization, X-API-Key, X-Auth-Token)' },
      { name: 'API_AUTH_PREFIX', type: 'string', required: false, default: 'Bearer', description: 'Prefix for the auth header value (e.g. Bearer, Token, Basic). Set to empty for raw key.' },
      { name: 'API_TIMEOUT_MS', type: 'number', required: false, default: 30000, description: 'Request timeout in milliseconds' },
    ],
    tools: [
      {
        name: 'get',
        description: 'Make a GET request. Use for reading data, listing resources, or fetching details.',
        parameters: {
          path: { type: 'string', required: true, description: 'API endpoint path (appended to base URL). Example: "/users/123"' },
          params: { type: 'object', required: false, description: 'Query parameters as key-value pairs. Example: {"page": 1, "per_page": 25}' },
          headers: { type: 'object', required: false, description: 'Additional request headers' },
        },
        annotations: { readOnlyHint: true },
      },
      {
        name: 'post',
        description: 'Make a POST request with a JSON body. Use for creating resources or triggering actions.',
        parameters: {
          path: { type: 'string', required: true, description: 'API endpoint path' },
          body: { type: 'object', required: true, description: 'Request body as JSON' },
          headers: { type: 'object', required: false, description: 'Additional request headers' },
        },
        annotations: { destructiveHint: true },
      },
      {
        name: 'put',
        description: 'Make a PUT request with a JSON body. Use for replacing or fully updating a resource.',
        parameters: {
          path: { type: 'string', required: true, description: 'API endpoint path' },
          body: { type: 'object', required: true, description: 'Request body as JSON' },
          headers: { type: 'object', required: false, description: 'Additional request headers' },
        },
        annotations: { destructiveHint: true },
      },
      {
        name: 'patch',
        description: 'Make a PATCH request with a JSON body. Use for partial updates to a resource.',
        parameters: {
          path: { type: 'string', required: true, description: 'API endpoint path' },
          body: { type: 'object', required: true, description: 'Fields to update as JSON' },
          headers: { type: 'object', required: false, description: 'Additional request headers' },
        },
        annotations: { destructiveHint: true },
      },
      {
        name: 'delete_request',
        description: 'Make a DELETE request. Use for removing resources.',
        parameters: {
          path: { type: 'string', required: true, description: 'API endpoint path. Example: "/users/123"' },
          headers: { type: 'object', required: false, description: 'Additional request headers' },
        },
        annotations: { destructiveHint: true },
      },
    ],
    dependencies: [],
    addresses: {
      decisions: ['API integration', 'REST', 'external service', 'third-party'],
      requirements: ['third-party integration', 'external data', 'API access'],
      risks: ['API rate limits', 'external dependency', 'data synchronization'],
    },
    triggers: [
      { decision_contains: 'api' },
      { decision_contains: 'integration' },
      { requirement_contains: 'external' },
      { requirement_contains: 'third-party' },
    ],
  },

  // ─────────────────────────────────────────
  // GITHUB
  // ─────────────────────────────────────────
  {
    name: 'github',
    display_name: 'GitHub',
    description: 'Interact with GitHub repositories — manage issues, pull requests, releases, and repository settings through the GitHub API.',
    version: '1.0.0',
    author: 'MCP Forge',
    tags: ['github', 'git', 'devops', 'code', 'collaboration'],
    variables: [
      { name: 'GITHUB_TOKEN', type: 'string', required: true, secret: true, description: 'GitHub Personal Access Token (classic or fine-grained) with appropriate scopes' },
      { name: 'GITHUB_OWNER', type: 'string', required: false, description: 'Default repository owner/organization. Can be overridden per-request.' },
      { name: 'GITHUB_REPO', type: 'string', required: false, description: 'Default repository name. Can be overridden per-request.' },
    ],
    tools: [
      {
        name: 'list_issues',
        description: 'List issues for a repository with filtering by state, labels, and assignee.',
        parameters: {
          state: { type: 'string', required: false, default: 'open', description: 'Filter by state: open, closed, or all' },
          labels: { type: 'string', required: false, description: 'Comma-separated label names to filter by' },
          assignee: { type: 'string', required: false, description: 'Filter by assignee username' },
          limit: { type: 'number', required: false, default: 30, description: 'Maximum issues to return' },
        },
        annotations: { readOnlyHint: true },
      },
      {
        name: 'create_issue',
        description: 'Create a new issue in the repository.',
        parameters: {
          title: { type: 'string', required: true, description: 'Issue title' },
          body: { type: 'string', required: false, description: 'Issue body in markdown' },
          labels: { type: 'array', required: false, description: 'Labels to apply' },
          assignees: { type: 'array', required: false, description: 'Usernames to assign' },
        },
      },
      {
        name: 'list_prs',
        description: 'List pull requests with filtering by state and base branch.',
        parameters: {
          state: { type: 'string', required: false, default: 'open', description: 'Filter by state: open, closed, or all' },
          base: { type: 'string', required: false, description: 'Filter by base branch' },
          limit: { type: 'number', required: false, default: 30, description: 'Maximum PRs to return' },
        },
        annotations: { readOnlyHint: true },
      },
      {
        name: 'create_pr',
        description: 'Create a pull request.',
        parameters: {
          title: { type: 'string', required: true, description: 'PR title' },
          body: { type: 'string', required: false, description: 'PR description in markdown' },
          head: { type: 'string', required: true, description: 'Branch containing changes' },
          base: { type: 'string', required: false, default: 'main', description: 'Branch to merge into' },
          draft: { type: 'boolean', required: false, default: false, description: 'Create as draft PR' },
        },
      },
      {
        name: 'get_file',
        description: 'Read a file from the repository at a specific branch or commit.',
        parameters: {
          path: { type: 'string', required: true, description: 'File path in the repository' },
          ref: { type: 'string', required: false, description: 'Branch, tag, or commit SHA. Defaults to default branch.' },
        },
        annotations: { readOnlyHint: true },
      },
      {
        name: 'search_code',
        description: 'Search for code across the repository.',
        parameters: {
          query: { type: 'string', required: true, description: 'Search query. Supports GitHub code search syntax.' },
          limit: { type: 'number', required: false, default: 20, description: 'Maximum results' },
        },
        annotations: { readOnlyHint: true },
      },
    ],
    dependencies: [],
    addresses: {
      decisions: ['GitHub', 'version control', 'code collaboration', 'CI/CD'],
      requirements: ['issue tracking', 'code review', 'pull requests', 'repository management'],
      risks: ['code quality', 'deployment', 'collaboration'],
    },
    triggers: [
      { decision_contains: 'github' },
      { stack_includes: 'GitHub' },
      { requirement_contains: 'issue tracking' },
      { requirement_contains: 'pull request' },
    ],
  },

  // ─────────────────────────────────────────
  // SLACK
  // ─────────────────────────────────────────
  {
    name: 'slack',
    display_name: 'Slack Messenger',
    description: 'Send messages, manage channels, and interact with Slack workspaces. Post rich messages with blocks, threads, and reactions.',
    version: '1.0.0',
    author: 'MCP Forge',
    tags: ['slack', 'messaging', 'notifications', 'collaboration', 'chat'],
    variables: [
      { name: 'SLACK_BOT_TOKEN', type: 'string', required: true, secret: true, description: 'Slack Bot User OAuth Token (xoxb-...). Requires chat:write, channels:read scopes.' },
      { name: 'SLACK_DEFAULT_CHANNEL', type: 'string', required: false, description: 'Default channel ID for messages (e.g. C01ABC23DEF)' },
    ],
    tools: [
      {
        name: 'send_message',
        description: 'Send a message to a Slack channel or thread. Supports plain text and Block Kit for rich formatting.',
        parameters: {
          channel: { type: 'string', required: true, description: 'Channel ID or name (e.g. #general or C01ABC23DEF)' },
          text: { type: 'string', required: true, description: 'Message text. Used as fallback for notifications when blocks are provided.' },
          blocks: { type: 'array', required: false, description: 'Block Kit blocks array for rich message formatting' },
          thread_ts: { type: 'string', required: false, description: 'Thread timestamp to reply in a thread' },
        },
      },
      {
        name: 'list_channels',
        description: 'List public channels in the workspace.',
        parameters: {
          limit: { type: 'number', required: false, default: 100, description: 'Maximum channels to return' },
          exclude_archived: { type: 'boolean', required: false, default: true, description: 'Exclude archived channels' },
        },
        annotations: { readOnlyHint: true },
      },
      {
        name: 'search_messages',
        description: 'Search for messages across the workspace.',
        parameters: {
          query: { type: 'string', required: true, description: 'Search query. Supports Slack search syntax (from:user, in:channel, etc.)' },
          limit: { type: 'number', required: false, default: 20, description: 'Maximum results' },
        },
        annotations: { readOnlyHint: true },
      },
      {
        name: 'add_reaction',
        description: 'Add an emoji reaction to a message.',
        parameters: {
          channel: { type: 'string', required: true, description: 'Channel containing the message' },
          timestamp: { type: 'string', required: true, description: 'Message timestamp' },
          emoji: { type: 'string', required: true, description: 'Emoji name without colons (e.g. "thumbsup")' },
        },
      },
    ],
    dependencies: ['@slack/web-api'],
    addresses: {
      decisions: ['Slack', 'team communication', 'notifications'],
      requirements: ['messaging', 'notifications', 'team alerts', 'chat integration'],
      risks: ['notification fatigue', 'message delivery'],
    },
    triggers: [
      { decision_contains: 'slack' },
      { stack_includes: 'Slack' },
      { requirement_contains: 'notification' },
      { requirement_contains: 'messaging' },
    ],
  },

  // ─────────────────────────────────────────
  // NOTION
  // ─────────────────────────────────────────
  {
    name: 'notion',
    display_name: 'Notion Workspace',
    description: 'Read, create, and update pages and databases in Notion. Query databases with filters and manage page content programmatically.',
    version: '1.0.0',
    author: 'MCP Forge',
    tags: ['notion', 'documentation', 'knowledge-base', 'productivity', 'wiki'],
    variables: [
      { name: 'NOTION_API_KEY', type: 'string', required: true, secret: true, description: 'Notion Internal Integration Token (secret_...)' },
    ],
    tools: [
      {
        name: 'query_database',
        description: 'Query a Notion database with filtering, sorting, and pagination.',
        parameters: {
          database_id: { type: 'string', required: true, description: 'Notion database ID' },
          filter: { type: 'object', required: false, description: 'Filter object following Notion filter syntax' },
          sorts: { type: 'array', required: false, description: 'Sort criteria. Example: [{"property": "Created", "direction": "descending"}]' },
          limit: { type: 'number', required: false, default: 100, description: 'Maximum results (1-100)' },
        },
        annotations: { readOnlyHint: true },
      },
      {
        name: 'create_page',
        description: 'Create a new page in a database or as a child of another page.',
        parameters: {
          parent_id: { type: 'string', required: true, description: 'Parent database or page ID' },
          parent_type: { type: 'string', required: false, default: 'database', description: 'Parent type: "database" or "page"' },
          title: { type: 'string', required: true, description: 'Page title' },
          properties: { type: 'object', required: false, description: 'Database properties as key-value pairs' },
          content: { type: 'string', required: false, description: 'Page body content in markdown' },
        },
      },
      {
        name: 'update_page',
        description: 'Update properties of an existing page.',
        parameters: {
          page_id: { type: 'string', required: true, description: 'Page ID to update' },
          properties: { type: 'object', required: true, description: 'Properties to update as key-value pairs' },
        },
      },
      {
        name: 'get_page',
        description: 'Retrieve a page and its content blocks.',
        parameters: {
          page_id: { type: 'string', required: true, description: 'Page ID to retrieve' },
          include_content: { type: 'boolean', required: false, default: true, description: 'Include page content blocks' },
        },
        annotations: { readOnlyHint: true },
      },
      {
        name: 'search',
        description: 'Search across all pages and databases the integration has access to.',
        parameters: {
          query: { type: 'string', required: true, description: 'Search query text' },
          filter_type: { type: 'string', required: false, description: 'Filter by object type: "page" or "database"' },
          limit: { type: 'number', required: false, default: 20, description: 'Maximum results' },
        },
        annotations: { readOnlyHint: true },
      },
    ],
    dependencies: ['@notionhq/client'],
    addresses: {
      decisions: ['Notion', 'knowledge management', 'documentation', 'wiki'],
      requirements: ['documentation', 'knowledge base', 'project tracking', 'content management'],
      risks: ['knowledge silos', 'documentation drift'],
    },
    triggers: [
      { decision_contains: 'notion' },
      { stack_includes: 'Notion' },
      { requirement_contains: 'documentation' },
      { requirement_contains: 'knowledge base' },
    ],
  },

  // ─────────────────────────────────────────
  // WEB SCRAPER
  // ─────────────────────────────────────────
  {
    name: 'web-scraper',
    display_name: 'Web Scraper',
    description: 'Fetch and extract structured data from web pages. Supports CSS selectors, automatic markdown conversion, and screenshot capture.',
    version: '1.0.0',
    author: 'MCP Forge',
    tags: ['scraping', 'web', 'data-extraction', 'crawling', 'research'],
    variables: [
      { name: 'USER_AGENT', type: 'string', required: false, default: 'MCP-Forge-Scraper/1.0', description: 'User-Agent header for requests' },
      { name: 'RATE_LIMIT_MS', type: 'number', required: false, default: 1000, description: 'Minimum delay between requests in milliseconds' },
    ],
    tools: [
      {
        name: 'fetch_page',
        description: 'Fetch a web page and return its content as clean markdown text, stripping navigation, ads, and boilerplate.',
        parameters: {
          url: { type: 'string', required: true, description: 'URL to fetch' },
          selector: { type: 'string', required: false, description: 'CSS selector to extract specific content (e.g. "article", ".main-content")' },
          wait_for: { type: 'string', required: false, description: 'CSS selector to wait for before extracting (for JS-rendered content)' },
        },
        annotations: { readOnlyHint: true },
      },
      {
        name: 'extract_data',
        description: 'Extract structured data from a page using CSS selectors. Returns an array of matched elements.',
        parameters: {
          url: { type: 'string', required: true, description: 'URL to scrape' },
          selectors: { type: 'object', required: true, description: 'Named CSS selectors. Example: {"title": "h1", "price": ".price", "description": ".desc"}' },
          multiple: { type: 'boolean', required: false, default: false, description: 'If true, return all matches as an array. If false, return first match only.' },
        },
        annotations: { readOnlyHint: true },
      },
      {
        name: 'extract_links',
        description: 'Extract all links from a page, optionally filtered by pattern.',
        parameters: {
          url: { type: 'string', required: true, description: 'URL to extract links from' },
          pattern: { type: 'string', required: false, description: 'Regex pattern to filter links. Example: "/blog/.*"' },
          absolute: { type: 'boolean', required: false, default: true, description: 'Convert relative URLs to absolute' },
        },
        annotations: { readOnlyHint: true },
      },
      {
        name: 'screenshot',
        description: 'Capture a screenshot of a web page.',
        parameters: {
          url: { type: 'string', required: true, description: 'URL to screenshot' },
          width: { type: 'number', required: false, default: 1280, description: 'Viewport width in pixels' },
          height: { type: 'number', required: false, default: 720, description: 'Viewport height in pixels' },
          full_page: { type: 'boolean', required: false, default: false, description: 'Capture the full scrollable page' },
        },
        annotations: { readOnlyHint: true },
      },
    ],
    dependencies: ['cheerio', 'puppeteer-core'],
    addresses: {
      decisions: ['web scraping', 'data extraction', 'content aggregation'],
      requirements: ['data collection', 'web data', 'research', 'monitoring'],
      risks: ['rate limiting', 'terms of service', 'data accuracy'],
    },
    triggers: [
      { decision_contains: 'scraping' },
      { decision_contains: 'web data' },
      { requirement_contains: 'extract' },
      { requirement_contains: 'crawl' },
    ],
  },

  // ─────────────────────────────────────────
  // EMAIL / SMTP
  // ─────────────────────────────────────────
  {
    name: 'email',
    display_name: 'Email Sender',
    description: 'Send transactional and notification emails via SMTP or API providers (SendGrid, Resend, Postmark). Supports HTML templates and attachments.',
    version: '1.0.0',
    author: 'MCP Forge',
    tags: ['email', 'smtp', 'notifications', 'transactional', 'messaging'],
    variables: [
      { name: 'EMAIL_PROVIDER', type: 'string', required: false, default: 'smtp', description: 'Provider: smtp, sendgrid, resend, or postmark' },
      { name: 'EMAIL_API_KEY', type: 'string', required: false, secret: true, description: 'API key for cloud email providers' },
      { name: 'SMTP_HOST', type: 'string', required: false, description: 'SMTP server hostname (when using smtp provider)' },
      { name: 'SMTP_PORT', type: 'number', required: false, default: 587, description: 'SMTP port (587 for TLS, 465 for SSL)' },
      { name: 'SMTP_USER', type: 'string', required: false, description: 'SMTP username' },
      { name: 'SMTP_PASS', type: 'string', required: false, secret: true, description: 'SMTP password' },
      { name: 'EMAIL_FROM', type: 'string', required: true, description: 'Default sender address (e.g. "App Name <noreply@example.com>")' },
    ],
    tools: [
      {
        name: 'send',
        description: 'Send an email. Supports plain text, HTML, and markdown content.',
        parameters: {
          to: { type: 'string', required: true, description: 'Recipient email address (or comma-separated for multiple)' },
          subject: { type: 'string', required: true, description: 'Email subject line' },
          body: { type: 'string', required: true, description: 'Email body. Markdown is automatically converted to HTML.' },
          html: { type: 'boolean', required: false, default: true, description: 'Treat body as HTML/markdown (true) or plain text (false)' },
          reply_to: { type: 'string', required: false, description: 'Reply-to address if different from sender' },
        },
      },
      {
        name: 'send_template',
        description: 'Send an email using a pre-defined template with variable substitution.',
        parameters: {
          to: { type: 'string', required: true, description: 'Recipient email address' },
          template_id: { type: 'string', required: true, description: 'Template identifier' },
          variables: { type: 'object', required: false, description: 'Template variables as key-value pairs. Example: {"name": "Alice", "link": "https://..."}' },
        },
      },
    ],
    dependencies: ['nodemailer'],
    addresses: {
      decisions: ['email', 'notifications', 'transactional messaging'],
      requirements: ['email sending', 'notifications', 'user communication', 'alerts'],
      risks: ['email deliverability', 'spam filtering'],
    },
    triggers: [
      { decision_contains: 'email' },
      { requirement_contains: 'email' },
      { requirement_contains: 'notification' },
    ],
  },

  // ─────────────────────────────────────────
  // GTM INTELLIGENCE HUB
  // ─────────────────────────────────────────
  {
    name: 'gtm-hub',
    display_name: 'GTM Intelligence Hub',
    description: 'Capture market insights, track action items, monitor competitors, and manage go-to-market activities. Your strategic intelligence layer.',
    version: '2.0.0',
    author: 'MCP Forge',
    tags: ['gtm', 'marketing', 'intelligence', 'strategy', 'productivity'],
    variables: [
      { name: 'SUPABASE_URL', type: 'string', required: false, description: 'Supabase URL for persistent storage (optional — falls back to in-memory)' },
      { name: 'SUPABASE_ANON_KEY', type: 'string', required: false, secret: true, description: 'Supabase key for persistence' },
    ],
    tools: [
      {
        name: 'capture_insight',
        description: 'Capture and categorize a piece of market intelligence — feedback, competitor move, opportunity, risk, or idea.',
        parameters: {
          content: { type: 'string', required: true, description: 'The insight text. Be specific and actionable.' },
          source: { type: 'string', required: true, description: 'Where this came from (e.g. "Reddit /r/SaaS", "Customer call with Acme Corp", "Twitter thread")' },
          category: { type: 'string', required: true, description: 'Category: feedback, competitor, opportunity, risk, or idea', enum: ['feedback', 'competitor', 'opportunity', 'risk', 'idea'] },
          priority: { type: 'number', required: false, default: 3, description: 'Priority 1 (critical) to 5 (backlog)' },
          tags: { type: 'array', required: false, description: 'Tags for filtering (e.g. ["pricing", "enterprise", "churn"])' },
        },
      },
      {
        name: 'get_insights',
        description: 'Retrieve stored insights with filtering by category, priority, tags, and date range.',
        parameters: {
          category: { type: 'string', required: false, description: 'Filter by category' },
          min_priority: { type: 'number', required: false, description: 'Minimum priority level (1-5)' },
          tags: { type: 'array', required: false, description: 'Filter by tags (matches any)' },
          since: { type: 'string', required: false, description: 'Only show insights after this date (ISO 8601)' },
          limit: { type: 'number', required: false, default: 20, description: 'Maximum results' },
        },
        annotations: { readOnlyHint: true },
      },
      {
        name: 'add_action_item',
        description: 'Create a strategic action item tied to an insight or initiative.',
        parameters: {
          title: { type: 'string', required: true, description: 'Action item title — be specific and measurable' },
          description: { type: 'string', required: false, description: 'Additional context or acceptance criteria' },
          priority: { type: 'number', required: false, default: 3, description: 'Priority 1-5' },
          due_date: { type: 'string', required: false, description: 'Due date (ISO 8601)' },
          owner: { type: 'string', required: false, description: 'Person responsible' },
          linked_insight_id: { type: 'string', required: false, description: 'ID of related insight' },
        },
      },
      {
        name: 'get_action_items',
        description: 'Get action items filtered by status, priority, and timeframe.',
        parameters: {
          status: { type: 'string', required: false, default: 'open', description: 'Filter: open, done, or all', enum: ['open', 'done', 'all'] },
          timeframe: { type: 'string', required: false, default: 'week', description: 'Due date filter: overdue, today, week, month, or all' },
          owner: { type: 'string', required: false, description: 'Filter by owner' },
        },
        annotations: { readOnlyHint: true },
      },
      {
        name: 'summary_report',
        description: 'Generate a strategic summary report with key insights, open action items, and trend analysis.',
        parameters: {
          days: { type: 'number', required: false, default: 7, description: 'Number of days to include in the report' },
          format: { type: 'string', required: false, default: 'markdown', description: 'Output format: markdown, json, or brief' },
        },
        annotations: { readOnlyHint: true },
      },
    ],
    dependencies: ['@supabase/supabase-js'],
    addresses: {
      priorities: ['launch', 'go-to-market', 'user acquisition', 'growth'],
      risks: ['user adoption', 'market timing', 'competition', 'positioning'],
      decisions: ['marketing strategy', 'community', 'pricing', 'distribution'],
    },
    triggers: [
      { risk_contains: 'adoption' },
      { risk_contains: 'competition' },
      { decision_contains: 'community' },
      { decision_contains: 'marketing' },
      { decision_contains: 'pricing' },
    ],
  },

  // ─────────────────────────────────────────
  // APP HEALTH MONITOR
  // ─────────────────────────────────────────
  {
    name: 'health-monitor',
    display_name: 'App Health Monitor',
    description: 'Analyze code quality, cyclomatic complexity, dead code, and security issues. Get actionable improvement suggestions backed by static analysis.',
    version: '2.0.0',
    author: 'MCP Forge',
    tags: ['monitoring', 'code-quality', 'development', 'analysis', 'security'],
    variables: [
      { name: 'PROJECT_PATH', type: 'string', required: true, description: 'Absolute path to the project root directory' },
      { name: 'GITHUB_REPO', type: 'string', required: false, description: 'GitHub repo in owner/repo format for CI/CD integration' },
      { name: 'GITHUB_TOKEN', type: 'string', required: false, secret: true, description: 'GitHub PAT for accessing CI status and PR checks' },
    ],
    tools: [
      {
        name: 'run_health_check',
        description: 'Run a comprehensive health check covering TypeScript errors, lint issues, test results, build status, and dependency vulnerabilities.',
        parameters: {
          checks: { type: 'array', required: false, description: 'Specific checks to run: typescript, lint, tests, build, dependencies, security. Omit for all.' },
          fix: { type: 'boolean', required: false, default: false, description: 'Attempt to auto-fix lint and formatting issues' },
        },
        annotations: { readOnlyHint: true },
      },
      {
        name: 'analyze_complexity',
        description: 'Calculate cyclomatic complexity for functions and components. Flags anything above the threshold as needing refactoring.',
        parameters: {
          path: { type: 'string', required: false, description: 'Specific file or directory to analyze. Defaults to entire project.' },
          threshold: { type: 'number', required: false, default: 10, description: 'Complexity score above which to flag functions' },
          top_n: { type: 'number', required: false, default: 20, description: 'Show only the N most complex functions' },
        },
        annotations: { readOnlyHint: true },
      },
      {
        name: 'find_dead_code',
        description: 'Detect unused exports, unreachable code paths, orphaned files, and unused dependencies.',
        parameters: {
          include_tests: { type: 'boolean', required: false, default: false, description: 'Include test files in analysis' },
        },
        annotations: { readOnlyHint: true },
      },
      {
        name: 'suggest_improvements',
        description: 'Get prioritized improvement suggestions based on static analysis, covering performance, security, accessibility, and code maintainability.',
        parameters: {
          focus: { type: 'string', required: false, default: 'all', description: 'Focus area: performance, security, accessibility, maintainability, or all', enum: ['performance', 'security', 'accessibility', 'maintainability', 'all'] },
          max_suggestions: { type: 'number', required: false, default: 10, description: 'Maximum number of suggestions to return' },
        },
        annotations: { readOnlyHint: true },
      },
      {
        name: 'dependency_audit',
        description: 'Audit npm dependencies for vulnerabilities, outdated packages, and license issues.',
        parameters: {
          level: { type: 'string', required: false, default: 'moderate', description: 'Minimum severity level: low, moderate, high, critical' },
        },
        annotations: { readOnlyHint: true },
      },
    ],
    dependencies: [],
    addresses: {
      risks: ['code quality', 'technical debt', 'performance', 'security vulnerabilities'],
      constraints: ['maintainability', 'code standards', 'test coverage'],
      priorities: ['refactoring', 'cleanup', 'stability'],
    },
    triggers: [
      { risk_contains: 'code quality' },
      { risk_contains: 'technical debt' },
      { risk_contains: 'security' },
      { constraint_contains: 'maintainab' },
      { has_delta_type: 'artifact' },
    ],
  },

  // ─────────────────────────────────────────
  // MANTIC EXTRACTOR
  // ─────────────────────────────────────────
  {
    name: 'mantic-extractor',
    display_name: 'MANTIC Extractor',
    description: 'Extract structured project deltas (decisions, requirements, constraints, risks, assumptions) from unstructured text. The foundation of context-aware development.',
    version: '2.0.0',
    author: 'MCP Forge',
    tags: ['ai', 'extraction', 'analysis', 'mantic', 'context'],
    variables: [],
    tools: [
      {
        name: 'extract_deltas',
        description: 'Extract decision, requirement, constraint, risk, question, and assumption deltas from text. Returns structured data with confidence scores and source citations.',
        parameters: {
          text: { type: 'string', required: true, description: 'Text to analyze — meeting notes, PRDs, Slack threads, emails, or any unstructured text' },
          delta_types: { type: 'array', required: false, description: 'Specific delta types to extract. Omit for all types.' },
          min_confidence: { type: 'number', required: false, default: 0.5, description: 'Minimum confidence threshold (0.0-1.0). Higher = fewer but more accurate results.' },
        },
        annotations: { readOnlyHint: true, idempotentHint: true },
      },
      {
        name: 'get_signatures',
        description: 'Generate compact delta signatures for text — a fingerprint showing the distribution and types of deltas found.',
        parameters: {
          text: { type: 'string', required: true, description: 'Text to analyze' },
        },
        annotations: { readOnlyHint: true, idempotentHint: true },
      },
      {
        name: 'analyze_coherence',
        description: 'Check for contradictions and conflicts between decisions, requirements, and constraints in the text. Identifies logical inconsistencies.',
        parameters: {
          text: { type: 'string', required: true, description: 'Text to analyze for coherence' },
          strict: { type: 'boolean', required: false, default: false, description: 'Strict mode flags potential conflicts, not just definite contradictions' },
        },
        annotations: { readOnlyHint: true },
      },
      {
        name: 'compare_schemas',
        description: 'Compare two sets of deltas to find additions, removals, and changes. Useful for tracking how project understanding evolves.',
        parameters: {
          schema_a: { type: 'string', required: true, description: 'First schema or text to compare' },
          schema_b: { type: 'string', required: true, description: 'Second schema or text to compare' },
        },
        annotations: { readOnlyHint: true },
      },
    ],
    dependencies: [],
    addresses: {
      decisions: ['MANTIC', 'extraction', 'context management', 'knowledge capture'],
      requirements: ['delta extraction', 'context tracking', 'project understanding'],
    },
    triggers: [
      { decision_contains: 'mantic' },
      { decision_contains: 'context' },
      { stack_includes: 'MANTIC' },
      { requirement_contains: 'context tracking' },
    ],
  },

  // ─────────────────────────────────────────
  // FILE SYSTEM
  // ─────────────────────────────────────────
  {
    name: 'file-system',
    display_name: 'File System',
    description: 'Sandboxed file operations — read, write, search, and manage files within a specified root directory. Prevents access outside the root path.',
    version: '2.0.0',
    author: 'MCP Forge',
    tags: ['files', 'filesystem', 'local', 'io', 'storage'],
    variables: [
      { name: 'ROOT_PATH', type: 'string', required: true, description: 'Root directory for all operations. All paths are resolved relative to this. No access outside this directory.' },
      { name: 'ALLOWED_EXTENSIONS', type: 'string', required: false, description: 'Comma-separated list of allowed file extensions (e.g. ".ts,.tsx,.json"). Omit to allow all.' },
      { name: 'MAX_FILE_SIZE_MB', type: 'number', required: false, default: 10, description: 'Maximum file size in MB for read/write operations' },
    ],
    tools: [
      {
        name: 'read_file',
        description: 'Read the contents of a file. Returns the full text content with line numbers.',
        parameters: {
          path: { type: 'string', required: true, description: 'File path relative to root directory' },
          encoding: { type: 'string', required: false, default: 'utf-8', description: 'File encoding' },
          line_start: { type: 'number', required: false, description: 'Start reading from this line number (1-indexed)' },
          line_end: { type: 'number', required: false, description: 'Stop reading at this line number' },
        },
        annotations: { readOnlyHint: true },
      },
      {
        name: 'write_file',
        description: 'Write content to a file. Creates the file if it does not exist. Creates parent directories as needed.',
        parameters: {
          path: { type: 'string', required: true, description: 'File path relative to root directory' },
          content: { type: 'string', required: true, description: 'Content to write' },
          append: { type: 'boolean', required: false, default: false, description: 'Append to existing file instead of overwriting' },
          create_dirs: { type: 'boolean', required: false, default: true, description: 'Create parent directories if they do not exist' },
        },
        annotations: { destructiveHint: true },
      },
      {
        name: 'list_files',
        description: 'List files and directories at a given path. Returns name, type, size, and modification time.',
        parameters: {
          path: { type: 'string', required: false, default: '.', description: 'Directory path relative to root' },
          recursive: { type: 'boolean', required: false, default: false, description: 'Include files in subdirectories' },
          pattern: { type: 'string', required: false, description: 'Glob pattern to filter results (e.g. "**/*.ts")' },
        },
        annotations: { readOnlyHint: true },
      },
      {
        name: 'delete_file',
        description: 'Delete a file or empty directory.',
        parameters: {
          path: { type: 'string', required: true, description: 'Path to delete, relative to root' },
        },
        annotations: { destructiveHint: true },
      },
      {
        name: 'search_files',
        description: 'Search for files by name pattern and optionally by content. Returns matching file paths with context.',
        parameters: {
          pattern: { type: 'string', required: true, description: 'Glob pattern for file names (e.g. "**/*.tsx")' },
          content_match: { type: 'string', required: false, description: 'Regex pattern to search within file contents' },
          max_results: { type: 'number', required: false, default: 50, description: 'Maximum number of results' },
        },
        annotations: { readOnlyHint: true },
      },
      {
        name: 'file_info',
        description: 'Get metadata about a file — size, type, modification time, permissions.',
        parameters: {
          path: { type: 'string', required: true, description: 'File path relative to root' },
        },
        annotations: { readOnlyHint: true },
      },
    ],
    dependencies: [],
    addresses: {
      requirements: ['file access', 'local storage', 'data persistence', 'file management'],
      constraints: ['offline', 'local-first', 'data sovereignty'],
    },
    triggers: [
      { constraint_contains: 'offline' },
      { constraint_contains: 'local' },
      { requirement_contains: 'file' },
      { requirement_contains: 'local storage' },
    ],
  },

  // ─────────────────────────────────────────
  // CHROME EXTENSION BRIDGE
  // ─────────────────────────────────────────
  {
    name: 'chrome-bridge',
    display_name: 'Chrome Extension Bridge',
    description: 'Interface with Chrome extension APIs — manage storage, interact with tabs, and bridge between Claude and browser extensions.',
    version: '1.0.0',
    author: 'MCP Forge',
    tags: ['chrome', 'extension', 'browser', 'integration'],
    variables: [
      { name: 'EXTENSION_ID', type: 'string', required: false, description: 'Chrome extension ID for targeted communication' },
      { name: 'NATIVE_PORT', type: 'number', required: false, default: 3200, description: 'Port for native messaging host' },
    ],
    tools: [
      {
        name: 'get_extension_storage',
        description: 'Read data from the extension storage area (chrome.storage.local or chrome.storage.sync).',
        parameters: {
          keys: { type: 'array', required: false, description: 'Specific keys to retrieve. Omit to get all stored data.' },
          area: { type: 'string', required: false, default: 'local', description: 'Storage area: "local" (per-device) or "sync" (synced across devices)' },
        },
        annotations: { readOnlyHint: true },
      },
      {
        name: 'set_extension_storage',
        description: 'Write data to the extension storage area.',
        parameters: {
          data: { type: 'object', required: true, description: 'Data to store as key-value pairs' },
          area: { type: 'string', required: false, default: 'local', description: 'Storage area: "local" or "sync"' },
        },
      },
      {
        name: 'get_active_tab',
        description: 'Get information about the currently active browser tab — URL, title, and page state.',
        parameters: {},
        annotations: { readOnlyHint: true },
      },
      {
        name: 'inject_content_script',
        description: 'Execute JavaScript in the context of a browser tab. Returns the evaluation result.',
        parameters: {
          tab_id: { type: 'number', required: true, description: 'Tab ID to inject into' },
          code: { type: 'string', required: true, description: 'JavaScript code to execute in the page context' },
        },
        annotations: { destructiveHint: true },
      },
    ],
    dependencies: [],
    addresses: {
      decisions: ['Chrome extension', 'browser integration', 'browser automation'],
      requirements: ['manifest v3', 'extension storage', 'content scripts', 'browser interaction'],
      constraints: ['Chrome Web Store policies', 'extension permissions', 'manifest v3'],
    },
    triggers: [
      { decision_contains: 'chrome extension' },
      { requirement_contains: 'manifest' },
      { requirement_contains: 'browser' },
      { stack_includes: 'Chrome Extension' },
    ],
  },

  // ─────────────────────────────────────────
  // VECTOR DATABASE / EMBEDDINGS
  // ─────────────────────────────────────────
  {
    name: 'vector-db',
    display_name: 'Vector Database',
    description: 'Store and query vector embeddings for semantic search, RAG (retrieval-augmented generation), and similarity matching. Works with OpenAI, Cohere, or local embeddings.',
    version: '1.0.0',
    author: 'MCP Forge',
    tags: ['ai', 'embeddings', 'vector', 'search', 'rag', 'semantic'],
    variables: [
      { name: 'VECTOR_PROVIDER', type: 'string', required: false, default: 'supabase', description: 'Vector storage provider: supabase (pgvector), pinecone, or local' },
      { name: 'EMBEDDING_PROVIDER', type: 'string', required: false, default: 'openai', description: 'Embedding model provider: openai, cohere, or local' },
      { name: 'OPENAI_API_KEY', type: 'string', required: false, secret: true, description: 'OpenAI API key for embeddings (when using openai provider)' },
      { name: 'SUPABASE_URL', type: 'string', required: false, description: 'Supabase URL (when using supabase provider)' },
      { name: 'SUPABASE_KEY', type: 'string', required: false, secret: true, description: 'Supabase key (when using supabase provider)' },
    ],
    tools: [
      {
        name: 'store',
        description: 'Store text with its vector embedding. Automatically generates the embedding from the content.',
        parameters: {
          content: { type: 'string', required: true, description: 'Text content to store and embed' },
          metadata: { type: 'object', required: false, description: 'Metadata to attach (e.g. {"source": "docs", "category": "api"})' },
          namespace: { type: 'string', required: false, default: 'default', description: 'Namespace for organizing vectors' },
          id: { type: 'string', required: false, description: 'Custom ID. Auto-generated if omitted.' },
        },
      },
      {
        name: 'search',
        description: 'Find semantically similar content using natural language queries. Returns ranked results with similarity scores.',
        parameters: {
          query: { type: 'string', required: true, description: 'Natural language search query' },
          namespace: { type: 'string', required: false, default: 'default', description: 'Namespace to search within' },
          limit: { type: 'number', required: false, default: 5, description: 'Maximum results to return' },
          min_similarity: { type: 'number', required: false, default: 0.7, description: 'Minimum similarity score (0.0-1.0)' },
          filter: { type: 'object', required: false, description: 'Metadata filter to narrow results' },
        },
        annotations: { readOnlyHint: true },
      },
      {
        name: 'delete',
        description: 'Delete stored vectors by ID or metadata filter.',
        parameters: {
          ids: { type: 'array', required: false, description: 'Specific IDs to delete' },
          filter: { type: 'object', required: false, description: 'Metadata filter to match vectors for deletion' },
          namespace: { type: 'string', required: false, default: 'default', description: 'Namespace to delete from' },
        },
        annotations: { destructiveHint: true },
      },
    ],
    dependencies: ['@supabase/supabase-js', 'openai'],
    addresses: {
      decisions: ['vector database', 'semantic search', 'RAG', 'embeddings', 'AI'],
      requirements: ['semantic search', 'knowledge retrieval', 'content similarity', 'AI context'],
      risks: ['AI accuracy', 'context relevance', 'embedding costs'],
    },
    triggers: [
      { decision_contains: 'vector' },
      { decision_contains: 'embedding' },
      { decision_contains: 'RAG' },
      { requirement_contains: 'semantic search' },
      { requirement_contains: 'similarity' },
    ],
  },

  // ─────────────────────────────────────────
  // CRON / SCHEDULER
  // ─────────────────────────────────────────
  {
    name: 'scheduler',
    display_name: 'Task Scheduler',
    description: 'Schedule and manage recurring tasks with cron expressions. Run periodic health checks, data syncs, report generation, and cleanup jobs.',
    version: '1.0.0',
    author: 'MCP Forge',
    tags: ['scheduler', 'cron', 'automation', 'jobs', 'tasks'],
    variables: [
      { name: 'TIMEZONE', type: 'string', required: false, default: 'UTC', description: 'Default timezone for schedules (e.g. America/New_York)' },
      { name: 'MAX_CONCURRENT', type: 'number', required: false, default: 5, description: 'Maximum concurrent running jobs' },
    ],
    tools: [
      {
        name: 'create_job',
        description: 'Create a scheduled job with a cron expression. The job executes a specified MCP tool at the scheduled time.',
        parameters: {
          name: { type: 'string', required: true, description: 'Unique job name' },
          cron: { type: 'string', required: true, description: 'Cron expression (e.g. "0 9 * * MON-FRI" for weekdays at 9am)' },
          tool: { type: 'string', required: true, description: 'MCP tool to execute (server:tool format)' },
          params: { type: 'object', required: false, description: 'Parameters to pass to the tool' },
          enabled: { type: 'boolean', required: false, default: true, description: 'Whether the job starts enabled' },
        },
      },
      {
        name: 'list_jobs',
        description: 'List all scheduled jobs with their status, next run time, and last result.',
        parameters: {
          status: { type: 'string', required: false, description: 'Filter by status: active, paused, or all' },
        },
        annotations: { readOnlyHint: true },
      },
      {
        name: 'toggle_job',
        description: 'Enable or disable a scheduled job.',
        parameters: {
          name: { type: 'string', required: true, description: 'Job name' },
          enabled: { type: 'boolean', required: true, description: 'Enable (true) or disable (false)' },
        },
      },
      {
        name: 'run_now',
        description: 'Trigger an immediate execution of a scheduled job, regardless of its cron schedule.',
        parameters: {
          name: { type: 'string', required: true, description: 'Job name to execute now' },
        },
      },
      {
        name: 'job_history',
        description: 'View execution history for a job — results, errors, and timing.',
        parameters: {
          name: { type: 'string', required: true, description: 'Job name' },
          limit: { type: 'number', required: false, default: 10, description: 'Number of history entries' },
        },
        annotations: { readOnlyHint: true },
      },
    ],
    dependencies: ['cron'],
    addresses: {
      decisions: ['automation', 'scheduling', 'background jobs'],
      requirements: ['recurring tasks', 'periodic execution', 'automation', 'batch processing'],
    },
    triggers: [
      { decision_contains: 'cron' },
      { decision_contains: 'schedule' },
      { requirement_contains: 'recurring' },
      { requirement_contains: 'automation' },
    ],
  },
];

// ============= Template Access Functions =============

export function getAllTemplates(): MANTICTemplateDefinition[] {
  return builtInTemplates;
}

export function getTemplateByName(name: string): MANTICTemplateDefinition | undefined {
  return builtInTemplates.find(t => t.name === name);
}

export function getTemplatesByTag(tag: string): MANTICTemplateDefinition[] {
  return builtInTemplates.filter(t => t.tags.includes(tag));
}

export function searchTemplates(query: string): MANTICTemplateDefinition[] {
  const lowerQuery = query.toLowerCase();
  return builtInTemplates.filter(t =>
    t.name.toLowerCase().includes(lowerQuery) ||
    t.display_name.toLowerCase().includes(lowerQuery) ||
    t.description.toLowerCase().includes(lowerQuery) ||
    t.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}

export function getAllTags(): string[] {
  const tags = new Set<string>();
  builtInTemplates.forEach(t => t.tags.forEach(tag => tags.add(tag)));
  return Array.from(tags).sort();
}

// ============= MANTIC-aware suggestion =============

import type { ProjectSchema } from '@/lib/mantic';
import { matchTrigger } from '@/lib/mantic';

export interface ServerSuggestion {
  template: string;
  display_name: string;
  reason: string;
  confidence: number;
  addresses: string[];
}

export function suggestServersForProject(schema: ProjectSchema): ServerSuggestion[] {
  const suggestions: ServerSuggestion[] = [];

  for (const template of builtInTemplates) {
    if (!template.triggers || template.triggers.length === 0) continue;

    for (const trigger of template.triggers) {
      const result = matchTrigger(schema, trigger);

      if (result.matches) {
        // Check if we already have a suggestion for this template
        const existing = suggestions.find(s => s.template === template.name);

        if (existing) {
          // Update if higher confidence
          if (result.confidence && result.confidence > existing.confidence) {
            existing.confidence = result.confidence;
            existing.reason = result.reason || existing.reason;
          }
        } else {
          suggestions.push({
            template: template.name,
            display_name: template.display_name,
            reason: result.reason || 'Matches project',
            confidence: result.confidence || 0.7,
            addresses: Object.values(template.addresses || {}).flat(),
          });
        }

        break; // One match per template is enough
      }
    }
  }

  return suggestions.sort((a, b) => b.confidence - a.confidence);
}
