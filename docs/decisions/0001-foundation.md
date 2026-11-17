# 0001 — Initial game foundation

Date: 2026-11-06. Status: accepted for the initial scaffold.

## Context

The game needs high visual quality, professional game/backend practices, quick agent onboarding, Pixelorama-only artwork, and a `main` → `prod` workflow. The main game flow is not yet available. Source hosting is a university-managed GitLab, while deployment is intended for DigitalOcean App Platform.

## Decision

Use npm workspaces with strict TypeScript. Phaser manages the pixel scene; the DOM manages accessible controls. Vite builds the browser client. Fastify owns HTTP, configuration validation, and process lifecycle. A small Zod-based shared package owns wire contracts. Keep the API stateless until persistence and multiplayer requirements exist.

Use one multi-stage production container serving the client and API on one origin. Publish through GitLab CI to DigitalOcean Container Registry from `prod` only, then let App Platform watch that image tag. This avoids assuming that a self-hosted GitLab hostname is supported by the GitLab.com source integration. DigitalOcean's generic Git source spec provides a clone URL and branch but no `deploy_on_push` switch; its DOCR image source explicitly supports autodeploy.

## Consequences

The architecture stays small for a hackathon while retaining testable boundaries. Shared contracts need building before consumers. The complete engine adds a material download cost, mitigated initially by lazy loading and the static fallback. No speculative database, networking protocol, ECS, authentication, or cloud resources are introduced. A Docker-capable GitLab runner and registry credentials are required for future deployment.

Sources: [DigitalOcean app spec](https://docs.digitalocean.com/products/app-platform/reference/app-spec/), [container deployment](https://docs.digitalocean.com/products/app-platform/how-to/deploy-from-container-images/).
