# API context

Read `../../context.md` first. This stateless Fastify service provides a versioned boundary and serves the built client in production.

| File                            | Responsibility                                                                               |
| ------------------------------- | -------------------------------------------------------------------------------------------- |
| `src/config.ts`                 | Zod validation of host, port, environment, log level                                         |
| `src/server.ts`                 | Testable server factory, Helmet, health/readiness, optional static files, error boundary     |
| `src/index.ts`                  | Process startup, production static directory, SIGINT/SIGTERM draining with a 10s deadline    |
| `src/server.test.ts`            | HTTP contracts, security headers, static hosting/404s, error redaction, configuration bounds |
| `package.json`, `tsconfig.json` | Node ESM build/start commands and strict compilation                                         |

## HTTP surface

Production explicitly serves the layout editor shell at `GET /design`; `GET /design/` redirects to `/design`. This adds no upload, layout mutation or persistence endpoint.

| Route                          | Behavior                                                                  |
| ------------------------------ | ------------------------------------------------------------------------- |
| `GET /api/v1/health`           | 200 JSON `{status:"ok",service:"starlite-api",version:"0.1.0"}`, uncached |
| `GET /api/v1/ready`            | Same while no external dependencies exist                                 |
| `/` and existing static assets | Built client, only when production static hosting is enabled              |
| `GET /demo`                    | Explicit web shell for movement concept, production static hosting only   |
| `GET /demo/`                   | Redirect to `/demo`                                                       |
| `GET /milkshake`               | Explicit client shell for standalone cooking concept                      |
| `GET /milkshake/`              | Redirect to `/milkshake`                                                  |
| `GET /grill`                   | Explicit client shell for standalone grill concept                        |
| `GET /grill/`                  | Redirect to `/grill`                                                      |
| Other paths                    | JSON 404; never silently return the web shell                             |

## Environment

Production also explicitly serves the client shell at `GET /milkshake` for the standalone station concept; `GET /milkshake/` redirects to `/milkshake`. It adds no mutating API or server-authoritative cooking outcomes.

| Variable    | Default       | Rule                                          |
| ----------- | ------------- | --------------------------------------------- |
| `HOST`      | `127.0.0.1`   | Nonempty; production container sets `0.0.0.0` |
| `PORT`      | `3001`        | Integer 1–65535; production uses 8080         |
| `NODE_ENV`  | `development` | `development`, `test`, or `production`        |
| `LOG_LEVEL` | `info`        | Fastify/Pino log level, including `silent`    |

`.env.example` documents names; `.env` is not loaded automatically. Export variables in the shell or deployment runtime. No secrets are required yet. Avoid logging credentials or raw future command payloads. Add request schemas, authentication, rate limits, and explicit authority rules when adding mutating endpoints. The 64 KiB body cap is not a substitute for those controls.
