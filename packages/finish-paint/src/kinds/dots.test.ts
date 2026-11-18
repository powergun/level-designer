import { describe, expect, test } from "bun:test";
import { numberArithmetic as a } from "../arithmetic/index.js";
import { dots, type DotsParams } from "./index.js";

/** One footprint of 1 mm, far below every disc's radius. */
const FINE = 0.001;

/** Discs of 0.2 m radius every metre, centred at (0.5, 0.5) m in each cell. */
const LATTICE: DotsParams<number> = {
  pitch: [1, 1],
  radius: 0.2,
  phase: [0.5, 0.5],
  offset: [0, 0],
};

/** The discs' share of the lattice: pi * 0.2^2 over 1 m^2. */
const SHARE = Math.PI * 0.04;

describe("dots", () => {
  test("covers 1 at a lattice point and 0 midway between four", () => {
    expect(dots(a, LATTICE, 0.5, 0.5, FINE)).toBeCloseTo(1, 5);
    expect(dots(a, LATTICE, -3.5, 12.5, FINE)).toBeCloseTo(1, 5);
    expect(dots(a, LATTICE, 1, 1, FINE)).toBeCloseTo(0, 5);
    expect(dots(a, LATTICE, 0, 0, FINE)).toBeCloseTo(0, 5);
  });

  test("covers one half on a disc's edge and ramps over one footprint", () => {
    expect(dots(a, LATTICE, 0.7, 0.5, FINE)).toBeCloseTo(0.5, 3);
    expect(dots(a, LATTICE, 0.5, 0.3, FINE)).toBeCloseTo(0.5, 3);
    expect(dots(a, LATTICE, 0.7 - FINE / 2, 0.5, FINE)).toBeCloseTo(1, 3);
    expect(dots(a, LATTICE, 0.7 + FINE / 2, 0.5, FINE)).toBeCloseTo(0, 3);
  });

  test("fades to the discs' share past 0.5 of the shorter pitch", () => {
    const wide: DotsParams<number> = { ...LATTICE, pitch: [1, 3] };
    expect(dots(a, LATTICE, 0.5, 0.5, 0.5)).toBeCloseTo(SHARE, 5);
    expect(dots(a, LATTICE, 0.5, 0.5, 0.6)).toBeCloseTo(SHARE, 5);
    expect(dots(a, wide, 0.5, 1.5, 0.5)).toBeCloseTo(SHARE / 3, 5);
    expect(dots(a, LATTICE, 0.5, 0.5, 0.22)).toBeCloseTo(1, 5);
    expect(dots(a, LATTICE, 0.5, 0.5, 0.49)).toBeGreaterThan(SHARE);
  });

  test("overlapping discs fade to a share of at most the whole lattice", () => {
    const overlapping: DotsParams<number> = { ...LATTICE, radius: 0.8 };
    expect(dots(a, overlapping, 0.5, 0.5, 0.6)).toBe(1);
  });

  test("covers 0 to 1 at every corner of pitch, radius and footprint", () => {
    const values: number[] = [];
    for (const pitch of [
      [0.001, 0.001],
      [1, 0.25],
      [8, 6.25],
    ] as const) {
      const shorter = Math.min(...pitch);
      for (const radius of [0.001, 0.5 * shorter, 0.564 * shorter, shorter, 2 * pitch[0]]) {
        for (const footprint of [1e-5, 0.22 * shorter, 0.36 * shorter, 0.5 * shorter, 20]) {
          for (const at of [0, 0.37, -59.9, 60]) {
            values.push(dots(a, { ...LATTICE, pitch, radius }, at, -at, footprint));
          }
        }
      }
    }
    expect(values).toHaveLength(300);
    expect(values.filter((v) => v < 0 || v > 1)).toEqual([]);
  });

  test("phase and offset move the lattice", () => {
    const moved: DotsParams<number> = { ...LATTICE, phase: [0, 0], offset: [0.25, -0.1] };
    expect(dots(a, moved, 0.25, -0.1, FINE)).toBeCloseTo(1, 5);
    expect(dots(a, moved, 0.5, 0.5, FINE)).toBeCloseTo(0, 5);
  });
});
