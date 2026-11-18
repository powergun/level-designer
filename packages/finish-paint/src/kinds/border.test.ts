import { describe, expect, test } from "bun:test";
import { numberArithmetic as a } from "../arithmetic/index.js";
import { border, type BorderParams } from "./index.js";

/** One footprint of 1 mm, far below every width. */
const FINE = 0.001;

/** A frame on a face of 2 x 1.2 m: 0.1 m at the ends, 0.2 m at the top, 0.05 m at the base. */
const FRAME: BorderParams<number> = {
  low: [-1, 0],
  high: [1, 1.2],
  ends: 0.1,
  top: 0.2,
  base: 0.05,
  inset: 0,
};

/** The coverage of a frame at a point. */
function at(p: BorderParams<number>, x: number, y: number): number {
  return border(a, p, x, y, FINE);
}

describe("border", () => {
  test("covers 1 on the frame, 0 outside the face and 0 in its middle", () => {
    expect(at(FRAME, -0.95, 0.6)).toBeCloseTo(1, 3);
    expect(at(FRAME, 0.95, 0.6)).toBeCloseTo(1, 3);
    expect(at(FRAME, 0, 1.1)).toBeCloseTo(1, 3);
    expect(at(FRAME, 0, 0.02)).toBeCloseTo(1, 3);
    expect(at(FRAME, 0, 0.6)).toBeCloseTo(0, 3);
    expect(at(FRAME, -1.5, 0.6)).toBeCloseTo(0, 3);
    expect(at(FRAME, 0, 1.3)).toBeCloseTo(0, 3);
  });

  test("covers one half on its outer and inner edges, each width at its side", () => {
    expect(at(FRAME, -1, 0.6)).toBeCloseTo(0.5, 3);
    expect(at(FRAME, -0.9, 0.6)).toBeCloseTo(0.5, 3);
    expect(at(FRAME, -0.9 - FINE, 0.6)).toBeCloseTo(1, 3);
    expect(at(FRAME, -0.9 + FINE, 0.6)).toBeCloseTo(0, 3);
    expect(at(FRAME, 0.9, 0.6)).toBeCloseTo(0.5, 3);
    expect(at(FRAME, 0, 1)).toBeCloseTo(0.5, 3);
    expect(at(FRAME, 0, 1 - FINE)).toBeCloseTo(0, 3);
    expect(at(FRAME, 0, 0.05)).toBeCloseTo(0.5, 3);
    expect(at(FRAME, 0, 0.05 + FINE)).toBeCloseTo(0, 3);
  });

  test("an inset moves the frame in from the outline", () => {
    const inset: BorderParams<number> = { ...FRAME, inset: 0.1 };
    expect(at(inset, -0.95, 0.6)).toBeCloseTo(0, 3);
    expect(at(inset, -0.9, 0.6)).toBeCloseTo(0.5, 3);
    expect(at(inset, -0.85, 0.6)).toBeCloseTo(1, 3);
    expect(at(inset, -0.8, 0.6)).toBeCloseTo(0.5, 3);
    expect(at(inset, 0, 0.9)).toBeCloseTo(0.5, 3);
    expect(at(inset, 0, 1.1)).toBeCloseTo(0.5, 3);
    expect(at(inset, 0, 1.15)).toBeCloseTo(0, 3);
  });

  test("an inset of half a thin face or more leaves nothing", () => {
    // An edge face 0.05 m high: an inset of 0.025 m meets in the middle.
    const edge: BorderParams<number> = { ...FRAME, high: [1, 0.05] };
    expect(at({ ...edge, inset: 0.04 }, 0, 0.025)).toBeCloseTo(0, 3);
    expect(at({ ...edge, inset: 0.04 }, 0, 0.012)).toBeCloseTo(0, 3);
    expect(at({ ...edge, inset: 0.025 }, 0, 0.025)).toBeCloseTo(0, 3);
    expect(at({ ...edge, inset: 0.024 }, 0, 0.025)).toBeCloseTo(1, 3);
  });

  test("widths past half the face fill the inset outline", () => {
    for (const wide of [
      { ...FRAME, ends: 1.5 },
      { ...FRAME, top: 1, base: 1 },
    ]) {
      expect(at(wide, 0, 0.6)).toBeCloseTo(1, 3);
      expect(at(wide, 0.3, 0.2)).toBeCloseTo(1, 3);
      expect(at(wide, -1.5, 0.6)).toBeCloseTo(0, 3);
    }
  });
});
