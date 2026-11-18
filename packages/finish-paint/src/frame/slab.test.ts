import { expect, test } from "bun:test";
import { faceClass, slabFrame, type SlabFace } from "./index.js";

/** A slab 2 m wide, 1.2 m high and 0.2 m thick. */
const SIZE = [2, 1.2, 0.2] as const;

/** One point on each face: its slab-local position, its normal and its frame by hand. */
const POINTS: readonly (readonly [
  readonly [number, number, number],
  readonly [number, number, number],
  SlabFace,
])[] = [
  [[0.5, 0.3, 0.1], [0, 0, 1], { x: 0.5, y: 0.3, width: 2, height: 1.2, faceClass: 0 }],
  [[-0.4, 1, -0.1], [0, 0, -1], { x: -0.4, y: 1, width: 2, height: 1.2, faceClass: 1 }],
  [[0.7, 1.2, 0.05], [0, 1, 0], { x: 0.7, y: 0.15, width: 2, height: 0.2, faceClass: 2 }],
  [[-0.9, 0, -0.08], [0, -1, 0], { x: -0.9, y: 0.02, width: 2, height: 0.2, faceClass: 3 }],
  [[1, 0.6, 0.03], [1, 0, 0], { x: 0.03, y: 0.6, width: 0.2, height: 1.2, faceClass: 4 }],
  [[-1, 0.2, -0.05], [-1, 0, 0], { x: -0.05, y: 0.2, width: 0.2, height: 1.2, faceClass: 5 }],
];

test("a point on each of a slab's six faces returns its hand-computed frame", () => {
  for (const [position, normal, expected] of POINTS) {
    const face = slabFrame(SIZE, position, normal);
    expect(face.faceClass).toBe(expected.faceClass);
    expect(face.x).toBeCloseTo(expected.x, 9);
    expect(face.y).toBeCloseTo(expected.y, 9);
    expect(face.width).toBe(expected.width);
    expect(face.height).toBe(expected.height);
  }
  const classes = POINTS.map(([, , expected]) => expected.faceClass);
  expect(new Set(classes)).toEqual(new Set(Object.values(faceClass)));
});
