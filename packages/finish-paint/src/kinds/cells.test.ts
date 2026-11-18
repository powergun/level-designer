import { describe, expect, test } from "bun:test";
import { numberArithmetic as a } from "../arithmetic/index.js";
import { cells, type CellsParams } from "./index.js";

/** One footprint of 1 mm, far below every cell and gap. */
const FINE = 0.001;

/** The seed of every cell of the tests. */
const SEED = 9;

/** Cells of 0.9 x 0.4 m with gaps of 0.1 m: a pitch of 1 x 0.5 m, unshifted, none whole. */
const GRID: CellsParams<number> = { pitch: [1, 0.5], gap: 0.1, shift: 0, share: 0 };

/** The coverage of a grid at a point. */
function coverage(p: CellsParams<number>, x: number, y: number, footprint = FINE): number {
  return cells(a, p, x, y, SEED, footprint).coverage;
}

/** The tone of a grid's cell at a point. */
function tone(x: number, y: number, footprint = FINE): number {
  return cells(a, GRID, x, y, SEED, footprint).tone;
}

describe("cells", () => {
  test("covers 1 on a gap's centre line and 0 at a cell's centre", () => {
    expect(coverage(GRID, 0, 0.25)).toBeCloseTo(1, 3);
    expect(coverage(GRID, 3, 0.1)).toBeCloseTo(1, 3);
    expect(coverage(GRID, 0.5, 0)).toBeCloseTo(1, 3);
    expect(coverage(GRID, 0.5, 0.25)).toBeCloseTo(0, 3);
    expect(coverage(GRID, -2.5, 1.75)).toBeCloseTo(0, 3);
  });

  test("covers one half on a gap's edge and changes within one footprint", () => {
    expect(coverage(GRID, 0.05, 0.25)).toBeCloseTo(0.5, 3);
    expect(coverage(GRID, 0.05 - FINE, 0.25)).toBeCloseTo(1, 3);
    expect(coverage(GRID, 0.05 + FINE, 0.25)).toBeCloseTo(0, 3);
    expect(coverage(GRID, 0.5, 0.45)).toBeCloseTo(0.5, 3);
    expect(coverage(GRID, 0.5, 0.45 - FINE)).toBeCloseTo(0, 3);
  });

  test("a shift of one half moves the next row's gaps by half the pitch", () => {
    const bond: CellsParams<number> = { ...GRID, shift: 0.5 };
    expect(coverage(bond, 0, 0.25)).toBeCloseTo(1, 3);
    expect(coverage(bond, 0.5, 0.75)).toBeCloseTo(1, 3);
    expect(coverage(bond, 0, 0.75)).toBeCloseTo(0, 3);
    expect(coverage(GRID, 0, 0.75)).toBeCloseTo(1, 3);
    expect(coverage(GRID, 0.5, 0.75)).toBeCloseTo(0, 3);
  });

  test("a cell's tone is equal inside it, in 0 to 1, and differs from its neighbours'", () => {
    const own = tone(0.5, 0.25);
    expect(tone(0.1, 0.06)).toBe(own);
    expect(tone(0.94, 0.44)).toBe(own);
    expect(own).toBeGreaterThanOrEqual(0);
    expect(own).toBeLessThanOrEqual(1);
    for (const [x, y] of [
      [1.5, 0.25],
      [-0.5, 0.25],
      [0.5, 0.75],
      [0.5, -0.25],
    ] as const) {
      expect(tone(x, y)).not.toBe(own);
    }
  });

  test("the tone fades to one half by 0.5 of the shorter pitch", () => {
    expect(tone(0.5, 0.25, 0.11)).toBe(tone(0.5, 0.25));
    expect(tone(0.5, 0.25, 0.25)).toBe(0.5);
    expect(tone(0.5, 0.25, 0.3)).toBe(0.5);
  });

  test("many cells in a footprint return the gaps' share, plus the share of whole cells", () => {
    const gaps = 1 - (0.9 / 1) * (0.4 / 0.5);
    expect(coverage(GRID, 0.3, 0.2, 20)).toBeCloseTo(gaps, 2);
    expect(coverage({ ...GRID, share: 0.3 }, 0.3, 0.2, 20)).toBeCloseTo(gaps + 0.3 * 0.72, 2);
  });

  test("share covers whole the cells whose tone lies below it", () => {
    expect(coverage({ ...GRID, share: 1 }, 0.5, 0.25)).toBeCloseTo(1, 3);
    const picks = [-3, -2, -1, 0, 1, 2, 3, 4].map((cell) => {
      const x = cell + 0.5;
      return { below: tone(x, 0.25) < 0.5, covered: coverage({ ...GRID, share: 0.5 }, x, 0.25) };
    });
    expect(new Set(picks.map((pick) => pick.below))).toEqual(new Set([true, false]));
    for (const pick of picks) {
      expect(pick.covered).toBeCloseTo(pick.below ? 1 : 0, 3);
    }
  });
});
