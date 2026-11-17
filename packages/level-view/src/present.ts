import type { Lighting } from "@level-designer/level-format";
import {
  attachWindowResize,
  createPostUniforms,
  PerfStats,
  PostPipeline,
  type RendererContext,
  resolveRenderQuality,
} from "@level-designer/render-gateway";
import { GAME_VALUES } from "@level-designer/sec111-gateway";
import { type Group, Scene } from "three/webgpu";
import { LevelView } from "./level-view.js";
import { compileScene, warmUp } from "./prepare.js";
import type { Presented } from "./run-start.js";
import {
  bakeEnvironment,
  type ClearColorChoice,
  createCamera,
  dressScene,
  type InteriorBox,
  levelLook,
} from "./scene/index.js";

/** The scene-pass quality the library chose for this GPU, for the run log. */
export type RenderQuality = ReturnType<typeof resolveRenderQuality>;

/** What a started view hands out: the view and the chosen quality. */
export interface ReadyView {
  readonly view: LevelView;
  readonly quality: RenderQuality;
}

/** The level facts the present step draws by. */
export interface PresentFacts {
  readonly lighting: Lighting;
  readonly interior: InteriorBox;
  readonly clearColor: ClearColorChoice;
}

/**
 * Build the dressed scene, the baked environment and the post pipeline with the game's look,
 * then attach the window resize. The warm-up compiles against the complete light set and
 * renders the warm-up frames.
 */
export function presentLevel(
  context: RendererContext,
  level: Group,
  facts: PresentFacts,
): Presented<ReadyView> {
  const { renderer, backend } = context;
  const scene = new Scene();
  scene.add(level);
  dressScene(scene, facts.lighting, facts.interior, facts.clearColor);
  scene.environment = bakeEnvironment(renderer, facts.lighting.environment);
  const camera = createCamera();
  const quality = resolveRenderQuality(renderer, backend, { override: null, deterministic: false });
  const look = levelLook(facts.lighting);
  const uniforms = createPostUniforms(look, GAME_VALUES.page.signatureSlots);
  const pipeline = new PostPipeline(renderer, scene, camera, uniforms, look, {
    msaaSamples: quality.msaaSamples,
    sceneScale: 1,
    pixelRatio: context.pixelRatio,
  });
  const perf = new PerfStats(renderer, backend, context.hasTimestamps, context.pixelRatio);
  const detach = attachWindowResize(context, camera, (_width, _height, pixelRatio) => {
    pipeline.setPixelRatio(pixelRatio);
    perf.stats.pixelRatio = pixelRatio;
  });
  return {
    ready: { view: new LevelView(camera, pipeline, perf), quality },
    detach,
    warm: async () => {
      await compileScene(scene, pipeline);
      warmUp(camera, pipeline, facts.interior);
    },
  };
}
