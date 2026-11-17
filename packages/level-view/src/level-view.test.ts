import { expect, test } from "bun:test";
import { createPostUniforms, PerfStats } from "@level-designer/render-gateway";
import { GAME_VALUES } from "@level-designer/sec111-gateway";
import type { PerspectiveCamera } from "three/webgpu";
import { type FrameGraph, LevelView } from "./level-view.js";
import { createCamera } from "./scene/index.js";

/**
 * What the pipeline saw at each sync: the eye and view direction in the camera's world matrix
 * as it stands, without recomputing it, the delta and the time uniform.
 */
interface Sync {
  readonly eye: number[];
  readonly forward: number[];
  readonly dt: number;
  readonly time: number;
}

/** The world eye and the world view direction (-Z) read straight from the stored matrix. */
function storedPose(camera: PerspectiveCamera): { eye: number[]; forward: number[] } {
  const m = camera.matrixWorld.elements;
  return { eye: m.slice(12, 15), forward: m.slice(8, 11).map((v) => -v) };
}

/** A renderer without a GPU as the library's frame counter reads it after each frame. */
const COUNTED_RENDERER: ConstructorParameters<typeof PerfStats>[0] = {
  backend: null,
  domElement: { width: 1280, height: 720 },
  info: {
    frame: 0,
    render: { frameCalls: 0, drawCalls: 0, triangles: 0 },
    memory: { programs: 0 },
  },
  resolveTimestampsAsync: () => Promise.resolve(undefined),
};

/** A view over a recording stand-in of the post pipeline, with real uniforms and frame counter. */
function recordedView() {
  const uniforms = createPostUniforms(GAME_VALUES.look, GAME_VALUES.page.signatureSlots);
  const syncs: Sync[] = [];
  const calls: string[] = [];
  const graph: FrameGraph = {
    uniforms,
    syncCamera: (camera: PerspectiveCamera, dt: number) => {
      calls.push("sync");
      syncs.push({ ...storedPose(camera), dt, time: uniforms.time.value });
    },
    render: () => {
      calls.push("render");
    },
    compileAsync: () => Promise.resolve(),
  };
  const perf = new PerfStats(COUNTED_RENDERER, "webgpu", false, 1);
  return { view: new LevelView(createCamera(), graph, perf), syncs, calls };
}

test("the frame call syncs the posed camera, then draws once, at the given eye, yaw and pitch", () => {
  const { view, syncs, calls } = recordedView();
  view.frame({ eye: [2, 1.72, -30], yaw: Math.PI / 2, pitch: 0 }, 5);
  expect(calls).toEqual(["sync", "render"]);
  expect(syncs).toEqual([
    {
      eye: [2, 1.72, -30].map((v) => expect.closeTo(v, 9)),
      forward: [1, 0, 0].map((v) => expect.closeTo(v, 9)),
      dt: 0,
      time: 5,
    },
  ]);
});

test("the frame delta starts at 0 and is clamped to the game's 1/15 s", () => {
  const { view, syncs } = recordedView();
  const pose = { eye: [0, 0, 0], yaw: 0, pitch: 0 } as const;
  for (const time of [10, 10.02, 12]) view.frame(pose, time);
  expect(syncs.map((sync) => sync.dt)).toEqual([0, expect.closeTo(0.02, 9), 1 / 15]);
});

test("the frame rate counts the frames the frame call draws", () => {
  const { view } = recordedView();
  const pose = { eye: [0, 0, 0], yaw: 0, pitch: 0 } as const;
  for (let frame = 0; frame < 30; frame += 1) view.frame(pose, frame * 0.02);
  expect(view.frameRate).toBeCloseTo(50, 6);
});
