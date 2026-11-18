import { describe, expect, test } from "bun:test";
import { numberArithmetic as a } from "../arithmetic/index.js";
import type { PaintFace } from "../painter/index.js";
import { type HallBox, hallFace, type Vec3 } from "./index.js";

/** An interior box from (-30, -2, -60) m, 60 m along X, 18 m high and 120 m along Z. */
const INTERIOR: HallBox<number> = { low: [-30, -2, -60], size: [60, 18, 120] };

/** A point of the hall. */
const POINT: Vec3<number> = [5, 3, -7];

/** The face of the point on a surface of `normal`. */
function faceOf(normal: Vec3<number>): PaintFace<number> {
  return hallFace(a, POINT, normal, INTERIOR);
}

/** A floor's or a ceiling's face, painted in plan, of `faceClass`. */
function plan(faceClass: number): PaintFace<number> {
  const face = { x: 5, y: -7, low: [-30, -60] as const, size: [60, 120] as const, faceClass };
  return { ...face, seed: 0, wear: 1 };
}

/** A wall's face, painted along the level's X or Z and the height. */
function wall(alongZ: boolean): PaintFace<number> {
  const across = alongZ ? { x: -7, low: -60, size: 120 } : { x: 5, low: -30, size: 60 };
  const face = {
    x: across.x,
    y: 3,
    low: [across.low, -2] as const,
    size: [across.size, 18] as const,
  };
  return { ...face, faceClass: 0, seed: 0, wear: 1 };
}

/** A unit normal of Y `ny`, the rest along X or along Z. */
function slope(ny: number, alongX: boolean): Vec3<number> {
  const rest = Math.sqrt(1 - ny * ny);
  return alongX ? [rest, ny, 0] : [0, ny, rest];
}

describe("hallFace", () => {
  test("a floor and a ceiling are painted in plan, the interior's X and Z", () => {
    expect(faceOf([0, 1, 0])).toEqual(plan(2));
    expect(faceOf([0, -1, 0])).toEqual(plan(3));
  });

  test("a wall facing along X takes the level's Z, one facing along Z the level's X", () => {
    expect(faceOf([1, 0, 0])).toEqual(wall(true));
    expect(faceOf([-1, 0, 0])).toEqual(wall(true));
    expect(faceOf([0, 0, 1])).toEqual(wall(false));
    expect(faceOf([0, 0, -1])).toEqual(wall(false));
  });

  test("a slope's class turns at a normal Y of 0.7, inclusive", () => {
    for (const alongX of [true, false]) {
      expect(faceOf(slope(0.7, alongX))).toEqual(plan(2));
      expect(faceOf(slope(-0.7, alongX))).toEqual(plan(3));
      expect(faceOf(slope(0.6999, alongX))).toEqual(wall(alongX));
      expect(faceOf(slope(-0.6999, alongX))).toEqual(wall(alongX));
    }
  });

  test("a wall takes the level's Z only where the normal's X outweighs its Z", () => {
    expect(faceOf([0.6, 0, 0.59])).toEqual(wall(true));
    expect(faceOf([0.59, 0, 0.6])).toEqual(wall(false));
    expect(faceOf([0.5, 0, 0.5])).toEqual(wall(false));
    expect(faceOf([-0.6, 0, -0.59])).toEqual(wall(true));
  });
});
