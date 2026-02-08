#!/usr/bin/env tsx
/**
 * Fleet Server CLI - Simple command-line launcher for the Fleet Server
 * 
 * Usage:
 *   npm run fleet:server
 *   npx tsx src/lib/fleet-server-cli.ts
 *   npx tsx src/lib/fleet-server-cli.ts --port 3002 --path /ws
 */

import { FleetServer } from './fleet-server';

// ============= Parse CLI Arguments =============

function parseArgs(): { port: number; path: string } {
  const args = process.argv.slice(2);
  let port = 3001;
  let path = '/fleet';

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    if ((arg === '--port' || arg === '-p') && next) {
      port = parseInt(next, 10);
      if (isNaN(port) || port < 1 || port > 65535) {
        console.error(`Invalid port: ${next}`);
        process.exit(1);
      }
      i++;
    } else if ((arg === '--path' || arg === '-P') && next) {
      path = next.startsWith('/') ? next : `/${next}`;
      i++;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Fleet Server - MCP Worker Fleet Command Center

Usage:
  fleet-server [options]

Options:
  -p, --port <number>  WebSocket port (default: 3001)
  -P, --path <string>  WebSocket path (default: /fleet)
  -h, --help           Show this help message

Example:
  npm run fleet:server
  npx tsx src/lib/fleet-server-cli.ts --port 3002 --path /ws
`);
      process.exit(0);
    }
  }

  return { port, path };
}

// ============= Main =============

async function main(): Promise<void> {
  const { port, path } = parseArgs();

  const server = new FleetServer({
    wsPort: port,
    wsPath: path,
  });

  // Handle graceful shutdown
  let shuttingDown = false;

  const shutdown = async (signal: string): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;

    console.log(`\n[CLI] Received ${signal}, shutting down...`);
    
    try {
      await server.stop();
      console.log('[CLI] Fleet server stopped cleanly');
      process.exit(0);
    } catch (error) {
      console.error('[CLI] Error during shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    console.error('[CLI] Uncaught exception:', error);
    shutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason) => {
    console.error('[CLI] Unhandled rejection:', reason);
    shutdown('unhandledRejection');
  });

  // Start the server
  try {
    await server.start();
    console.log(`\n🚀 Fleet Server running on ws://localhost:${port}${path}\n`);
    console.log('Commands accepted:');
    console.log('  • spawn     - Start a new worker');
    console.log('  • kill      - Stop a worker');
    console.log('  • submit    - Submit a task');
    console.log('  • cancel    - Cancel a task');
    console.log('  • subscribe:logs / unsubscribe:logs - Log streaming\n');
    console.log('Press Ctrl+C to stop\n');
  } catch (error) {
    console.error('[CLI] Failed to start server:', error);
    process.exit(1);
  }
}

// Run
main();
