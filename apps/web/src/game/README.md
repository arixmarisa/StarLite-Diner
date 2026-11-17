# Game runtime map

Read `../../../../context.md` and the [web workspace guide](../../README.md). The active scope also connects the home Start menu to the compact front-of-house and kitchen rooms with the female player moving around and walking through their connecting doors. `/demo` retains exactly a player and one table. The main route also runs the limited customer walk/sit/stand preview; restaurant service rules remain separate.

| Area                                      | Responsibility                                                                                                               | Context                                    |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `engine/`                                 | Pure simulation, validated world/commands/snapshots, collision, interactions, events, room transitions, tuning and lifecycle | [Actual API](engine/README.md)             |
| `core/fixed-step.ts`                      | Bounded render-independent clock with numerical remainder handling                                                           | Existing clock tests next to source        |
| `input/`                                  | Focus-scoped keyboard intentions and release/teardown                                                                        | [Input guide](input/README.md)             |
| `render/`                                 | Runtime asset metadata boundary                                                                                              | [Rendering metadata](render/README.md)     |
| `front-of-house/`                         | Separate dining/kitchen room content, paired walking portals, modular sprites and follow-camera renderer                     | [Room adapter](front-of-house/README.md)   |
| `customers/`                              | Pure static routes and bounded entrance/walk/sit/ten-second/stand state, driven by engine ticks                              | [Customer visit test](customers/README.md) |
| `demo/`                                   | One-room fixture and Phaser rendering adapter                                                                                | [Demo adapter](demo/README.md)             |
| `create-game.ts`, `scenes/diner-scene.ts` | Preserved original decorative welcome-scene lifecycle/lighting; unmounted since the static main-menu preview replaced it     | [Web guide](../../README.md)               |

`engine` must never import Phaser/DOM/storage/network code. The demo's Phaser game owns the frame pump and advances the session before scenes update; a room scene does not own world time. The [DOM controller](../demo/README.md) lives separately in `apps/web/src/demo`. Actual sprite sources and exports are in the asset READMEs.
