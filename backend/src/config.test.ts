import { describe, expect, it } from 'vitest';
import { assertSafeForProduction, DEFAULT_SESSION_SECRET, loadConfig } from './config.js';

describe('assertSafeForProduction', () => {
  const base = loadConfig({});

  it('passes in non-production (no NODE_ENV, no database)', () => {
    expect(() => assertSafeForProduction(base, {})).not.toThrow();
  });

  it('throws when production uses the default session secret', () => {
    const cfg = { ...base, databaseUrl: 'postgres://x', sessionSecret: DEFAULT_SESSION_SECRET };
    expect(() => assertSafeForProduction(cfg, { NODE_ENV: 'production' })).toThrow(
      /SESSION_SECRET/,
    );
  });

  it('throws when production keeps a wildcard CORS origin', () => {
    const cfg = { ...base, databaseUrl: 'postgres://x', sessionSecret: 'strong', corsOrigin: '*' };
    expect(() => assertSafeForProduction(cfg, { NODE_ENV: 'production' })).toThrow(/CORS_ORIGIN/);
  });

  it('passes in production with a strong secret and explicit origin', () => {
    const cfg = {
      ...base,
      databaseUrl: 'postgres://x',
      sessionSecret: 'a-strong-secret',
      corsOrigin: 'https://grimorio.app',
    };
    expect(() => assertSafeForProduction(cfg, { NODE_ENV: 'production' })).not.toThrow();
  });
});
