# Deployment and release context

Read `../context.md`. Development happens on `main`; only publishable releases reach `prod`. This setup does not provision an app, registry, runner, paid resources, or a `prod` branch.

## Why a registry bridge

The repository is on `gitlab.engr.ship.edu`, not GitLab.com. Do not assume DigitalOcean's GitLab source integration accepts this hostname. The supported path here is GitLab CI → DigitalOcean Container Registry (DOCR) → App Platform. DigitalOcean explicitly supports image autodeploy from DOCR; it requires Linux/AMD64 images. See [container deployment](https://docs.digitalocean.com/products/app-platform/how-to/deploy-from-container-images/) and [app spec reference](https://docs.digitalocean.com/products/app-platform/reference/app-spec/).

## Files

| File                | Role                                                                                                    |
| ------------------- | ------------------------------------------------------------------------------------------------------- |
| `../Dockerfile`     | Multi-stage Node 22 build; production-only dependencies; non-root runtime; port 8080; readiness probe   |
| `../.dockerignore`  | Excludes secrets, Git metadata, source art, generated builds, and local dependencies from build context |
| `../.gitlab-ci.yml` | Quality gate on main/prod/MRs, then prod-push-only image publication                                    |
| `app.template.yaml` | App Platform service/image/autodeploy/health/environment template; replace `YOUR_REGISTRY`              |

## One-time external setup

1. Configure a GitLab runner for this project. The validation job needs a Node 22 container. The release job needs privileged Docker-in-Docker with the TLS client certificate volume shared between service/job (`/certs/client`) and access to npm and DOCR.
2. Protect `main` and `prod` in GitLab. Restrict `prod` pushes to authorized releasers and require a successful validation pipeline for promotion. Protect the production environment as available. CI rules gate publication but do not themselves prevent someone pushing broken code to the branch.
3. Create a DOCR registry. Add GitLab CI variables: `DO_REGISTRY` (registry name), `DO_REGISTRY_USER` (registry login user), and `DO_REGISTRY_TOKEN` (registry push credential). Mark credentials **masked and protected**. Use a credential restricted to the required registry access. Never put it in the repository or prompt log.
4. After release authorization, publish the first validated `prod` image using CI. The job pushes both an immutable commit-SHA tag for traceability and the moving `prod` tag.
5. Copy `app.template.yaml` outside tracked source or replace its registry placeholder with the actual non-secret name. Create the App Platform app from it. Confirm the size/region against available plans, grant the app DOCR pull access, and enable autodeploy for `starlite-diner:prod`.
6. Confirm `/`, all art/font/JS assets, `/api/v1/health`, `/api/v1/ready`, CSP, and the deployment logs on the actual app URL. Trigger a second authorized `prod` release to verify autodeploy end to end.

No DigitalOcean account credentials are available in this scaffold. The template and CI are prepared; actual deployment remains unconfigured until these steps are performed.

## Local container validation

```sh
docker build --platform linux/amd64 -t starlite-diner:local .
docker run --rm --init -p 8080:8080 starlite-diner:local
```

Open `http://127.0.0.1:8080`, including readiness. The Docker runtime binds `0.0.0.0`; development binds loopback. Pin reviewed container image digests when establishing production reproducibility and refresh them deliberately for security updates.

## Promotion

After explicit release authorization and passing the quality/browser gate on `main`:

```sh
git switch prod
git merge --ff-only main
git push origin prod
git switch main
```

For the first release only, create `prod` from the reviewed main revision instead of switching to it. Never use force pushes to promote. If branches diverge, resolve the history deliberately. A main push validates but cannot publish an image. Production image jobs are serialized by a GitLab resource group.

## Rollback

Use App Platform's deployment rollback to a known healthy revision, or select the previous commit-SHA image tag/digest and deploy it. Pause image autodeploy while investigating if needed. Preserve Git history; fix forward on `main`, then promote an approved revision. App Platform rollout success and application readiness both need verification.

## Future state

The container has no durable writable data requirement. Do not use its filesystem for save games. Add a managed persistence service only after data requirements exist. If multiplayer becomes required, revisit authority, connection lifetime, state routing, readiness, and scaling before increasing replica count.
