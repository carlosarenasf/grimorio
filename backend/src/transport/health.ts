/**
 * Liveness probe used by the deploy platform (Render) and local smoke checks.
 * Deliberately dependency-free: it must answer even if downstream adapters
 * (DB, etc.) are unhealthy, so operators can distinguish "process is up" from
 * "process is fully ready".
 */
import type { FastifyInstance } from 'fastify';

export function registerHealth(app: FastifyInstance): void {
  app.get('/health', async () => ({ status: 'ok' }));
}
