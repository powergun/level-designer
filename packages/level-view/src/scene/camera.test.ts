import { expect, test } from "bun:test";
import { GAME_VALUES } from "@level-designer/sec111-gateway";
import { Vector3 } from "three/webgpu";
import { createCamera, poseCamera } from "./camera.js";

test("the camera has the game's lens and turns in YXZ order", () => {
  const camera = createCamera();
  expect({ fovDeg: camera.fov, near: camera.near, far: camera.far }).toEqual(GAME_VALUES.lens);
  expect(camera.rotation.order).toBe("YXZ");
});

test("a pose puts the eye and turns the view: yaw 0 along +Z, toward +X, pitch up", () => {
  const camera = createCamera();
  const cases = [
    { yaw: 0, pitch: 0, forward: [0, 0, 1] },
    { yaw: Math.PI / 2, pitch: 0, forward: [1, 0, 0] },
    { yaw: 0, pitch: Math.PI / 6, forward: [0, 0.5, Math.sqrt(3) / 2] },
  ];
  for (const { yaw, pitch, forward } of cases) {
    poseCamera(camera, { eye: [1.5, 2.25, -40], yaw, pitch });
    const position = Array.from(camera.getWorldPosition(new Vector3()).toArray());
    expect(position).toEqual([1.5, 2.25, -40].map((v) => expect.closeTo(v, 9)));
    const direction = Array.from(camera.getWorldDirection(new Vector3()).toArray());
    expect(direction).toEqual(forward.map((v) => expect.closeTo(v, 9)));
  }
});
