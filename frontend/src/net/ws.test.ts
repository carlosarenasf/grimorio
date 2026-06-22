import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLiveConnection } from './ws';
import type { Snapshot } from '@grimorio/shared/wire';

const OPEN = 1;
const CLOSED = 3;

/** Minimal fake WebSocket: records sent frames, lets tests drive lifecycle events. */
class FakeWebSocket {
  static instances: FakeWebSocket[] = [];
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  readyState = 0;
  sent: string[] = [];
  onopen: (() => void) | null = null;
  onclose: ((ev: { code: number; wasClean: boolean }) => void) | null = null;
  onerror: ((ev: unknown) => void) | null = null;
  onmessage: ((ev: { data: string }) => void) | null = null;
  url: string;

  constructor(url: string) {
    this.url = url;
    FakeWebSocket.instances.push(this);
  }

  send(data: string): void {
    this.sent.push(data);
  }

  close(): void {
    this.readyState = CLOSED;
    this.onclose?.({ code: 1000, wasClean: true });
  }

  // ---- test helpers ----
  triggerOpen(): void {
    this.readyState = OPEN;
    this.onopen?.();
  }

  triggerMessage(data: unknown): void {
    this.onmessage?.({ data: JSON.stringify(data) });
  }

  triggerUnexpectedClose(): void {
    this.readyState = CLOSED;
    this.onclose?.({ code: 1006, wasClean: false });
  }
}

function lastSocket(): FakeWebSocket {
  const sock = FakeWebSocket.instances[FakeWebSocket.instances.length - 1];
  if (!sock) throw new Error('no FakeWebSocket created');
  return sock;
}

const samplePlayerSnapshot: Snapshot = {
  viewerRole: 'player',
  liveTableId: 't1',
  campaignId: 'c1',
  combatants: [],
  combat: { active: false, round: 0, order: [], currentTurnIndex: 0 },
  rollLog: [],
  eventLog: [],
  version: 1,
  ownCharacterId: null,
};

describe('createLiveConnection', () => {
  beforeEach(() => {
    FakeWebSocket.instances = [];
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('connects to /ws/:campaignId using the injected WebSocket constructor', () => {
    const conn = createLiveConnection({
      campaignId: 'c1',
      baseUrl: 'ws://api.test',
      webSocketCtor: FakeWebSocket as unknown as typeof WebSocket,
    });
    conn.connect();

    expect(FakeWebSocket.instances).toHaveLength(1);
    expect(lastSocket().url).toBe('ws://api.test/ws/c1');
  });

  it('notifies onSnapshot when a {kind:"snapshot"} message arrives', () => {
    const conn = createLiveConnection({
      campaignId: 'c1',
      webSocketCtor: FakeWebSocket as unknown as typeof WebSocket,
    });
    const onSnapshot = vi.fn();
    conn.onSnapshot(onSnapshot);
    conn.connect();
    lastSocket().triggerOpen();

    lastSocket().triggerMessage({ kind: 'snapshot', snapshot: samplePlayerSnapshot });

    expect(onSnapshot).toHaveBeenCalledTimes(1);
    expect(onSnapshot).toHaveBeenCalledWith(samplePlayerSnapshot);
  });

  it('notifies onError when a {kind:"error"} message arrives', () => {
    const conn = createLiveConnection({
      campaignId: 'c1',
      webSocketCtor: FakeWebSocket as unknown as typeof WebSocket,
    });
    const onError = vi.fn();
    conn.onError(onError);
    conn.connect();
    lastSocket().triggerOpen();

    lastSocket().triggerMessage({ kind: 'error', error: { code: 'BadRequest', message: 'nope' } });

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith({ code: 'BadRequest', message: 'nope' });
  });

  it('send() serializes the command as JSON once the socket is open', () => {
    const conn = createLiveConnection({
      campaignId: 'c1',
      webSocketCtor: FakeWebSocket as unknown as typeof WebSocket,
    });
    conn.connect();
    lastSocket().triggerOpen();

    conn.send({ type: 'NextTurn' });

    expect(lastSocket().sent).toHaveLength(1);
    expect(JSON.parse(lastSocket().sent[0]!)).toEqual({ type: 'NextTurn' });
  });

  it('queues send() calls made before the socket is open, flushing them on open', () => {
    const conn = createLiveConnection({
      campaignId: 'c1',
      webSocketCtor: FakeWebSocket as unknown as typeof WebSocket,
    });
    conn.connect();

    conn.send({ type: 'NextTurn' });
    expect(lastSocket().sent).toHaveLength(0);

    lastSocket().triggerOpen();
    expect(lastSocket().sent).toHaveLength(1);
    expect(JSON.parse(lastSocket().sent[0]!)).toEqual({ type: 'NextTurn' });
  });

  it('schedules a reconnect with backoff after an unexpected close', () => {
    vi.useFakeTimers();
    const conn = createLiveConnection({
      campaignId: 'c1',
      webSocketCtor: FakeWebSocket as unknown as typeof WebSocket,
    });
    conn.connect();
    expect(FakeWebSocket.instances).toHaveLength(1);
    lastSocket().triggerOpen();

    lastSocket().triggerUnexpectedClose();

    // No immediate reconnect — it's scheduled.
    expect(FakeWebSocket.instances).toHaveLength(1);

    vi.advanceTimersByTime(2000);

    expect(FakeWebSocket.instances).toHaveLength(2);
    conn.close();
  });

  it('does not reconnect after an explicit close() call', () => {
    vi.useFakeTimers();
    const conn = createLiveConnection({
      campaignId: 'c1',
      webSocketCtor: FakeWebSocket as unknown as typeof WebSocket,
    });
    conn.connect();
    lastSocket().triggerOpen();

    conn.close();
    vi.advanceTimersByTime(30_000);

    expect(FakeWebSocket.instances).toHaveLength(1);
  });

  it('increases backoff delay across repeated unexpected closes', () => {
    vi.useFakeTimers();
    const conn = createLiveConnection({
      campaignId: 'c1',
      webSocketCtor: FakeWebSocket as unknown as typeof WebSocket,
    });
    conn.connect();
    lastSocket().triggerOpen();

    // First disconnect: reconnect after the base delay.
    lastSocket().triggerUnexpectedClose();
    vi.advanceTimersByTime(2000);
    expect(FakeWebSocket.instances).toHaveLength(2);

    // Second disconnect without ever reaching open: backoff should grow,
    // so advancing only the base delay again must NOT reconnect yet.
    lastSocket().triggerUnexpectedClose();
    vi.advanceTimersByTime(1000);
    expect(FakeWebSocket.instances).toHaveLength(2);

    vi.advanceTimersByTime(10_000);
    expect(FakeWebSocket.instances).toHaveLength(3);
    conn.close();
  });
});
