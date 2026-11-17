import { GAME_VALUES } from "@level-designer/sec111-gateway";
import type { Object3D, PerspectiveCamera, Scene } from "three/webgpu";
import type { FrameGraph } from "./level-view.js";
import { type InteriorBox, poseCamera } from "./scene/index.js";

/**
 * Compile every scene material against the real scene-pass target with frustum culling off,
 * so no first view compiles a pipeline; the culling flags are restored afterwards.
 */
export async function compileScene(scene: Scene, graph: FrameGraph): Promise<void> {
  const culled: Object3D[] = [];
  scene.traverse((object) => {
    if (!object.frustumCulled) return;
    culled.push(object);
    object.frustumCulled = false;
  });
  try {
    await graph.compileAsync();
  } finally {
    for (const object of culled) object.frustumCulled = true;
  }
}

/**
 * Render the game's warm-up frames before the level shows, from the interior centre looking
 * along +Z. The first renders the static shadow. They bypass the view's clock and frame count.
 */
export function warmUp(camera: PerspectiveCamera, graph: FrameGraph, interior: InteriorBox): void {
  const { min, max } = interior;
  const eye = [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2] as const;
  poseCamera(camera, { eye, yaw: 0, pitch: 0 });
  for (let frame = 0; frame < GAME_VALUES.page.warmUpFrames; frame += 1) {
    graph.syncCamera(camera, 0);
    graph.render();
  }
}
