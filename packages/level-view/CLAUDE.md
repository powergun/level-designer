# level-view rules

- Keep the source browser-safe: no Bun or Node modules and no Bun or Node globals.
- Reach the renderer only through `@level-designer/render-gateway`, the game values only
  through `@level-designer/sec111-gateway` and the lighting section only through
  `@level-designer/level-format`. three.js itself is a direct dependency.
- Start on WebGPU only, and refuse a WebGL fallback with this component's own typed error.
  Expected start failures are outcomes of the start, never rejections.
- Hold no game value of its own: the lens, the look, the page constants and the game's
  clear colour come from `GAME_VALUES`. The leak colour and the other mapping constants are
  this component's own, each in one place in the `scene` unit.
- Keep the light set fixed after the start: expose no light and no setter.
- Take no input and build no page; the QA page owns both.
- Test the mapping rules as scene facts under Bun without a GPU. Assert no pixel.
- Never initialise or dispose a real renderer in a test: on Bun, its dispose starts an
  initialisation that crashes. Test the renderer steps through their narrow interfaces.
