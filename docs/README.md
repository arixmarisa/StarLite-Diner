# Documentation index

Start with `../context.md` and `../AGENTS.md`. These guides describe responsibilities so agents can choose a small set of implementation files.

The [movement demo guide](demo.md) documents the implemented engine and `/demo`. Use it and the actual engine source README to distinguish working behavior from the broader restaurant design package.

The [editable art index](../assets/README.md) locates the approved booth/player `.pxo` projects and the 64-piece front-of-house pack, including its layered room preview, export recipes and individual runtime PNGs.

The latest [compact modular dining-room layout](../assets/pixelorama/front-of-house-layout-compact-review/README.md) follows the user's density feedback using the same sprites and approved tea/soda additions. The wider first variant remains available for comparison. Its placement data preserves individual instances and proposed circulation separately from the derived review image.

| Guide                                         | Read when                                                                                                                |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| [Architecture](architecture.md)               | Changing module boundaries, game lifecycle, or backend design                                                            |
| [Gameplay review package](gameplay/README.md) | Understanding the full desired loop, reference art, engine/art plans, and user-confirmed decisions before implementation |
| [Art direction](art-direction.md)             | Creating or exporting any pixel art, animation, or visual interaction                                                    |
| [Quality](quality.md)                         | Validating a change, preparing a release, or checking accessibility/performance                                          |
| [Decisions](decisions/README.md)              | Understanding why the initial stack and deployment model were selected                                                   |
| [Deployment](../deploy/README.md)             | Setting up DigitalOcean, CI credentials, promotion, or rollback                                                          |

Update the relevant guide when changing its behavior. Maintain source maps in directory READMEs rather than documenting every line in separate files.
