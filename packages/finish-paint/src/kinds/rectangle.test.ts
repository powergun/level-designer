import { describe, expect, test } from "bun:test";
import { numberArithmetic as a } from "../arithmetic/index.js";
import { rectangle, type RectangleParams } from "./index.js";

/** One footprint of 1 mm, far below the rectangle's sides. */
const FINE = 0.001;

/** A rectangle from (-1, 0) to (1, 0.5) m. */
const PLATE: RectangleParams<number> = { from: [-1, 0], to: [1, 0.5] };

describe("rectangle", () => {
  test("covers 1 inside, 0 outside, one half on an edge and one quarter on a corner", () => {
    expect(rectangle(a, PLATE, 0, 0.25, FINE)).toBeCloseTo(1, 4);
    expect(rectangle(a, PLATE, 1 - FINE, 0.5 - FINE, FINE)).toBeCloseTo(1, 4);
    expect(rectangle(a, PLATE, 1, 0.25, FINE)).toBeCloseTo(0.5, 4);
    expect(rectangle(a, PLATE, 0, 0, FINE)).toBeCloseTo(0.5, 4);
    expect(rectangle(a, PLATE, 1, 0.5, FINE)).toBeCloseTo(0.25, 4);
    expect(rectangle(a, PLATE, 1 + FINE, 0.25, FINE)).toBeCloseTo(0, 4);
    expect(rectangle(a, PLATE, 0, -FINE, FINE)).toBeCloseTo(0, 4);
    expect(rectangle(a, PLATE, -1 - FINE, 0.5 + FINE, FINE)).toBeCloseTo(0, 4);
  });

  test("covers the same with its corners in either order", () => {
    const swapped: RectangleParams<number> = { from: [1, 0.5], to: [-1, 0] };
    const crossed: RectangleParams<number> = { from: [1, 0], to: [-1, 0.5] };
    for (const [x, y] of [
      [0, 0.25],
      [1, 0.25],
      [1, 0.5],
      [1.5, 0.25],
    ] as const) {
      const expected = rectangle(a, PLATE, x, y, FINE);
      expect(rectangle(a, swapped, x, y, FINE)).toBe(expected);
      expect(rectangle(a, crossed, x, y, FINE)).toBe(expected);
    }
  });

  test("a footprint wider than the rectangle returns its share of the footprint", () => {
    expect(rectangle(a, PLATE, 0, 0.25, 4)).toBeCloseTo((2 / 4) * (0.5 / 4), 5);
  });
});
