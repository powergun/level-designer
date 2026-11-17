import type { PerfStats, PostPipeline } from "@level-designer/render-gateway";
import { GAME_VALUES } from "@level-designer/sec111-gateway";
import type { PerspectiveCamera } from "three/webgpu";
import { poseCamera, type ViewPose } from "./scene/index.js";

/** The part of the post pipeline that the frame and the compile drive. */
export type FrameGraph = Pick<PostPipeline, "uniforms" | "syncCamera" | "render" | "compileAsync">;

/** The started view of one level: the frame call and the frame rate for the heads-up display. */
export class LevelView {
  private readonly camera: PerspectiveCamera;
  private readonly graph: FrameGraph;
  private readonly perf: PerfStats;
  private previous: number | null = null;

  /** Wrap the started camera, pipeline and frame counter; the start builds every part. */
  constructor(camera: PerspectiveCamera, graph: FrameGraph, perf: PerfStats) {
    this.camera = camera;
    this.graph = graph;
    this.perf = perf;
  }

  /** The library's smoothed frames per second, 0 before the second frame. */
  get frameRate(): number {
    return this.perf.stats.fps;
  }

  /**
   * Draw one frame at the pose. `time` is the caller's clock in seconds; the frame delta is
   * clamped to the game's 1/15 s, and the first frame advances nothing.
   */
  frame(pose: ViewPose, time: number): void {
    const clamp = 1 / GAME_VALUES.page.frameClampRate;
    const dt = this.previous === null ? 0 : Math.min(time - this.previous, clamp);
    this.previous = time;
    this.graph.uniforms.time.value = time;
    poseCamera(this.camera, pose);
    this.graph.syncCamera(this.camera, dt);
    this.graph.render();
    this.perf.endFrame(time * 1000);
  }
}
