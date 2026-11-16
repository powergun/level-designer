/**
 * render-gateway: the browser-safe bridge to the rendering-poc library. It re-exports the
 * renderer, the post pipeline, its uniforms, the quality decision and the frame statistics
 * from the installed copy of the library; see @packages/render-gateway/docs/KNOWLEDGE.md.
 */
export { PostPipeline } from "@rendering-poc/library/pipeline";
export type { PostConfig } from "@rendering-poc/library/post-config";
export { resolveRenderQuality } from "@rendering-poc/library/quality";
export {
  attachWindowResize,
  createRenderer,
  NoGraphicsError,
} from "@rendering-poc/library/renderer";
export type { RendererContext } from "@rendering-poc/library/renderer";
export { PerfStats } from "@rendering-poc/library/stats";
export { createPostUniforms } from "@rendering-poc/library/uniforms";
export type { PostUniforms } from "@rendering-poc/library/uniforms";
