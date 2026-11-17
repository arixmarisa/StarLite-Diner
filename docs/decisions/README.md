# Architecture decision records

| Record                                 | Status                     | Decision                                                                                         |
| -------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------ |
| [0001: foundation](0001-foundation.md) | Accepted for initial setup | TypeScript workspace, Phaser rendering, Fastify boundary, stateless API, container-based release |

Create a short numbered record when a significant decision changes the module boundary, deployment model, authority model, or data ownership. Explain the concrete need, tradeoff, and consequences; do not add records for ordinary implementation choices.

[0002: browser progress ownership](0002-browser-progress-saving.md) records the implemented three-slot IndexedDB day-boundary logic, checked revisions/recovery and deferred UI/gameplay integration. Mid-day recovery and prototype saving are excluded.
