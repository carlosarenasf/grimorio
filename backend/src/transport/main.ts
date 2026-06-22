/**
 * Process entrypoint: load config, wire adapters, build the Fastify app, and
 * listen. Run via `tsx src/transport/main.ts` (see package.json `dev`/`start`).
 */
import { loadConfig, assertSafeForProduction } from '../config.js';
import { buildDeps } from './wiring.js';
import { buildServer } from './buildServer.js';

async function main(): Promise<void> {
  const config = loadConfig();
  assertSafeForProduction(config);
  const { http, ws } = await buildDeps(config);
  const app = buildServer({ http, ws, config, logger: true });

  const address = await app.listen({ port: config.port, host: '0.0.0.0' });
  app.log.info(`Grimorio backend listening on ${address}`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Fatal error starting Grimorio backend:', err);
  process.exit(1);
});
