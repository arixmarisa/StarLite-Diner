import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { API_PREFIX, healthResponseSchema } from '@starlite/contracts';
import { buildServer } from './server.js';
import { readConfig } from './config.js';

const servers: Awaited<ReturnType<typeof buildServer>>[] = [];
const directories: string[] = [];

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => server.close()));
  await Promise.all(
    directories.splice(0).map((path) => rm(path, { recursive: true, force: true })),
  );
});

describe('HTTP boundary', () => {
  it('exposes uncached liveness and readiness with valid contracts and security headers', async () => {
    const server = await buildServer();
    servers.push(server);
    for (const route of ['health', 'ready']) {
      const response = await server.inject(`${API_PREFIX}/${route}`);
      expect(response.statusCode).toBe(200);
      expect(healthResponseSchema.safeParse(response.json()).success).toBe(true);
      expect(response.headers['cache-control']).toBe('no-store');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['content-security-policy']).toContain("frame-ancestors 'none'");
    }
  });

  it('serves the production client without turning unknown API routes into HTML', async () => {
    const path = await mkdtemp(join(tmpdir(), 'starlite-http-'));
    directories.push(path);
    await writeFile(join(path, 'index.html'), '<!doctype html><title>Starlite</title>');
    const server = await buildServer({ staticDirectory: path });
    servers.push(server);
    expect((await server.inject('/')).headers['content-type']).toContain('text/html');
    const demo = await server.inject('/demo');
    expect(demo.statusCode).toBe(200);
    expect(demo.headers['content-type']).toContain('text/html');
    expect((await server.inject('/demo/')).headers.location).toBe('/demo');
    expect((await server.inject('/milkshake')).headers['content-type']).toContain('text/html');
    expect((await server.inject('/milkshake/')).headers.location).toBe('/milkshake');
    expect((await server.inject('/grill')).headers['content-type']).toContain('text/html');
    expect((await server.inject('/grill/')).headers.location).toBe('/grill');
    expect((await server.inject('/design')).headers['content-type']).toContain('text/html');
    expect((await server.inject('/design/')).headers.location).toBe('/design');
    const missing = await server.inject(`${API_PREFIX}/missing`);
    expect(missing.statusCode).toBe(404);
    expect(missing.json()).toEqual({ error: 'Not found' });
    expect((await server.inject('/missing.png')).statusCode).toBe(404);
  });

  it('hides internal error details from the client', async () => {
    const server = await buildServer();
    servers.push(server);
    server.get('/failure', async () => {
      throw new Error('private connection detail');
    });
    const response = await server.inject('/failure');
    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({ error: 'Internal server error' });
    expect(response.body).not.toContain('private');
  });
});

describe('environment configuration', () => {
  it('rejects invalid ports before a process can listen', () => {
    for (const port of ['0', '-1', '65536', '3.5', 'invalid', '']) {
      expect(() => readConfig({ PORT: port })).toThrow();
    }
    expect(readConfig({ PORT: '8080' }).PORT).toBe(8080);
  });

  it('rejects invalid modes and log levels', () => {
    expect(() => readConfig({ NODE_ENV: 'prod' })).toThrow();
    expect(() => readConfig({ LOG_LEVEL: 'verbose' })).toThrow();
  });
});
