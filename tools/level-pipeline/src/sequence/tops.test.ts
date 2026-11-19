import { describe, expect, test } from "bun:test";
import type { Quaternion, Slab } from "@level-designer/level-format";
import { topUnder } from "./tops.js";

// Owner: level-pipeline's top rule, the support a litter on a prop lies on. Each case reads
// topUnder on hand-built slabs, so the rule's corners need no prepared level.

/** A slab of `size` with its base centre at `position`, turned by `rotation`. */
function slab(
  size: readonly [number, number, number],
  position: readonly [number, number, number],
  rotation: Quaternion = [0, 0, 0, 1],
): Slab {
  const finish = { finish: "timber/lid", number: 0, seed: 0, wear: 0.3 };
  return { size, material: "wood", color: "#6b4a2b", position, rotation, ...finish };
}

/** The quaternion of a turn by `degrees` about the axis `[x, y, z]`, a unit vector. */
function turn(degrees: number, [x, y, z]: readonly [number, number, number]): Quaternion {
  const half = (degrees * Math.PI) / 360;
  const s = Math.sin(half);
  return [x * s, y * s, z * s, Math.cos(half)];
}

/** A board 1 m wide and 0.05 m high, 0.8 m deep, standing 0.5 m off the floor at the origin. */
const BOARD = slab([1, 0.05, 0.8], [0, 0.5, 0]);

describe("a top", () => {
  test("is a slab's level upper face, at its highest corner", () => {
    expect(topUnder([BOARD], [0, 0])).toEqual({ slab: 0, height: 0.55 });
  });

  test("lies on any facing whose face points up: a slab laid with its +Z face up", () => {
    const laid = slab([1, 0.8, 0.05], [0, 0.525, 0.4], turn(-90, [1, 0, 0]));
    const top = topUnder([laid], [0, 0]);
    expect(top?.slab).toBe(0);
    expect(top?.height).toBeCloseTo(0.55, 9);
    expect(topUnder([laid], [0, -0.4])?.slab).toBe(0);
    expect(topUnder([laid], [0, 0.4001])).toBe(undefined);
  });

  test("is missing on a pitched slab", () => {
    expect(topUnder([slab([1, 0.05, 0.8], [0, 0.5, 0], turn(20, [1, 0, 0]))], [0, 0])).toBe(
      undefined,
    );
  });

  test("holds a point on its edge and within the slack beyond, and none 0.1 mm beyond", () => {
    expect(topUnder([BOARD], [0.5, 0.4])?.slab).toBe(0);
    expect(topUnder([BOARD], [0.50004, -0.40004])?.slab).toBe(0);
    expect(topUnder([BOARD], [0.5001, 0])).toBe(undefined);
    expect(topUnder([BOARD], [0, -0.4001])).toBe(undefined);
  });

  test("holds a point by the slab's turned outline", () => {
    const turned = slab([1, 0.05, 0.2], [0, 0.5, 0], turn(90, [0, 1, 0]));
    expect(topUnder([turned], [0, 0.45])?.slab).toBe(0);
    expect(topUnder([turned], [0.45, 0])).toBe(undefined);
  });
});

describe("the support among several tops", () => {
  test("is the highest top under the point", () => {
    const lower = slab([1, 0.05, 0.8], [0, 0.2, 0]);
    expect(topUnder([lower, BOARD], [0, 0])).toEqual({ slab: 1, height: 0.55 });
  });

  test("keeps the first in slab order on a tie within the slack", () => {
    const twin = slab([1, 0.05, 0.8], [0.1, 0.50004, 0]);
    expect(topUnder([BOARD, twin], [0, 0])?.slab).toBe(0);
    expect(topUnder([twin, BOARD], [0, 0])?.slab).toBe(0);
  });

  test("passes over a top that does not hold the point", () => {
    const beside = slab([1, 0.05, 0.8], [3, 0.9, 0]);
    expect(topUnder([beside, BOARD], [0, 0])).toEqual({ slab: 1, height: 0.55 });
  });
});
