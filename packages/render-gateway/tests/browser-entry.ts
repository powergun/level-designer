/** A browser entry that names every re-export of the render gateway, values and types alike. */
import type { PostConfig, PostUniforms, RendererContext } from "@level-designer/render-gateway";
import {
  attachWindowResize,
  createPostUniforms,
  createRenderer,
  NoGraphicsError,
  PerfStats,
  PostPipeline,
  resolveRenderQuality,
} from "@level-designer/render-gateway";

/** Every value re-export, by name. */
export const VALUES = {
  attachWindowResize,
  createPostUniforms,
  createRenderer,
  NoGraphicsError,
  PerfStats,
  PostPipeline,
  resolveRenderQuality,
};

/** Every type re-export, by name. */
export interface Types {
  /** The post configuration. */
  readonly config: PostConfig;
  /** The post uniforms. */
  readonly uniforms: PostUniforms;
  /** The renderer context. */
  readonly context: RendererContext;
}
