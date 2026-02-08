import { WebSocketServer, WebSocket } from 'ws';
import type { FleetEvent, FleetCommand } from '../types/workers';

// ============= Types =============

interface FleetWSServerOptions {
  /** Port to listen on (default: 3001) */
  port?: number;
  /** WebSocket path (default: /fleet) */
  path?: string;
  /** Heartbeat interval in ms (default: 30000) */
  heartbeatIntervalMs?: number;
}

interface ConnectedClient {
  ws: WebSocket;
  id: string;
  subscribedWorkers: Set<string>;
  isAlive: boolean;
}

type CommandHandler = (cmd: FleetCommand, clientId: string) => void;

// ============= FleetWSServer =============

export class FleetWSServer {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, ConnectedClient> = new Map();
  private commandHandler: CommandHandler | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private clientIdCounter = 0;

  private readonly port: number;
  private readonly path: string;
  private readonly heartbeatIntervalMs: number;

  constructor(options: FleetWSServerOptions = {}) {
    this.port = options.port ?? 3001;
    this.path = options.path ?? '/fleet';
    this.heartbeatIntervalMs = options.heartbeatIntervalMs ?? 30000;
  }

  // ============= Lifecycle =============

  /**
   * Start the WebSocket server
   */
  start(): void {
    if (this.wss) {
      console.warn('[FleetWS] Server already running');
      return;
    }

    this.wss = new WebSocketServer({
      port: this.port,
      path: this.path,
    });

    this.wss.on('connection', this.handleConnection.bind(this));
    this.wss.on('error', this.handleServerError.bind(this));

    // Start heartbeat to detect dead connections
    this.startHeartbeat();

    console.log(`[FleetWS] Server started on ws://localhost:${this.port}${this.path}`);
  }

  /**
   * Stop the WebSocket server and clean up all connections
   */
  stop(): void {
    if (!this.wss) {
      console.warn('[FleetWS] Server not running');
      return;
    }

    // Stop heartbeat
    this.stopHeartbeat();

    // Close all client connections
    for (const client of Array.from(this.clients.values())) {
      try {
        client.ws.close(1001, 'Server shutting down');
      } catch {
        // Ignore errors during shutdown
      }
    }
    this.clients.clear();

    // Close the server
    this.wss.close((err) => {
      if (err) {
        console.error('[FleetWS] Error closing server:', err);
      } else {
        console.log('[FleetWS] Server stopped');
      }
    });
    this.wss = null;
  }

  // ============= Messaging =============

  /**
   * Broadcast an event to all connected clients
   */
  broadcast(event: FleetEvent): void {
    const message = JSON.stringify(event);
    for (const client of Array.from(this.clients.values())) {
      this.safeSend(client.ws, message);
    }
  }

  /**
   * Send an event to a specific client
   */
  send(clientId: string, event: FleetEvent): void {
    const client = this.clients.get(clientId);
    if (!client) {
      console.warn(`[FleetWS] Cannot send to unknown client: ${clientId}`);
      return;
    }
    this.safeSend(client.ws, JSON.stringify(event));
  }

  /**
   * Send an event to all clients subscribed to a specific worker's logs
   */
  sendToLogSubscribers(workerId: string, event: FleetEvent): void {
    const message = JSON.stringify(event);
    for (const client of Array.from(this.clients.values())) {
      if (client.subscribedWorkers.has(workerId)) {
        this.safeSend(client.ws, message);
      }
    }
  }

  // ============= Command Handler =============

  /**
   * Register a handler for incoming commands
   * Commands (except subscribe/unsubscribe) are forwarded to this handler
   */
  onCommand(handler: CommandHandler): void {
    this.commandHandler = handler;
  }

  // ============= Getters =============

  /**
   * Get the number of connected clients
   */
  get clientCount(): number {
    return this.clients.size;
  }

  /**
   * Check if server is running
   */
  get isRunning(): boolean {
    return this.wss !== null;
  }

  // ============= Private: Connection Handling =============

  private handleConnection(ws: WebSocket): void {
    const clientId = this.generateClientId();
    const client: ConnectedClient = {
      ws,
      id: clientId,
      subscribedWorkers: new Set(),
      isAlive: true,
    };

    this.clients.set(clientId, client);
    console.log(`[FleetWS] Client connected: ${clientId} (total: ${this.clients.size})`);

    // Set up event handlers
    ws.on('message', (data) => this.handleMessage(client, data));
    ws.on('close', () => this.handleClose(client));
    ws.on('error', (err) => this.handleClientError(client, err));
    ws.on('pong', () => this.handlePong(client));
  }

  private handleMessage(client: ConnectedClient, data: Buffer | ArrayBuffer | Buffer[]): void {
    try {
      const message = data.toString();
      const command = JSON.parse(message) as FleetCommand;

      // Validate command has a type
      if (!command || typeof command.type !== 'string') {
        console.warn(`[FleetWS] Invalid command from ${client.id}:`, message);
        return;
      }

      // Handle subscription commands internally
      if (command.type === 'subscribe:logs') {
        this.handleSubscribe(client, command.workerId);
        return;
      }

      if (command.type === 'unsubscribe:logs') {
        this.handleUnsubscribe(client, command.workerId);
        return;
      }

      // Forward other commands to the registered handler
      if (this.commandHandler) {
        this.commandHandler(command, client.id);
      } else {
        console.warn(`[FleetWS] No command handler registered, dropping command:`, command.type);
      }
    } catch (err) {
      console.error(`[FleetWS] Error parsing message from ${client.id}:`, err);
    }
  }

  private handleClose(client: ConnectedClient): void {
    this.clients.delete(client.id);
    console.log(`[FleetWS] Client disconnected: ${client.id} (total: ${this.clients.size})`);
  }

  private handleClientError(client: ConnectedClient, err: Error): void {
    console.error(`[FleetWS] Client error (${client.id}):`, err.message);
  }

  private handleServerError(err: Error): void {
    console.error('[FleetWS] Server error:', err);
  }

  // ============= Private: Subscriptions =============

  private handleSubscribe(client: ConnectedClient, workerId: string): void {
    client.subscribedWorkers.add(workerId);
    console.log(`[FleetWS] Client ${client.id} subscribed to logs for worker ${workerId}`);
  }

  private handleUnsubscribe(client: ConnectedClient, workerId: string): void {
    client.subscribedWorkers.delete(workerId);
    console.log(`[FleetWS] Client ${client.id} unsubscribed from logs for worker ${workerId}`);
  }

  // ============= Private: Heartbeat =============

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      for (const client of Array.from(this.clients.values())) {
        if (!client.isAlive) {
          // Client didn't respond to last ping, terminate
          console.log(`[FleetWS] Client ${client.id} timed out, terminating`);
          client.ws.terminate();
          this.clients.delete(client.id);
          continue;
        }

        // Mark as not alive, will be set back to true on pong
        client.isAlive = false;
        try {
          client.ws.ping();
        } catch {
          // Ignore ping errors
        }
      }
    }, this.heartbeatIntervalMs);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private handlePong(client: ConnectedClient): void {
    client.isAlive = true;
  }

  // ============= Private: Utilities =============

  private generateClientId(): string {
    return `client-${Date.now()}-${++this.clientIdCounter}`;
  }

  private safeSend(ws: WebSocket, message: string): void {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(message);
      } catch (err) {
        console.error('[FleetWS] Error sending message:', err);
      }
    }
  }
}

// ============= Default Export =============

export default FleetWSServer;
