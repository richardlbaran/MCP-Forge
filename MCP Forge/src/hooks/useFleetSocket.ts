/**
 * @fileoverview React hook for Fleet Command WebSocket connection.
 * 
 * This hook manages the WebSocket connection to the Fleet server,
 * handling:
 * - Auto-connection and reconnection with exponential backoff
 * - Command sending with convenience methods
 * - Event routing to the Zustand store
 * 
 * @example
 * ```tsx
 * import { useFleetSocket } from '@/hooks/useFleetSocket';
 * 
 * function FleetDashboard() {
 *   const {
 *     connected,
 *     spawnWorker,
 *     submitTask,
 *     subscribeToLogs,
 *   } = useFleetSocket();
 * 
 *   return (
 *     <div>
 *       <span>{connected ? '🟢 Connected' : '🔴 Disconnected'}</span>
 *       <button onClick={() => spawnWorker('my-server')}>
 *         Spawn Worker
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 * 
 * @module hooks/useFleetSocket
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useWorkersStore, FleetEvent } from '../store/workers';

/** Commands that can be sent from client to Fleet server */
type FleetCommand =
  | { type: 'spawn'; serverId: string }
  | { type: 'kill'; workerId: string }
  | { type: 'submit'; tool: string; params: Record<string, unknown> }
  | { type: 'cancel'; taskId: string }
  | { type: 'subscribe:logs'; workerId: string }
  | { type: 'unsubscribe:logs'; workerId: string };

/** Configuration options for useFleetSocket */
interface UseFleetSocketOptions {
  /** WebSocket server URL (default: 'ws://localhost:3001/fleet') */
  url?: string;
  /** Auto-connect on mount (default: true) */
  autoConnect?: boolean;
  /** Base reconnect interval in ms, doubles on each attempt (default: 1000) */
  reconnectInterval?: number;
  /** Maximum reconnection attempts before giving up (default: 10) */
  maxReconnectAttempts?: number;
}

/** Return value of useFleetSocket hook */
interface FleetSocketReturn {
  /** Whether the WebSocket is currently connected */
  connected: boolean;
  /** Error message if connection failed, null otherwise */
  error: string | null;
  /** Manually connect to the Fleet server */
  connect: () => void;
  /** Disconnect from the Fleet server */
  disconnect: () => void;
  /** Send a raw command to the server */
  send: (command: FleetCommand) => void;

  // Convenience methods
  /** Spawn a new worker for the given server ID */
  spawnWorker: (serverId: string) => void;
  /** Kill a worker by ID */
  killWorker: (workerId: string) => void;
  /** Submit a task for execution */
  submitTask: (tool: string, params: Record<string, unknown>) => void;
  /** Cancel a pending or running task */
  cancelTask: (taskId: string) => void;
  /** Subscribe to log stream for a worker */
  subscribeToLogs: (workerId: string) => void;
  /** Unsubscribe from log stream for a worker */
  unsubscribeFromLogs: (workerId: string) => void;
}

const DEFAULT_URL = 'ws://localhost:3001/fleet';
const DEFAULT_RECONNECT_INTERVAL = 1000;
const DEFAULT_MAX_RECONNECT_ATTEMPTS = 10;

/**
 * React hook for managing Fleet Command WebSocket connection.
 * 
 * Handles automatic connection, reconnection with exponential backoff,
 * and provides convenience methods for common operations.
 * 
 * @param options - Configuration options
 * @returns Object containing connection state and control methods
 * 
 * @example
 * ```tsx
 * // Basic usage with auto-connect
 * const { connected, spawnWorker, submitTask } = useFleetSocket();
 * 
 * // Custom configuration
 * const fleet = useFleetSocket({
 *   url: 'ws://custom-host:3001/fleet',
 *   autoConnect: false,
 *   reconnectInterval: 2000,
 *   maxReconnectAttempts: 5,
 * });
 * 
 * // Manual connection control
 * fleet.connect();
 * // ... later
 * fleet.disconnect();
 * ```
 */
export function useFleetSocket(options: UseFleetSocketOptions = {}): FleetSocketReturn {
  const {
    url = DEFAULT_URL,
    autoConnect = true,
    reconnectInterval = DEFAULT_RECONNECT_INTERVAL,
    maxReconnectAttempts = DEFAULT_MAX_RECONNECT_ATTEMPTS,
  } = options;

  // State
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for WebSocket and connection state
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isConnectingRef = useRef(false);
  const shouldReconnectRef = useRef(true);

  // Refs for options (to avoid stale closures)
  const urlRef = useRef(url);
  const reconnectIntervalRef = useRef(reconnectInterval);
  const maxReconnectAttemptsRef = useRef(maxReconnectAttempts);

  // Keep option refs in sync
  urlRef.current = url;
  reconnectIntervalRef.current = reconnectInterval;
  maxReconnectAttemptsRef.current = maxReconnectAttempts;

  // Store selectors - get stable function references
  const handleEvent = useWorkersStore((state) => state.handleEvent);
  const markSubscribed = useWorkersStore((state) => state.markSubscribed);
  const markUnsubscribed = useWorkersStore((state) => state.markUnsubscribed);

  // Refs for store functions (to avoid connect/disconnect dependency changes)
  const handleEventRef = useRef(handleEvent);
  const markSubscribedRef = useRef(markSubscribed);
  const markUnsubscribedRef = useRef(markUnsubscribed);

  // Keep store refs in sync
  handleEventRef.current = handleEvent;
  markSubscribedRef.current = markSubscribed;
  markUnsubscribedRef.current = markUnsubscribed;

  // Ref for connect function (for scheduleReconnect to call)
  const connectRef = useRef<() => void>();

  // Clear any pending reconnect timeout
  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // Calculate backoff delay with exponential increase
  const getBackoffDelay = useCallback(() => {
    const attempt = reconnectAttemptsRef.current;
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s, max 30s
    const delay = Math.min(reconnectIntervalRef.current * Math.pow(2, attempt), 30000);
    return delay;
  }, []);

  // Schedule reconnection (stable - uses refs)
  const scheduleReconnect = useCallback(() => {
    if (!shouldReconnectRef.current) return;
    if (reconnectAttemptsRef.current >= maxReconnectAttemptsRef.current) {
      setError(`Failed to reconnect after ${maxReconnectAttemptsRef.current} attempts`);
      return;
    }

    const delay = getBackoffDelay();
    console.log(
      `[useFleetSocket] Scheduling reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttemptsRef.current})`
    );

    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectAttemptsRef.current += 1;
      connectRef.current?.();
    }, delay);
  }, [getBackoffDelay]);

  // Connect to WebSocket (stable - uses refs internally)
  const connect = useCallback(() => {
    // Prevent multiple simultaneous connections
    if (isConnectingRef.current || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    // Clean up existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    clearReconnectTimeout();
    isConnectingRef.current = true;
    shouldReconnectRef.current = true;
    setError(null);

    const currentUrl = urlRef.current;
    console.log(`[useFleetSocket] Connecting to ${currentUrl}...`);

    try {
      const ws = new WebSocket(currentUrl);

      ws.onopen = () => {
        console.log('[useFleetSocket] Connected');
        isConnectingRef.current = false;
        reconnectAttemptsRef.current = 0;
        setConnected(true);
        setError(null);
      };

      ws.onclose = (event) => {
        console.log(`[useFleetSocket] Disconnected (code: ${event.code})`);
        isConnectingRef.current = false;
        setConnected(false);
        wsRef.current = null;

        // Attempt to reconnect unless explicitly disconnected
        if (shouldReconnectRef.current && !event.wasClean) {
          scheduleReconnect();
        }
      };

      ws.onerror = (event) => {
        console.error('[useFleetSocket] WebSocket error:', event);
        isConnectingRef.current = false;
        setError('WebSocket connection error');
      };

      ws.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data) as FleetEvent;
          handleEventRef.current(data);
        } catch (err) {
          console.error('[useFleetSocket] Failed to parse message:', err);
        }
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('[useFleetSocket] Failed to create WebSocket:', err);
      isConnectingRef.current = false;
      setError(err instanceof Error ? err.message : 'Failed to connect');
      scheduleReconnect();
    }
  }, [clearReconnectTimeout, scheduleReconnect]);

  // Keep connectRef in sync
  connectRef.current = connect;

  // Disconnect from WebSocket (stable)
  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;
    clearReconnectTimeout();
    reconnectAttemptsRef.current = 0;

    if (wsRef.current) {
      console.log('[useFleetSocket] Disconnecting...');
      wsRef.current.close(1000, 'User requested disconnect');
      wsRef.current = null;
    }

    setConnected(false);
  }, [clearReconnectTimeout]);

  // Send a command (stable)
  const send = useCallback((command: FleetCommand) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('[useFleetSocket] Cannot send: not connected');
      return;
    }

    try {
      wsRef.current.send(JSON.stringify(command));
    } catch (err) {
      console.error('[useFleetSocket] Failed to send command:', err);
    }
  }, []);

  // Convenience methods (stable)
  const spawnWorker = useCallback(
    (serverId: string) => {
      send({ type: 'spawn', serverId });
    },
    [send]
  );

  const killWorker = useCallback(
    (workerId: string) => {
      send({ type: 'kill', workerId });
    },
    [send]
  );

  const submitTask = useCallback(
    (tool: string, params: Record<string, unknown>) => {
      send({ type: 'submit', tool, params });
    },
    [send]
  );

  const cancelTask = useCallback(
    (taskId: string) => {
      send({ type: 'cancel', taskId });
    },
    [send]
  );

  const subscribeToLogs = useCallback(
    (workerId: string) => {
      send({ type: 'subscribe:logs', workerId });
      markSubscribedRef.current(workerId);
    },
    [send]
  );

  const unsubscribeFromLogs = useCallback(
    (workerId: string) => {
      send({ type: 'unsubscribe:logs', workerId });
      markUnsubscribedRef.current(workerId);
    },
    [send]
  );

  // Auto-connect on mount, cleanup on unmount
  // Using refs ensures this only runs once on mount/unmount
  useEffect(() => {
    if (autoConnect) {
      connectRef.current?.();
    }

    // Cleanup on unmount only
    return () => {
      shouldReconnectRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounted');
        wsRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run on mount/unmount

  return {
    connected,
    error,
    connect,
    disconnect,
    send,
    spawnWorker,
    killWorker,
    submitTask,
    cancelTask,
    subscribeToLogs,
    unsubscribeFromLogs,
  };
}

export type { FleetCommand, UseFleetSocketOptions, FleetSocketReturn };
