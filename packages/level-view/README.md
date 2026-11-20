# level-view

`@level-designer/level-view` draws a level pair through the game's renderer, the
rendering-poc pipeline, with authoring bloom and lens dirt and the level's lighting. Its one consumer is
`@level-designer/qa-client`, the QA page.

The facade offers one start, `startLevelView`. It takes the canvas, the level GLB's bytes,
the level's finish table, the lighting section, the prepared static level's interior box,
the clear colour choice (`game` or `leak`) and a failure callback. A slab's or a box's
material that names a finish path with layers or a body shade draws with a painter built
from that table. A stage material that names a hall finish with layers draws through the
stage wrap: its own look, with the finish's layers over it on the hall's frame. Any other
material keeps the GLB's own. The start resolves to one of three outcomes and never
rejects:

- `started`: the view, and the scene-pass quality the library chose for the GPU;
- `refused`: no WebGPU, or a renderer that fell back to WebGL; the error names the
  requirement;
- `failed`: the GLB did not parse, or names a finish path that the table lacks (step
  `glb`), or a later renderer step threw (step `renderer`).

The facade also exports `WEBGPU_REQUIREMENT`, the one requirement sentence. A refusal's
message is that sentence followed by its detail in brackets, and the page's own WebGPU
probe shows the same sentence.

The view has two members. `frame(pose, time)` draws one frame at an eye position, a yaw and
a pitch in radians, with the caller's clock in seconds, so no consumer needs three.js.
`frameRate` reads the library's smoothed frame rate for the heads-up display.

A lost GPU device or a GPU error reaches the failure callback from the renderer's
admission on, so a failure can arrive while the start is still running. After it, the
start may resolve `started` or `failed`, or never settle; the page shows the failure
whatever the start does.

The component takes no input and builds no page. Its source is browser-safe.

For fast iteration:

```sh
mise exec -- bun test ./packages/level-view
mise exec -- bun x --no-install oxlint packages/level-view
```

Read the [component knowledge](docs/KNOWLEDGE.md) next.
