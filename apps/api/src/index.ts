import { fileURLToPath } from 'node:url';
import { readConfig } from './config.js';
import { buildServer } from './server.js';

const config = readConfig(process.env);
const app = await buildServer({
  logger: { level: config.LOG_LEVEL },
  ...(config.NODE_ENV === 'production'
    ? { staticDirectory: fileURLToPath(new URL('../../web/dist/', import.meta.url)) }
    : {}),
});

let shuttingDown = false;
async function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  const deadline = setTimeout(() => process.exit(1), 10_000).unref();
  try {
    await app.close();
  } catch (error) {
    app.log.error(error, 'Shutdown failed');
    process.exitCode = 1;
  } finally {
    clearTimeout(deadline);
  }
}

process.once('SIGINT', () => void shutdown());
process.once('SIGTERM', () => void shutdown());

try {
  await app.listen({ host: config.HOST, port: config.PORT });
} catch (error) {
  app.log.error(error, 'Startup failed');
  await app.close();
  process.exitCode = 1;
}
