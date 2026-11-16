# render-gateway

`@level-designer/render-gateway` is the only bridge to the rendering-poc library, the
game's renderer. No other component imports the library or reads its files. The entry is
browser-safe.

## Entry

`@level-designer/render-gateway` offers `createRenderer`, `attachWindowResize`,
`NoGraphicsError`, `createPostUniforms`, `PostPipeline`, `resolveRenderQuality`,
`PerfStats` and the types `RendererContext`, `PostConfig` and `PostUniforms`. Every name
is the library's own, unchanged.

three.js is not a dependency of this component. A consumer that uses three.js declares
it; the root override pins it to the version the library declares, so the consumer and
the library share one copy.

Read the [component knowledge](docs/KNOWLEDGE.md) next.
