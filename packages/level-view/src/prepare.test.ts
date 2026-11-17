import { expect, test } from "bun:test";
import { createPostUniforms } from "@level-designer/render-gateway";
import { GAME_VALUES } from "@level-designer/sec111-gateway";
import { Group, Mesh, Scene, Vector3 } from "three/webgpu";
import type { FrameGraph } from "./level-view.js";
import { compileScene, warmUp } from "./prepare.js";
import { createCamera } from "./scene/index.js";

/** A stand-in pipeline that records each call in order and runs `onCompile` inside the compile. */
function recordingGraph(onCompile: () => void = () => {}) {
  const calls: string[] = [];
  const graph: FrameGraph = {
    uniforms: createPostUniforms(GAME_VALUES.look, GAME_VALUES.page.signatureSlots),
    syncCamera: (_camera, dt: number) => {
      calls.push(`sync ${dt}`);
    },
    render: () => {
      calls.push("render");
    },
    compileAsync: () => {
      onCompile();
      calls.push("compile");
      return Promise.resolve();
    },
  };
  return { graph, calls };
}

test("the compile runs with frustum culling off and restores it", async () => {
  const scene = new Scene();
  const unculled = new Mesh();
  unculled.frustumCulled = false;
  scene.add(new Group().add(new Mesh()), unculled);
  const during: boolean[] = [];
  const { graph, calls } = recordingGraph(() => {
    scene.traverse((object) => during.push(object.frustumCulled));
  });
  await compileScene(scene, graph);
  expect(calls).toEqual(["compile"]);
  expect(during.every((culled) => !culled)).toBe(true);
  const after: boolean[] = [];
  scene.traverse((object) => after.push(object.frustumCulled));
  expect(after).toEqual([true, true, true, false]);
});

test("the warm-up renders the game's warm-up frames from the interior centre", () => {
  const camera = createCamera();
  const { graph, calls } = recordingGraph();
  warmUp(camera, graph, { min: [-10, 0, -20], max: [12, 18, 40] });
  const frames = Array.from({ length: GAME_VALUES.page.warmUpFrames }, () => ["sync 0", "render"]);
  expect(calls).toEqual(frames.flat());
  const eye = Array.from(camera.getWorldPosition(new Vector3()).toArray());
  expect(eye).toEqual([1, 9, 10].map((v) => expect.closeTo(v, 9)));
});
