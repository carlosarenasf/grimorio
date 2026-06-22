/**
 * Observable store for the current session principal (who's logged in).
 *
 * Set on register/login success (`ApiClient.register`/`login` resolve with
 * a `Principal`); cleared on logout. Screens subscribe to re-render on
 * login/logout without owning auth state themselves.
 */

export interface Principal {
  userId: string;
  displayName: string;
}

export type SessionListener = () => void;

export interface SessionStore {
  setPrincipal(principal: Principal): void;
  clear(): void;
  get(): Principal | null;
  subscribe(listener: SessionListener): () => void;
}

export function createSessionStore(): SessionStore {
  let state: Principal | null = null;
  const listeners = new Set<SessionListener>();

  function notify(): void {
    for (const listener of listeners) listener();
  }

  return {
    setPrincipal(principal: Principal) {
      state = principal;
      notify();
    },
    clear() {
      state = null;
      notify();
    },
    get() {
      return state;
    },
    subscribe(listener: SessionListener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
