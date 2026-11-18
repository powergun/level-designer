# level-view rules

## Boundaries

- Keep the source browser-safe: no Bun or Node modules and no Bun or Node globals.
- Reach the renderer only through `@level-designer/render-gateway`, the game values only
  through `@level-designer/sec111-gateway` and the lighting section only through
  `@level-designer/level-format`. three.js itself is a direct dependency.
- Paint only through `@level-designer/finish-paint`'s painter and this component's node
  back end; hold no recipe rule of its own. A twin's graph reads only vertex attributes and
  constants; a stage wrap's reads the source's own slots and the mesh's world and normal
  matrices too, which the mesh rules freeze. So both static materials stay valid.
- Build a twin only for a recipe that draws what the GLB's fallback cannot: a layer or a
  body shade other than 1. Wrap a stage material only for a hall finish with a layer, and
  set no slot of the wrap but its colour, metalness and roughness. Every other material
  keeps the GLB's own.
- The geometry decides the rule: a mesh with the slab data (`_slab`) takes the twin, any
  other painted mesh is the stage's and takes the wrap.
- Take no input and build no page; the QA page owns both.

## The start and the scene

- Start on WebGPU only, and refuse a WebGL fallback with this component's own typed error.
  Expected start failures are outcomes of the start, never rejections.
- Hold no game value of its own: the lens, the look, the page constants and the game's
  clear colour come from `GAME_VALUES`. The leak colour and the other mapping constants are
  this component's own, each in one place in the `scene` unit.
- Keep the light set fixed after the start: expose no light and no setter.

## Tests

- Test the mapping rules as scene facts under Bun without a GPU. Assert no pixel.
- Never initialise or dispose a real renderer in a test: on Bun, its dispose starts an
  initialisation that crashes. Test the renderer steps through their narrow interfaces. A
  program test builds through three's node builder on a renderer that is only constructed.
