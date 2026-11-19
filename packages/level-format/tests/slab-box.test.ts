import { expect, test } from "bun:test";
import { slabBox, staticBox } from "@level-designer/level-format";
import type { Slab, StaticObject, Vec3 } from "@level-designer/level-format";
import { SLAB_FINISH } from "./finishes.ts";

/** The sine and cosine of 45 degrees, the components of a 90 degree turn. */
const HALF_TURN = Math.SQRT1_2;

/** Asserts that two point lists agree to 1e-9 m, point by point. */
function expectPoints(actual: readonly Vec3[], expected: readonly Vec3[]): void {
  expect(actual.length).toBe(expected.length);
  expected.forEach((point, i) => {
    point.forEach((value, axis) => expect(actual[i]?.[axis]).toBeCloseTo(value, 9));
  });
}

// The yaw case pins where `w` sits in [x, y, z, w]; the tip case pins x against z; the general
// case pins the signs of the cross terms, which a turn about one axis leaves at zero.
test("a slab yawed 90 degrees and lifted 3 m has its hand-computed corners", () => {
  // Turning +90 degrees about +Y maps local (x, y, z) to world (z, y, -x).
  const slab: Slab = {
    size: [2, 1, 0.5],
    material: "brick",
    ...SLAB_FINISH,
    color: "#804020",
    position: [1, 3, -2],
    rotation: [0, HALF_TURN, 0, HALF_TURN],
  };
  const box = slabBox(slab);
  expectPoints(box.corners, [
    [0.75, 3, -1],
    [0.75, 3, -3],
    [0.75, 4, -1],
    [0.75, 4, -3],
    [1.25, 3, -1],
    [1.25, 3, -3],
    [1.25, 4, -1],
    [1.25, 4, -3],
  ]);
  expectPoints(
    [box.center, ...box.axes],
    [
      [1, 3.5, -2],
      [0, 0, -1],
      [0, 1, 0],
      [1, 0, 0],
    ],
  );
  expect(box.halfExtents).toEqual([1, 0.5, 0.25]);
});

test("a slab tipped 90 degrees about +X lies with its height along +Z", () => {
  // Turning +90 degrees about +X maps local (x, y, z) to world (x, -z, y).
  const slab: Slab = {
    size: [1, 2, 0.4],
    material: "concrete",
    ...SLAB_FINISH,
    color: "#808080",
    position: [0, 1, 0],
    rotation: [HALF_TURN, 0, 0, HALF_TURN],
  };
  const box = slabBox(slab);
  expectPoints(
    [box.corners[0] ?? [0, 0, 0], box.corners[7] ?? [0, 0, 0], box.center],
    [
      [-0.5, 1.2, 0],
      [0.5, 0.8, 2],
      [0, 1, 1],
    ],
  );
});

test("a slab turned 120 degrees about (1, 1, 1) and lifted 20 m has its hand-computed corners", () => {
  // The quaternion [0.5, 0.5, 0.5, 0.5] maps local +X to world +Y, +Y to +Z and +Z to +X,
  // so local (x, y, z) lands at world (z, x, y) before the position is added.
  const slab: Slab = {
    size: [2, 4, 6],
    material: "metal",
    ...SLAB_FINISH,
    color: "#404040",
    position: [10, 20, 30],
    rotation: [0.5, 0.5, 0.5, 0.5],
  };
  const box = slabBox(slab);
  expectPoints(box.corners, [
    [7, 19, 30],
    [7, 21, 30],
    [7, 19, 34],
    [7, 21, 34],
    [13, 19, 30],
    [13, 21, 30],
    [13, 19, 34],
    [13, 21, 34],
  ]);
  expectPoints(
    [box.center, ...box.axes],
    [
      [10, 20, 32],
      [0, 1, 0],
      [0, 0, 1],
      [1, 0, 0],
    ],
  );
  expect(box.halfExtents).toEqual([1, 2, 3]);
});

/** A floor litter of `size` at `at`, turned by `yaw`, with the fixture's paint. */
function litter(at: readonly [number, number], yaw: number, size: Vec3): StaticObject {
  return { id: "sheet", at, yaw, size, lift: 0, color: "#8b9097", ...SLAB_FINISH };
}

test("a static object yawed 30 degrees at an underside of 1.25 m has its hand-computed corners", () => {
  // Turning +30 degrees about +Y: the width axis is (cos 30, 0, -sin 30) and the length axis
  // (sin 30, 0, cos 30); half extents 1, 0.05 and 0.5 about the centre (3, 1.3, -4).
  const box = staticBox(litter([3, -4], 30, [2, 0.1, 1]), 1.25);
  expectPoints(box.corners, [
    [1.8839745962, 1.25, -3.9330127019],
    [3.6160254038, 1.25, -4.9330127019],
    [1.8839745962, 1.35, -3.9330127019],
    [3.6160254038, 1.35, -4.9330127019],
    [2.3839745962, 1.25, -3.0669872981],
    [4.1160254038, 1.25, -4.0669872981],
    [2.3839745962, 1.35, -3.0669872981],
    [4.1160254038, 1.35, -4.0669872981],
  ]);
  expect(box.halfExtents).toEqual([1, 0.05, 0.5]);
});

test("a static object yawed 90 degrees turns its length to +X", () => {
  const box = staticBox(litter([0, 0], 90, [0.4, 0.02, 1.2]), 0);
  expectPoints(
    [box.axes[2], box.axes[0], box.corners[4] ?? [0, 0, 0], box.corners[1] ?? [0, 0, 0]],
    [
      [1, 0, 0],
      [0, 0, -1],
      [0.6, 0, 0.2],
      [-0.6, 0, -0.2],
    ],
  );
});
