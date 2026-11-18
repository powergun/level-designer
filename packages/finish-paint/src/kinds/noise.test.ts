import { describe, expect, test } from "bun:test";
import { numberArithmetic as a } from "../arithmetic/index.js";
import { noise, type NoiseParams } from "./index.js";

/** One footprint of 1 mm, far below every wavelength. */
const FINE = 0.001;

/** Noise of 1 m across and 2 m up. */
const WEAR: NoiseParams<number> = { wavelength: [1, 2] };

/** A distance just beside a cell edge. */
const NEAR = 1e-5;

/** The noise at one point, masked by a soft step of 0.2 at `threshold`. */
function masked(threshold: number, footprint: number): number {
  return noise(a, { ...WEAR, mask: { threshold, softness: 0.2 } }, 0.3, 0.7, 5, footprint);
}

describe("noise", () => {
  test("takes the seeded hash of its cell at a lattice point", () => {
    expect(noise(a, WEAR, 3, 4, 17, FINE)).toBeCloseTo(a.hash(3, 2, 17), 6);
    expect(noise(a, WEAR, -2, -6, 0, FINE)).toBeCloseTo(a.hash(-2, -3, 0), 6);
  });

  test("is equal across a cell edge along each coordinate", () => {
    for (const seed of [0, 9, 4095]) {
      const acrossLow = noise(a, WEAR, 3 - NEAR, 0.7, seed, FINE);
      const acrossHigh = noise(a, WEAR, 3 + NEAR, 0.7, seed, FINE);
      expect(Math.abs(acrossHigh - acrossLow)).toBeLessThan(1e-3);
      const upLow = noise(a, WEAR, 0.3, 4 - NEAR, seed, FINE);
      const upHigh = noise(a, WEAR, 0.3, 4 + NEAR, seed, FINE);
      expect(Math.abs(upHigh - upLow)).toBeLessThan(1e-3);
    }
  });

  test("fades to 0.5 past 0.5 of its shorter wavelength", () => {
    expect(noise(a, WEAR, 0.3, 0.7, 5, 0.5)).toBe(0.5);
    expect(noise(a, WEAR, 0.3, 0.7, 5, 0.6)).toBe(0.5);
    const sharp = noise(a, WEAR, 0.3, 0.7, 5, 0.22);
    expect(sharp).toBe(noise(a, WEAR, 0.3, 0.7, 5, FINE));
    expect(sharp).not.toBe(0.5);
  });

  test("two seeds give two patterns", () => {
    const points = [0.3, 1.7, 5.2, -4.4];
    const first = points.map((x) => noise(a, WEAR, x, x, 1, FINE));
    const second = points.map((x) => noise(a, WEAR, x, x, 2, FINE));
    expect(second).not.toEqual(first);
  });

  test("a mask is a soft step of the faded noise", () => {
    expect(masked(0.5, 0.5)).toBeCloseTo(0.5, 5);
    expect(masked(0.4, 0.5)).toBe(1);
    expect(masked(0.6, 0.5)).toBe(0);
    expect(masked(-0.1, FINE)).toBe(1);
    expect(masked(1.1, FINE)).toBe(0);
  });
});
