import { describe, expect, it, vi } from 'vitest';
import { createSessionStore } from './session.store';

describe('createSessionStore', () => {
  it('starts with a null principal', () => {
    const store = createSessionStore();
    expect(store.get()).toBeNull();
  });

  it('setPrincipal() replaces state and notifies subscribers', () => {
    const store = createSessionStore();
    const listener = vi.fn();
    store.subscribe(listener);

    store.setPrincipal({ userId: 'u1', displayName: 'Gandalf' });

    expect(store.get()).toEqual({ userId: 'u1', displayName: 'Gandalf' });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('clear() resets to null and notifies subscribers', () => {
    const store = createSessionStore();
    store.setPrincipal({ userId: 'u1', displayName: 'Gandalf' });
    const listener = vi.fn();
    store.subscribe(listener);

    store.clear();

    expect(store.get()).toBeNull();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('subscribe() returns an unsubscribe function that stops further notifications', () => {
    const store = createSessionStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    unsubscribe();
    store.setPrincipal({ userId: 'u1', displayName: 'Gandalf' });

    expect(listener).not.toHaveBeenCalled();
  });

  it('supports multiple independent subscribers', () => {
    const store = createSessionStore();
    const a = vi.fn();
    const b = vi.fn();
    store.subscribe(a);
    store.subscribe(b);

    store.setPrincipal({ userId: 'u1', displayName: 'Gandalf' });

    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
  });
});
