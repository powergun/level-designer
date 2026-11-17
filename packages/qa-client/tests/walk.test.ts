import { expect, test } from "bun:test";
import { floorHeightAt, GAME_VALUES, PLAYER_BODY } from "@level-designer/sec111-gateway";
import {
  type BootedPage,
  bootReady,
  COMMITTED,
  inStartFrame,
  slabPoint,
  slabYaw,
  START_FRAME,
  WALK_SLABS,
} from "./page-fixture.ts";

/** The eye above the feet in walk: the game's body height times its eye ratio. */
const EYE_HEIGHT = PLAYER_BODY.height * GAME_VALUES.player.eyeRatio;

/** The distance from a panel's centre plane at which sec-111's capsule stops, measured. */
const STOP_DISTANCE = 0.405;

/** Frames per second of the manual timers. */
const FPS = 60;

/** The status of a switch to walk where the capsule would be stuck. */
const STUCK =
  "walk cannot stand under the camera: a capsule here would be stuck in the level's collision; " +
  "staying in fly";

/** The eye of the last drawn frame. */
function eye(page: BootedPage): readonly [number, number, number] {
  const frame = page.view.frames.at(-1);
  if (frame === undefined) throw new Error("no frame was drawn");
  return frame.pose.eye;
}

/** Hold a key for `seconds` of frames. */
function hold(page: BootedPage, code: string, seconds: number): void {
  page.window.press(code);
  page.timers.frames(Math.round(seconds * FPS));
  page.window.release(code);
}

/** How far the eye stands ahead of a world plan point in the start frame. */
function aheadOf(page: BootedPage, x: number, z: number): number {
  const [ex, , ez] = eye(page);
  return inStartFrame(ex, ez).ahead - inStartFrame(x, z).ahead;
}

/** The key that moves along a world plan direction, from the start frame's axes. */
function keyToward(dx: number, dz: number): string {
  const { forward, right } = START_FRAME;
  const ahead = dx * forward[0] + dz * forward[1];
  const side = dx * right[0] + dz * right[1];
  if (Math.abs(ahead) >= Math.abs(side)) return ahead > 0 ? "KeyW" : "KeyS";
  return side > 0 ? "KeyD" : "KeyA";
}

/** Fly from the spawn to a world plan point: first ahead or back, then to the side, at 8 m/s. */
function flyTo(page: BootedPage, x: number, z: number): void {
  const { ahead, right } = inStartFrame(x, z);
  hold(page, ahead > 0 ? "KeyW" : "KeyS", Math.abs(ahead) / 8);
  hold(page, right > 0 ? "KeyD" : "KeyA", Math.abs(right) / 8);
}

/** The plan distance the eye covers while `code` is held for 1 s. */
function walked(page: BootedPage, code: string): number {
  const [x, , z] = eye(page);
  hold(page, code, 1);
  const [x2, , z2] = eye(page);
  return Math.hypot(x2 - x, z2 - z);
}

test("the capsule passes under a hanging slab and stops 0.405 m before the panel's plane", async () => {
  const page = await bootReady();
  hold(page, "KeyW", 3);
  expect(-aheadOf(page, ...slabPoint(WALK_SLABS.across))).toBeCloseTo(STOP_DISTANCE, 2);
});

test("a strafe slides along a slanted panel 0.405 m from its plane", async () => {
  const page = await bootReady();
  const start = page.view.frames.length;
  hold(page, "KeyD", 2);
  const [cx, cz] = slabPoint(WALK_SLABS.slanted);
  const yaw = slabYaw(WALK_SLABS.slanted);
  // The panel's +Z face normal and its width direction in plan.
  const [nx, nz] = [Math.sin(yaw), Math.cos(yaw)];
  const [tx, tz] = [Math.cos(yaw), -Math.sin(yaw)];
  const reach = WALK_SLABS.slanted.size[0] / 2 - PLAYER_BODY.radius;
  const beside = page.view.frames.slice(start).flatMap(({ pose }) => {
    const [dx, dz] = [pose.eye[0] - cx, pose.eye[2] - cz];
    return Math.abs(dx * tx + dz * tz) < reach ? [dx * nx + dz * nz] : [];
  });
  expect(Math.min(...beside)).toBeCloseTo(STOP_DISTANCE, 2);
  // It slid: the face turned part of the sideways move into a move forward.
  const [sx, , sz] = COMMITTED.spawns.player;
  expect(aheadOf(page, sx, sz)).toBeGreaterThan(0.5);
});

test("fly returns to walk on the floor under the camera, beyond the panel", async () => {
  const page = await bootReady();
  hold(page, "KeyW", 3);
  page.window.press("KeyV");
  expect(page.text("status")).toBe("mode: fly");
  hold(page, "KeyE", 0.5);
  hold(page, "KeyW", 0.75);
  const [flyX, , flyZ] = eye(page);
  expect(aheadOf(page, ...slabPoint(WALK_SLABS.across))).toBeGreaterThan(1);
  page.window.press("KeyV");
  expect(page.text("status")).toBe("mode: walk");
  page.timers.frames(60);
  const [walkX, walkY, walkZ] = eye(page);
  expect(walkX).toBeCloseTo(flyX, 2);
  expect(walkZ).toBeCloseTo(flyZ, 2);
  expect(walkY).toBeCloseTo(floorHeightAt(COMMITTED, flyX, flyZ) + EYE_HEIGHT, 1);
  expect(walked(page, "KeyW")).toBeGreaterThan(2);
});

/** A plan point deep inside a 3 m stage obstacle of the committed hall, top at 3.32 m. */
const OBSTACLE_POINT = [4.5, -38] as const;

test("a switch above a stage obstacle stands the capsule on it, and it walks", async () => {
  const page = await bootReady();
  page.window.press("KeyV");
  hold(page, "KeyE", 0.5);
  flyTo(page, ...OBSTACLE_POINT);
  page.window.press("KeyV");
  expect(page.text("status")).toBe("mode: walk");
  page.timers.frames(60);
  expect(eye(page)[1]).toBeGreaterThan(3 + EYE_HEIGHT);
  expect(walked(page, keyToward(-1, 0))).toBeGreaterThan(2);
});

test("a switch with the camera inside a stage obstacle keeps fly and says why", async () => {
  const page = await bootReady();
  page.window.press("KeyV");
  flyTo(page, ...OBSTACLE_POINT);
  page.window.press("KeyV");
  expect(page.text("status")).toBe(STUCK);
  page.timers.frames(1);
  expect(page.text("hud")).toStartWith("fly |");
  expect(walked(page, "KeyS")).toBeGreaterThan(7);
  page.timers.advance(5000);
  expect(page.fake.logged(STUCK, "warn")).toBe(true);
});

test("a switch with the camera inside a slab stands the capsule, and it walks out", async () => {
  const page = await bootReady();
  page.window.press("KeyV");
  flyTo(page, ...slabPoint(WALK_SLABS.block));
  page.window.press("KeyV");
  expect(page.text("status")).toBe("mode: walk");
  expect(walked(page, "KeyS")).toBeGreaterThan(2);
});

test("a switch within the capsule radius of the interior's side face keeps fly", async () => {
  const page = await bootReady();
  const edge = COMMITTED.metrics.interior.max[0];
  page.window.press("KeyV");
  flyTo(page, edge - 0.13, COMMITTED.spawns.player[2]);
  expect(edge - eye(page)[0]).toBeLessThan(PLAYER_BODY.radius);
  page.window.press("KeyV");
  expect(page.text("status")).toBe(STUCK);
});

test("walk outside the interior keeps fly and says why", async () => {
  const page = await bootReady();
  page.window.press("KeyV");
  const height = COMMITTED.metrics.interior.max[1] - COMMITTED.metrics.interior.min[1];
  hold(page, "KeyE", height / 8 + 1);
  page.window.press("KeyV");
  expect(page.text("status")).toBe("walk needs the camera inside the interior; staying in fly");
  page.timers.frames(1);
  expect(page.view.frames.at(-1)?.pose.eye[1]).toBeGreaterThan(COMMITTED.metrics.interior.max[1]);
  expect(page.text("hud")).toStartWith("fly |");
  page.timers.advance(5000);
  expect(page.fake.logged("walk needs the camera inside the interior", "warn")).toBe(true);
});

test("a physics start failure turns walk off, keeps fly and says so", async () => {
  const page = await bootReady({
    startPhysics: () => Promise.reject(new Error("Rapier failed to compile")),
  });
  const message =
    "walk is off: the physics world failed to start: Rapier failed to compile; fly stays";
  expect(page.text("status")).toBe(message);
  expect(page.fake.logged(message, "error")).toBe(true);
  page.timers.frames(1);
  expect(page.text("hud")).toStartWith("fly (walk off) |");
  page.window.press("KeyV");
  expect(page.text("status")).toBe(message);
  hold(page, "KeyW", 1);
  const [sx, , sz] = COMMITTED.spawns.player;
  expect(aheadOf(page, sx, sz)).toBeGreaterThan(7);
});

test("walk sprints at the game's sprint speed, and fly moves at 8 and 24 m/s", async () => {
  const page = await bootReady();
  const { sprintSpeed } = GAME_VALUES.player;
  page.timers.frames(1);
  page.window.press("ShiftLeft");
  expect(walked(page, "KeyA")).toBeCloseTo(sprintSpeed, 1);
  page.window.release("ShiftLeft");
  page.window.press("KeyV");
  expect(walked(page, "KeyA")).toBeCloseTo(8, 1);
  page.window.press("ShiftLeft");
  expect(walked(page, "KeyA")).toBeCloseTo(24, 1);
});

test("a switch in an interior corner, 0.4 m from both side faces, gives walk, and it walks out", async () => {
  const page = await bootReady();
  const { max } = COMMITTED.metrics.interior;
  page.window.press("KeyV");
  flyTo(page, max[0] - 0.4, max[2] - 0.4);
  const [x, , z] = eye(page);
  // A fly frame moves 0.13 m, so the camera lands within a frame of 0.4 m from each face.
  for (const gap of [max[0] - x, max[2] - z]) {
    expect(gap).toBeGreaterThan(0.3);
    expect(gap).toBeLessThan(0.5);
  }
  page.window.press("KeyV");
  expect(page.text("status")).toBe("mode: walk");
  expect(walked(page, keyToward(-1, 0))).toBeGreaterThan(2);
});

test("the first frame faces as the game's player starts", async () => {
  const page = await bootReady();
  page.timers.frames(1);
  const pose = page.view.frames[0]?.pose;
  if (pose === undefined) throw new Error("no frame was drawn");
  const forward = [
    Math.sin(pose.yaw) * Math.cos(pose.pitch),
    Math.sin(pose.pitch),
    Math.cos(pose.yaw) * Math.cos(pose.pitch),
  ];
  GAME_VALUES.player.startForward.forEach((value, axis) => {
    expect(forward[axis]).toBeCloseTo(value, 9);
  });
  // Toward -Z, the back wall, as the player sees first in the game.
  expect(forward[2]).toBeLessThan(0);
});
