/**
 * @fileoverview Fleet Server - Main entry point for the Fleet Command system.
 * 
 * Fleet Server combines the WebSocket server and Worker Manager into a unified service
 * for real-time MCP worker management. It handles:
 * 
 * - **Command routing**: Receives commands from WebSocket clients and dispatches to WorkerManager
 * - **Event broadcasting**: Forwards WorkerManager events to connected WebSocket clients
 * - **Log subscription**: Routes log events only to clients subscribed to specific workers
 * 
 * @example
 * ```typescript
 * import { FleetServer } from './fleet-server';
 * 
 * const server = new FleetServer({ wsPort: 3001 });
 * await server.start();
 * 
 * // Access underlying managers
 * server.workers.spawnWorker('my-server', 'My Server', 'node', ['./server.js']);
 * 
 * // Graceful shutdown
 * await server.stop();
 * ```
 * 
 * @module fleet-server
 */

import { FleetWSServer } from './fleet-ws-server';
import { WorkerManager } from './worker-manager';
import type {
  FleetCommand,
  FleetEvent,
  SpawnCommand,
  KillCommand,
  SubmitCommand,
  CancelCommand,
} from '../types/workers';

// ============= Types =============

export interface FleetServerOptions {
  /** WebSocket port (default: 3001) */
  wsPort?: number;
  /** WebSocket path (default: /fleet) */
  wsPath?: string;
  /** Server registry for resolving serverId to spawn config */
  serverRegistry?: ServerRegistry;
}

/** Registry for looking up server spawn configuration */
export interface ServerRegistry {
  getServerConfig(serverId: string): ServerSpawnConfig | undefined;
}

/** Configuration needed to spawn a server as a worker */
export interface ServerSpawnConfig {
  serverId: string;
  serverName: string;
  command: string;
  args?: string[];
}

/** Extended spawn command with full spawn config (for direct use) */
export interface FullSpawnCommand extends SpawnCommand {
  serverName?: string;
  command?: string;
  args?: string[];
}

// ============= Fleet Server =============

/**
 * FleetServer orchestrates the Fleet Command system.
 * 
 * It combines:
 * - {@link FleetWSServer} for real-time client communication
 * - {@link WorkerManager} for spawning and managing worker processes
 * 
 * Commands flow: WebSocket Client → FleetServer → WorkerManager
 * Events flow:   WorkerManager → FleetServer → WebSocket Clients
 * 
 * @example
 * ```typescript
 * const fleet = new FleetServer({
 *   wsPort: 3001,
 *   wsPath: '/fleet',
 *   serverRegistry: myRegistry, // optional
 * });
 * 
 * await fleet.start();
 * console.log(`Fleet running with ${fleet.clientCount} clients`);
 * ```
 */
export class FleetServer {
  private readonly wsServer: FleetWSServer;
  private readonly workerManager: WorkerManager;
  private readonly serverRegistry?: ServerRegistry;
  private isRunning = false;

  /**
   * Create a new FleetServer instance.
   * 
   * @param options - Configuration options
   * @param options.wsPort - WebSocket server port (default: 3001)
   * @param options.wsPath - WebSocket path (default: '/fleet')
   * @param options.serverRegistry - Optional registry for resolving serverId to spawn config
   */
  constructor(options: FleetServerOptions = {}) {
    this.wsServer = new FleetWSServer({
      port: options.wsPort ?? 3001,
      path: options.wsPath ?? '/fleet',
    });

    this.workerManager = new WorkerManager();
    this.serverRegistry = options.serverRegistry;
  }

  // ============= Lifecycle =============

  /**
   * Start the Fleet Server
   * - Starts the WebSocket server
   * - Registers command routing
   * - Subscribes to worker events for broadcasting
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.warn('[FleetServer] Already running');
      return;
    }

    // Register command handler before starting
    this.wsServer.onCommand(this.handleCommand.bind(this));

    // Subscribe to worker manager events
    this.workerManager.on('event', this.handleWorkerEvent.bind(this));

    // Start the WebSocket server
    this.wsServer.start();

    this.isRunning = true;
    console.log('[FleetServer] Started');
  }

  /**
   * Stop the Fleet Server gracefully
   * - Kills all workers
   * - Closes all WebSocket connections
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      console.warn('[FleetServer] Not running');
      return;
    }

    console.log('[FleetServer] Stopping...');

    // Remove event listeners
    this.workerManager.removeAllListeners('event');

    // Shutdown worker manager (kills all workers)
    await this.workerManager.shutdown();

    // Stop WebSocket server
    this.wsServer.stop();

    this.isRunning = false;
    console.log('[FleetServer] Stopped');
  }

  // ============= Status Getters =============

  /**
   * Check if the server is running
   */
  get running(): boolean {
    return this.isRunning;
  }

  /**
   * Get the number of active workers
   */
  get workerCount(): number {
    return this.workerManager.getAllWorkers().length;
  }

  /**
   * Get the number of connected WebSocket clients
   */
  get clientCount(): number {
    return this.wsServer.clientCount;
  }

  /**
   * Get the underlying worker manager (for advanced use)
   */
  get workers(): WorkerManager {
    return this.workerManager;
  }

  /**
   * Get the underlying WebSocket server (for advanced use)
   */
  get ws(): FleetWSServer {
    return this.wsServer;
  }

  // ============= Command Routing (WS → WorkerManager) =============

  /**
   * Handle incoming commands from WebSocket clients
   */
  private handleCommand(command: FleetCommand, clientId: string): void {
    try {
      switch (command.type) {
        case 'spawn':
          this.handleSpawnCommand(command as FullSpawnCommand, clientId);
          break;

        case 'kill':
          this.handleKillCommand(command as KillCommand, clientId);
          break;

        case 'submit':
          this.handleSubmitCommand(command as SubmitCommand, clientId);
          break;

        case 'cancel':
          this.handleCancelCommand(command as CancelCommand, clientId);
          break;

        // subscribe:logs and unsubscribe:logs are handled internally by FleetWSServer
        default:
          console.warn(`[FleetServer] Unknown command type: ${(command as { type: string }).type}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[FleetServer] Error handling command ${command.type}:`, message);
      
      // Send error back to client
      this.wsServer.send(clientId, {
        type: 'task:failed',
        taskId: 'command-error',
        error: message,
      });
    }
  }

  /**
   * Handle spawn command - create a new worker
   */
  private handleSpawnCommand(command: FullSpawnCommand, _clientId: string): void {
    let config: ServerSpawnConfig | undefined;

    // Try to get config from command directly
    if (command.command) {
      config = {
        serverId: command.serverId,
        serverName: command.serverName ?? command.serverId,
        command: command.command,
        args: command.args,
      };
    }
    // Otherwise look up in registry
    else if (this.serverRegistry) {
      config = this.serverRegistry.getServerConfig(command.serverId);
    }

    if (!config) {
      throw new Error(`Cannot spawn server: no config found for serverId "${command.serverId}". Provide command in spawn request or configure a server registry.`);
    }

    console.log(`[FleetServer] Spawning worker for server: ${config.serverName}`);
    
    this.workerManager.spawnWorker(
      config.serverId,
      config.serverName,
      config.command,
      config.args ?? []
    );
  }

  /**
   * Handle kill command - terminate a worker
   */
  private handleKillCommand(command: KillCommand, _clientId: string): void {
    console.log(`[FleetServer] Killing worker: ${command.workerId}`);
    
    const killed = this.workerManager.killWorker(command.workerId);
    if (!killed) {
      throw new Error(`Worker not found: ${command.workerId}`);
    }
  }

  /**
   * Handle submit command - submit a task for execution
   */
  private handleSubmitCommand(command: SubmitCommand, _clientId: string): void {
    console.log(`[FleetServer] Submitting task: ${command.tool}`);
    
    this.workerManager.submitTask(command.tool, command.params);
  }

  /**
   * Handle cancel command - cancel a pending/running task
   */
  private handleCancelCommand(command: CancelCommand, _clientId: string): void {
    console.log(`[FleetServer] Cancelling task: ${command.taskId}`);
    
    const cancelled = this.workerManager.cancelTask(command.taskId);
    if (!cancelled) {
      throw new Error(`Cannot cancel task: ${command.taskId} (not found or already terminal)`);
    }
  }

  // ============= Event Broadcasting (WorkerManager → WS) =============

  /**
   * Handle events from WorkerManager and broadcast to clients
   */
  private handleWorkerEvent(event: FleetEvent): void {
    // Log events go only to subscribed clients
    if (event.type === 'log:entry') {
      this.wsServer.sendToLogSubscribers(event.entry.workerId, event);
      return;
    }

    // All other events broadcast to all clients
    this.wsServer.broadcast(event);
  }
}

// ============= Default Export =============

export default FleetServer;
