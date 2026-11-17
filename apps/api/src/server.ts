import Fastify from 'fastify';
import helmet from '@fastify/helmet';
import fastifyStatic from '@fastify/static';
import { API_PREFIX, healthResponseSchema } from '@starlite/contracts';

interface ServerOptions {
  logger?: boolean | { level: string };
  staticDirectory?: string;
}

/** Build without listening so tests and future process hosts own the lifecycle. */
export async function buildServer(options: ServerOptions = {}) {
  const app = Fastify({ logger: options.logger ?? false, bodyLimit: 64 * 1024 });
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
  });

  const health = healthResponseSchema.parse({
    status: 'ok',
    service: 'starlite-api',
    version: '0.1.0',
  });

  app.get(`${API_PREFIX}/health`, async (_request, reply) => {
    return reply.header('Cache-Control', 'no-store').send(health);
  });
  // Readiness equals liveness while there are no external dependencies.
  app.get(`${API_PREFIX}/ready`, async (_request, reply) => {
    return reply.header('Cache-Control', 'no-store').send(health);
  });

  if (options.staticDirectory) {
    await app.register(fastifyStatic, { root: options.staticDirectory });
    // Explicit client routes preserve real 404s for unknown API/asset paths.
    app.get('/demo', async (_request, reply) => reply.sendFile('index.html'));
    app.get('/demo/', async (_request, reply) => reply.redirect('/demo'));
    app.get('/milkshake', async (_request, reply) => reply.sendFile('index.html'));
    app.get('/milkshake/', async (_request, reply) => reply.redirect('/milkshake'));
    app.get('/grill', async (_request, reply) => reply.sendFile('index.html'));
    app.get('/grill/', async (_request, reply) => reply.redirect('/grill'));
    app.get('/design', async (_request, reply) => reply.sendFile('index.html'));
    app.get('/design/', async (_request, reply) => reply.redirect('/design'));
  }

  app.setNotFoundHandler((_request, reply) => {
    return reply.code(404).send({ error: 'Not found' });
  });

  app.setErrorHandler((error, request, reply) => {
    request.log.error({ err: error }, 'Request failed');
    const statusCode =
      typeof error === 'object' &&
      error !== null &&
      'statusCode' in error &&
      typeof error.statusCode === 'number' &&
      error.statusCode >= 400 &&
      error.statusCode < 500
        ? error.statusCode
        : 500;
    return reply.code(statusCode).send({
      error: statusCode >= 500 ? 'Internal server error' : 'Invalid request',
    });
  });

  return app;
}
