# Fleet Command

Real-time worker management dashboard for monitoring and controlling MCP server processes.

## Overview

Fleet Command provides a centralized interface for managing MCP server workers. Each "worker" is a spawned child process running an MCP server, capable of receiving tasks and streaming logs back to the dashboard.

**Why Fleet Command exists:**
- Monitor multiple MCP servers from a single dashboard
- Submit and track tasks in real-time
- Debug servers with live log streaming
- Quickly spawn/kill workers without CLI juggling

## Architecture

Fleet Command consists of three layers:

```
┌─────────────────────────────────────────────────────────┐
│                    React Dashboard                       │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌──────────────┐ │
│  │WorkerGrid│ │TaskQueue│ │LogPanel  │ │CommandPalette│ │
│  └────┬────┘ └────┬────┘ └────┬─────┘ └──────┬───────┘ │
│       │           │           │               │         │
│       └───────────┴───────────┴───────────────┘         │
│                          │                               │
│                  useFleetSocket (hook)                   │
│                          │                               │
└──────────────────────────┼───────────────────────────────┘
                           │ WebSocket
                           ▼
┌──────────────────────────────────────────────────────────┐
│                    FleetWSServer                          │
│              (ws://localhost:3001/fleet)                  │
│                          │                                │
│              ┌───────────┴───────────┐                   │
│              ▼                       ▼                   │
│        Command Router          Event Broadcaster         │
└──────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────┐
│                    WorkerManager                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│  │Worker 1 │ │Worker 2 │ │Worker 3 │ │  ...    │        │
│  │(process)│ │(process)│ │(process)│ │         │        │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘        │
└──────────────────────────────────────────────────────────┘
```

### Key Files

| File | Purpose |
|------|---------|
| `src/lib/fleet-server.ts` | Main entry point combining WS server + worker management |
| `src/lib/fleet-ws-server.ts` | WebSocket server for client connections |
| `src/lib/worker-manager.ts` | Spawns and manages child processes |
| `src/store/workers.ts` | Zustand store for UI state |
| `src/hooks/useFleetSocket.ts` | React hook for WebSocket connection |
| `src/components/fleet/` | UI components |

## Getting Started

### 1. Start the Fleet Server

```bash
npm run fleet:server
```

This starts the WebSocket server on `ws://localhost:3001/fleet`.

### 2. Start the Dashboard

```bash
npm run dev
```

### 3. Navigate to Fleet

Open the dashboard and navigate to the Fleet page. You should see:
- An empty worker grid (no workers running yet)
- The command palette button (or press `⌘K` / `Ctrl+K`)

### 4. Spawn a Worker

Press `⌘K` and select "Spawn Worker", then choose an MCP server. The worker will appear in the grid.

### 5. Submit a Task

Use the command palette to submit a task, specifying the tool name and JSON parameters.

## UI Components

### WorkerGrid

Displays all active workers in a responsive grid layout.

**Features:**
- Filter by status (all/idle/busy/error)
- Sort by status, name, tasks completed, or last activity
- Animated transitions when workers spawn/stop
- Empty state guidance when no workers are running

**Usage:**
```tsx
import { WorkerGrid } from '@/components/fleet';

<WorkerGrid
  workers={workers}
  onKillWorker={(id) => killWorker(id)}
  onSubscribeLogs={(id) => subscribeToLogs(id)}
/>
```

### WorkerCard

Individual worker display card showing:
- Server name and worker ID
- Status indicator (color-coded)
- Current task (if busy)
- Metrics: tasks completed, failed, avg latency
- Actions: kill worker, view logs

### TaskQueue

Displays all tasks with their current status.

**Task statuses:**
- `queued` — Waiting for an available worker
- `running` — Currently being executed
- `completed` — Finished successfully
- `failed` — Encountered an error
- `cancelled` — Manually cancelled

### LiveLogPanel

Real-time log viewer for worker output.

**Features:**
- Subscribe to individual worker logs
- Auto-scroll (toggleable)
- Level filtering (debug/info/warn/error)
- Search/filter logs
- Clear logs
- Timestamp display

### CommandPalette

Quick-access command interface triggered by `⌘K` (Mac) or `Ctrl+K` (Windows/Linux).

**Available commands:**
| Command | Description |
|---------|-------------|
| Spawn Worker | Start a new worker for an MCP server |
| Kill All Workers | Terminate all running workers |
| Submit Task | Execute a tool on an available worker |
| Cancel All Tasks | Cancel all pending/running tasks |
| Toggle Auto-scroll | Enable/disable log auto-scrolling |
| Clear Logs | Clear the log panel |

**Keyboard navigation:**
- `↑/↓` — Navigate commands
- `Enter` — Execute selected command
- `Esc` — Close palette
- Type to search/filter commands

### FleetMinimap

Bird's-eye overview widget showing all workers as colored dots.

**Colors:**
- 🟢 Green — Idle
- 🟡 Yellow — Busy
- 🔴 Red — Error
- ⚪ Gray — Starting/Stopping

## Commands

### Spawning Workers

**Via Command Palette:**
1. Press `⌘K`
2. Select "Spawn Worker"
3. Choose the MCP server to spawn

**Via WebSocket:**
```json
{
  "type": "spawn",
  "serverId": "my-server-id",
  "command": "node",
  "args": ["./dist/server.js"]
}
```

### Submitting Tasks

**Via Command Palette:**
1. Press `⌘K`
2. Select "Submit Task"
3. Enter tool name (e.g., `query_database`)
4. Enter JSON params (e.g., `{"sql": "SELECT * FROM users"}`)

**Via WebSocket:**
```json
{
  "type": "submit",
  "tool": "query_database",
  "params": {
    "sql": "SELECT * FROM users"
  }
}
```

### Killing Workers

**Via Command Palette:**
- "Kill All Workers" terminates all workers

**Via Worker Card:**
- Click the kill button on individual worker cards

**Via WebSocket:**
```json
{
  "type": "kill",
  "workerId": "worker-abc123"
}
```

### Managing Logs

**Subscribe to logs:**
```json
{
  "type": "subscribe:logs",
  "workerId": "worker-abc123"
}
```

**Unsubscribe from logs:**
```json
{
  "type": "unsubscribe:logs",
  "workerId": "worker-abc123"
}
```

## WebSocket Protocol

### Connection

Connect to `ws://localhost:3001/fleet` (default).

### Events (Server → Client)

All events are JSON objects with a `type` field.

#### Worker Events

```typescript
// Worker started
{ type: 'worker:started', worker: Worker }

// Worker state changed
{ type: 'worker:updated', workerId: string, changes: Partial<Worker> }

// Worker terminated
{ type: 'worker:stopped', workerId: string }
```

#### Task Events

```typescript
// Task added to queue
{ type: 'task:queued', task: Task }

// Task execution began
{ type: 'task:started', taskId: string, workerId: string }

// Task progress update (0-100)
{ type: 'task:progress', taskId: string, progress: number }

// Task completed successfully
{ type: 'task:completed', taskId: string, result: unknown }

// Task failed
{ type: 'task:failed', taskId: string, error: string }
```

#### Log Events

```typescript
// Log entry (only sent to subscribed clients)
{
  type: 'log:entry',
  entry: {
    id: string,
    workerId: string,
    timestamp: string,
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    meta?: Record<string, unknown>
  }
}
```

### Commands (Client → Server)

```typescript
// Spawn a new worker
{ type: 'spawn', serverId: string }

// Kill a worker
{ type: 'kill', workerId: string }

// Submit a task
{ type: 'submit', tool: string, params: Record<string, unknown> }

// Cancel a task
{ type: 'cancel', taskId: string }

// Subscribe to worker logs
{ type: 'subscribe:logs', workerId: string }

// Unsubscribe from worker logs
{ type: 'unsubscribe:logs', workerId: string }
```

## Configuration

### WebSocket Server Options

When instantiating `FleetServer`:

```typescript
const server = new FleetServer({
  wsPort: 3001,        // WebSocket port (default: 3001)
  wsPath: '/fleet',    // WebSocket path (default: /fleet)
  serverRegistry: myRegistry, // Optional: for resolving serverId to spawn config
});
```

### useFleetSocket Hook Options

```typescript
const fleet = useFleetSocket({
  url: 'ws://localhost:3001/fleet', // WebSocket URL
  autoConnect: true,                 // Connect on mount (default: true)
  reconnectInterval: 1000,           // Base reconnect delay in ms
  maxReconnectAttempts: 10,          // Max reconnect attempts
});
```

## Troubleshooting

### "WebSocket connection failed"

**Cause:** Fleet server isn't running.

**Solution:**
```bash
npm run fleet:server
```

### Workers spawn but immediately error

**Cause:** Invalid command or missing executable.

**Solution:** Ensure the MCP server builds successfully:
```bash
npm run build
node ./dist/your-server.js  # Test manually first
```

### Tasks stay queued forever

**Cause:** No idle workers available.

**Solution:** Spawn a worker first, or check if existing workers are in error state.

### Logs not appearing

**Cause:** Not subscribed to worker logs.

**Solution:** Click "View Logs" on the worker card, or send `subscribe:logs` command.

### High memory usage

**Cause:** Too many log entries retained.

**Solution:** The store automatically limits logs to 500 entries per worker. Use "Clear Logs" to reset.

## Example: Programmatic Usage

```typescript
import { FleetServer } from './src/lib/fleet-server';

const server = new FleetServer({ wsPort: 3001 });

// Start the server
await server.start();

// Access worker manager directly
const worker = server.workers.spawnWorker(
  'my-server',
  'My Server',
  'node',
  ['./dist/server.js']
);

// Submit a task
const task = server.workers.submitTask('hello', { name: 'World' });

// Listen for events
server.workers.on('event', (event) => {
  console.log('Event:', event);
});

// Shutdown
await server.stop();
```

---

## See Also

- [Main README](../README.md)
- [Worker Types](../src/types/workers.ts)
- [useFleetSocket Hook](../src/hooks/useFleetSocket.ts)
