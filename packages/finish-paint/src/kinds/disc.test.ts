import { describe, expect, test } from "bun:test";
import { numberArithmetic as a } from "../arithmetic/index.js";
import { disc, type DiscParams } from "./index.js";

/** One footprint of 1 mm, far below every radius. */
const FINE = 0.001;

/** A disc of 0.5 m radius at (1, 2) m. */
const ROUND: DiscParams<number> = { at: [1, 2], radius: 0.5, diamond: false };

/** The disc with a hole of 0.2 m radius: a ring. */
const RING: DiscParams<number> = { ...ROUND, inner: 0.2 };

/** The disc measured along the two coordinates summed. */
const DIAMOND: DiscParams<number> = { ...ROUND, diamond: true };

/** The coverage of a disc at a point. */
function at(p: DiscParams<number>, x: number, y: number): number {
  return disc(a, p, x, y, FINE);
}

describe("disc", () => {
  test("covers 1 inside, 0 outside and one half on its edge", () => {
    expect(at(ROUND, 1, 2)).toBeCloseTo(1, 3);
    expect(at(ROUND, 1.5, 2)).toBeCloseTo(0.5, 3);
    expect(at(ROUND, 1, 1.5)).toBeCloseTo(0.5, 3);
    expect(at(ROUND, 1.5 - FINE, 2)).toBeCloseTo(1, 3);
    expect(at(ROUND, 1.5 + FINE, 2)).toBeCloseTo(0, 3);
    expect(at(ROUND, 3, 2)).toBeCloseTo(0, 3);
  });

  test("a ring is empty inside its inner radius and one half on it", () => {
    expect(at(RING, 1, 2)).toBeCloseTo(0, 3);
    expect(at(RING, 1.2 - FINE, 2)).toBeCloseTo(0, 3);
    expect(at(RING, 1.2, 2)).toBeCloseTo(0.5, 3);
    expect(at(RING, 1.2 + FINE, 2)).toBeCloseTo(1, 3);
    expect(at(RING, 1.35, 2)).toBeCloseTo(1, 3);
    expect(at(RING, 1.5, 2)).toBeCloseTo(0.5, 3);
    expect(at(RING, 1.5 + FINE, 2)).toBeCloseTo(0, 3);
  });

  test("a diamond measures along the summed coordinates", () => {
    expect(at(DIAMOND, 1, 2)).toBeCloseTo(1, 3);
    expect(at(DIAMOND, 1.5, 2)).toBeCloseTo(0.5, 3);
    expect(at(DIAMOND, 1.25, 1.75)).toBeCloseTo(0.5, 3);
    expect(at(DIAMOND, 1.25 + FINE, 1.75 - FINE)).toBeCloseTo(0, 3);
    expect(at(DIAMOND, 1.25 - FINE, 1.75 + FINE)).toBeCloseTo(1, 3);
    expect(at(DIAMOND, 1.3, 2.3)).toBeCloseTo(0, 3);
    expect(at(ROUND, 1.3, 2.3)).toBeCloseTo(1, 3);
  });
});
