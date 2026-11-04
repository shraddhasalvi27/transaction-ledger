import { app } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { pool } from './db/pool';

const server = app.listen(env.PORT, () => {
  logger.info(`API listening on port ${env.PORT} (${env.NODE_ENV})`);
  logger.info(` http://localhost:${env.PORT}`)
});

async function shutdown(signal: string) {
  logger.info(`${signal} received, shutting down`);
  server.close(async () => {          // stop accepting new requests, finish in-flight ones
    await pool.end();                 // drain DB connections
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();   // force exit if hung
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (err) => {
  logger.error({ err }, 'Unhandled rejection');
  shutdown('unhandledRejection');
});