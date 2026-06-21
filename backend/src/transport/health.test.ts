import Fastify from 'fastify';
import { describe, expect, it } from 'vitest';
import { registerHealth } from './health.js';

describe('registerHealth', () => {
  it('GET /health returns 200 { status: "ok" }', async () => {
    const app = Fastify();
    registerHealth(app);

    const res = await app.inject({ method: 'GET', url: '/health' });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok' });

    await app.close();
  });
});
