# Shared contracts context

Read `../../context.md` first. Keep this package platform independent.

`src/index.ts` exports the `/api/v1` prefix and Zod health response schema/type. `package.json` exposes compiled ESM and TypeScript declarations from `dist`. `tsconfig.json` builds those files under strict NodeNext resolution. `dist` is generated and ignored.

Run `npm run build -w @starlite/contracts` before consumers. Root dev/build/check commands do this automatically. Add only wire schemas, stable identifiers, and derived types here. Do not import Node APIs, Phaser objects, database clients, application source, credentials, or mutable state. Future commands must have bounded payloads and explicit versioning. Tests should exercise meaningful validation boundaries when those commands are introduced.
