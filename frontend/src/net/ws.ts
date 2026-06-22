/**
 * Resilient WS client for the live table (`backend/src/transport/ws/`).
 *
 * Connects to `/ws/:campaignId`; the server pushes a role-filtered snapshot
 * on connect and after every accepted command (see `connection.ts`'s
 * `OutboundMessage` envelope: `{kind:'snapshot'}` | `{kind:'error'}`).
 *
 * The WebSocket constructor is injectable so tests can drive a FakeWebSocket
 * instead of touching the network. On an unexpected close (anything other
 * than an explicit `close()` call) the connection auto-reconnects with
 * exponential backoff.
 */
import type { Command } from '@grimorio/shared/commands';
import type { Snapshot } from '@grimorio/shared/wire';

export interface LiveError {
  code: string;
  message: string;
}

type ServerMessage = { kind: 'snapshot'; snapshot: Snapshot } | { kind: 'error'; error: LiveError };

export type SnapshotListener = (snapshot: Snapshot) => void;
export type ErrorListener = (error: LiveError) => void;

export interface LiveConnectionOptions {
  campaignId: string;
  /** Base URL for the WS endpoint, e.g. "ws://localhost:3000". */
  baseUrl?: string;
  /** Injectable WebSocket constructor (real `WebSocket` in the browser, a fake in tests). */
  webSocketCtor?: typeof WebSocket;
  /** Base backoff delay in ms before the first reconnect attempt. Default 1000. */
  baseReconnectDelayMs?: number;
  /** Max backoff delay in ms. Default 30000. */
  maxReconnectDelayMs?: number;
}

export interface LiveConnection {
  connect(): void;
  close(): void;
  send(command: Command): void;
  onSnapshot(cb: SnapshotListener): () => void;
  onError(cb: ErrorListener): () => void;
}

function defaultWsBaseUrl(): string {
  const env = (import.meta as { env?: { VITE_API_URL?: string; VITE_WS_URL?: string } }).env;
  if (env?.VITE_WS_URL) return env.VITE_WS_URL;
  const apiUrl = env?.VITE_API_URL ?? 'http://localhost:3000';
  return apiUrl.replace(/^http/, 'ws');
}

function isServerMessage(value: unknown): value is ServerMessage {
  return (
    !!value &&
    typeof value === 'object' &&
    ((value as { kind?: unknown }).kind === 'snapshot' ||
      (value as { kind?: unknown }).kind === 'error')
  );
}

export function createLiveConnection(options: LiveConnectionOptions): LiveConnection {
  const baseUrl = options.baseUrl ?? defaultWsBaseUrl();
  const WsCtor = options.webSocketCtor ?? WebSocket;
  const baseDelay = options.baseReconnectDelayMs ?? 1000;
  const maxDelay = options.maxReconnectDelayMs ?? 30000;

  const snapshotListeners = new Set<SnapshotListener>();
  const errorListeners = new Set<ErrorListener>();

  let socket: WebSocket | null = null;
  let explicitlyClosed = false;
  let reconnectAttempts = 0;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let sendQueue: Command[] = [];

  function url(): string {
    return `${baseUrl}/ws/${options.campaignId}`;
  }

  function clearReconnectTimer(): void {
    if (reconnectTimer !== null) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  }

  function scheduleReconnect(): void {
    if (explicitlyClosed) return;
    const delay = Math.min(baseDelay * 2 ** reconnectAttempts, maxDelay);
    reconnectAttempts += 1;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      openSocket();
    }, delay);
  }

  function flushQueue(): void {
    if (!socket || socket.readyState !== WsCtor.OPEN) return;
    for (const command of sendQueue) {
      socket.send(JSON.stringify(command));
    }
    sendQueue = [];
  }

  function openSocket(): void {
    const ws = new WsCtor(url());
    socket = ws;

    ws.onopen = () => {
      reconnectAttempts = 0;
      flushQueue();
    };

    ws.onmessage = (event: { data: string }) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(event.data);
      } catch {
        return;
      }
      if (!isServerMessage(parsed)) return;
      if (parsed.kind === 'snapshot') {
        for (const cb of snapshotListeners) cb(parsed.snapshot);
      } else {
        for (const cb of errorListeners) cb(parsed.error);
      }
    };

    ws.onclose = () => {
      socket = null;
      if (!explicitlyClosed) {
        scheduleReconnect();
      }
    };

    ws.onerror = () => {
      // Swallow transport errors; `onclose` drives reconnection.
    };
  }

  return {
    connect() {
      explicitlyClosed = false;
      openSocket();
    },

    close() {
      explicitlyClosed = true;
      clearReconnectTimer();
      sendQueue = [];
      socket?.close();
      socket = null;
    },

    send(command: Command) {
      if (socket && socket.readyState === WsCtor.OPEN) {
        socket.send(JSON.stringify(command));
      } else {
        sendQueue.push(command);
      }
    },

    onSnapshot(cb: SnapshotListener) {
      snapshotListeners.add(cb);
      return () => snapshotListeners.delete(cb);
    },

    onError(cb: ErrorListener) {
      errorListeners.add(cb);
      return () => errorListeners.delete(cb);
    },
  };
}
