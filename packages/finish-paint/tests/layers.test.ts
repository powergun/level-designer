import { describe, expect, test } from "bun:test";
import type { Face, Layer, Pattern } from "@level-designer/level-format";
import { CENTRED, EVERYWHERE, FINE, HALL, coverageAt, len } from "./fixtures.ts";

/** Places of this file: one footprint is 1 mm, so three decimals hold. */
const PLACES = 3;

/** The classes each face name draws on, as the finish format's sentences list them. */
const DRAWN: readonly (readonly [Face, readonly number[]])[] = [
  ["outside", [0]],
  ["inside", [1]],
  ["sides", [0, 1]],
  ["top", [2]],
  ["bottom", [3]],
  ["end+", [4]],
  ["end-", [5]],
  ["ends", [4, 5]],
  ["edges", [2, 3, 4, 5]],
  ["all", [0, 1, 2, 3, 4, 5]],
];

/** A rectangle from `[x0, y0]` to `[x1, y1]` in plain metres. */
function box(x0: number, y0: number, x1: number, y1: number): Pattern {
  return { kind: "rectangle", from: [len(x0), len(y0)], to: [len(x1), len(y1)] };
}

/** A layer's coverage at `(x, y)` of a face. */
function at(
  pattern: Pattern,
  keys: Partial<Layer>,
  face: typeof CENTRED,
  x: number,
  y: number,
): number {
  return coverageAt(pattern, keys, { ...face, x, y });
}

/** A footprint of 1 cm on the hall wall: 1 mm holds only three decimals at 18 m in f32. */
const HALL_FOOTPRINT = 0.01;

/** A layer's coverage at `(x, y)` of the hall wall. */
function hallAt(pattern: Pattern, keys: Partial<Layer>, x: number, y: number): number {
  return coverageAt(pattern, keys, { ...HALL, x, y }, HALL_FOOTPRINT);
}

describe("where a layer draws", () => {
  test("a layer draws only on its faces", () => {
    for (const [on, classes] of DRAWN) {
      for (let faceClass = 0; faceClass < 6; faceClass += 1) {
        const covered = coverageAt(EVERYWHERE, { on }, { ...CENTRED, faceClass });
        expect({ on, faceClass, covered }).toEqual({
          on,
          faceClass,
          covered: classes.includes(faceClass) ? 1 : 0,
        });
      }
    }
  });

  test("a layer draws only inside its clip", () => {
    const clip = { from: [len(0), len(0)], to: [len(0.5), len(0.5)] } as const;
    expect(at(EVERYWHERE, { clip }, CENTRED, 0.25, 0.25)).toBeCloseTo(1, PLACES);
    expect(at(EVERYWHERE, { clip }, CENTRED, 0.5, 0.25)).toBeCloseTo(0.5, PLACES);
    expect(at(EVERYWHERE, { clip }, CENTRED, 0.5 + FINE, 0.25)).toBeCloseTo(0, PLACES);
    expect(at(EVERYWHERE, { clip }, CENTRED, 0.25, -FINE)).toBeCloseTo(0, PLACES);
  });

  test("a detail is whole at 0.44 of its end and gone at its end", () => {
    for (const [detail, end] of [
      ["medium", 0.03],
      ["fine", 0.008],
    ] as const) {
      expect(coverageAt(EVERYWHERE, { detail }, CENTRED, 0.44 * end)).toBeCloseTo(1, 5);
      expect(coverageAt(EVERYWHERE, { detail }, CENTRED, 0.45 * end)).toBeLessThan(1);
      expect(coverageAt(EVERYWHERE, { detail }, CENTRED, 0.99 * end)).toBeGreaterThan(0);
      expect(coverageAt(EVERYWHERE, { detail }, CENTRED, end)).toBeCloseTo(0, 5);
    }
    expect(coverageAt(EVERYWHERE, {}, CENTRED, 1)).toBe(1);
  });

  test("a wearing layer follows the wear, and another ignores it", () => {
    for (const wear of [0, 0.3, 1]) {
      const face = { ...CENTRED, wear: Math.fround(wear) };
      expect(coverageAt(EVERYWHERE, { wear: true }, face)).toBeCloseTo(wear, 6);
      expect(coverageAt(EVERYWHERE, {}, face)).toBe(1);
    }
  });
});

describe("the places of a layer, on a centred face (low (-1, 0), 2 x 1.2 m)", () => {
  test("ends mirrors a mark in from both ends", () => {
    const post = box(0, 0, 0.1, 1.2);
    expect(at(post, { across: "ends" }, CENTRED, -0.95, 0.6)).toBeCloseTo(1, PLACES);
    expect(at(post, { across: "ends" }, CENTRED, 0.95, 0.6)).toBeCloseTo(1, PLACES);
    expect(at(post, { across: "ends" }, CENTRED, 0.9, 0.6)).toBeCloseTo(0.5, PLACES);
    expect(at(post, { across: "ends" }, CENTRED, 0, 0.6)).toBeCloseTo(0, PLACES);
  });

  test("out mirrors a mark out from the centre line", () => {
    const strip = box(0.3, 0, 0.5, 1.2);
    expect(at(strip, { across: "out" }, CENTRED, 0.4, 0.6)).toBeCloseTo(1, PLACES);
    expect(at(strip, { across: "out" }, CENTRED, -0.4, 0.6)).toBeCloseTo(1, PLACES);
    expect(at(strip, { across: "out" }, CENTRED, -0.3, 0.6)).toBeCloseTo(0.5, PLACES);
    expect(at(strip, { across: "out" }, CENTRED, 0, 0.6)).toBeCloseTo(0, PLACES);
  });

  test("top measures down from the face's top", () => {
    const cap = box(-10, 0, 10, 0.1);
    expect(at(cap, { up: "top" }, CENTRED, 0, 1.15)).toBeCloseTo(1, PLACES);
    expect(at(cap, { up: "top" }, CENTRED, 0, 1.1)).toBeCloseTo(0.5, PLACES);
    expect(at(cap, { up: "top" }, CENTRED, 0, 1.05)).toBeCloseTo(0, PLACES);
  });

  test("a share with an offset lies 0.2 m inside each end", () => {
    const inset: Pattern = {
      kind: "rectangle",
      from: [len(0.2, ["w", -0.5]), len(0)],
      to: [len(-0.2, ["w", 0.5]), len(0, ["h", 1])],
    };
    expect(at(inset, {}, CENTRED, -0.8, 0.6)).toBeCloseTo(0.5, PLACES);
    expect(at(inset, {}, CENTRED, 0.8, 0.6)).toBeCloseTo(0.5, PLACES);
    expect(at(inset, {}, CENTRED, 0.8, 1.2)).toBeCloseTo(0.25, PLACES);
    expect(at(inset, {}, CENTRED, 0, 0.6)).toBeCloseTo(1, PLACES);
  });

  test("a fitted period of 0.7 m becomes 2/3 m from the low edge", () => {
    const bays = fittedBands(0.7);
    for (const centre of [-2 / 3, 0, 2 / 3]) {
      expect(at(bays, {}, CENTRED, centre, 0.6)).toBeCloseTo(1, PLACES);
    }
    expect(at(bays, {}, CENTRED, -1 / 3, 0.6)).toBeCloseTo(0, PLACES);
    expect(at(bays, {}, CENTRED, 0.05, 0.6)).toBeCloseTo(0.5, PLACES);
  });
});

describe("the places of a layer, on a hall wall (low (10, -3), 16 x 8 m)", () => {
  test("ends, out and top measure from the face's own ends, centre and top", () => {
    const post = box(0, -10, 0.5, 10);
    expect(hallAt(post, { across: "ends" }, 10.25, 1)).toBeCloseTo(1, PLACES);
    expect(hallAt(post, { across: "ends" }, 25.75, 1)).toBeCloseTo(1, PLACES);
    expect(hallAt(post, { across: "ends" }, 18, 1)).toBeCloseTo(0, PLACES);
    const strip = box(1, -10, 2, 10);
    expect(hallAt(strip, { across: "out" }, 16.5, 1)).toBeCloseTo(1, PLACES);
    expect(hallAt(strip, { across: "out" }, 19.5, 1)).toBeCloseTo(1, PLACES);
    expect(hallAt(strip, { across: "out" }, 18, 1)).toBeCloseTo(0, PLACES);
    const cap = box(-100, 0, 100, 0.5);
    expect(hallAt(cap, { up: "top" }, 18, 4.75)).toBeCloseTo(1, PLACES);
    expect(hallAt(cap, { up: "top" }, 18, 4.25)).toBeCloseTo(0, PLACES);
  });

  test("a share serves as a length, and positions are level coordinates", () => {
    const quarter: Pattern = {
      kind: "rectangle",
      from: [len(12), len(-10)],
      to: [len(12, ["w", 0.25]), len(10)],
    };
    expect(hallAt(quarter, {}, 14, 1)).toBeCloseTo(1, PLACES);
    expect(hallAt(quarter, {}, 16, 1)).toBeCloseTo(0.5, PLACES);
    expect(hallAt(quarter, {}, 12, 1)).toBeCloseTo(0.5, PLACES);
  });

  test("a fitted period of 5 m becomes 16/3 m from the face's low edge", () => {
    const bays = fittedBands(5);
    for (const centre of [10 + 8 / 3, 18, 26 - 8 / 3]) {
      expect(hallAt(bays, {}, centre, 1)).toBeCloseTo(1, PLACES);
    }
    expect(hallAt(bays, {}, 10 + 16 / 3, 1)).toBeCloseTo(0, PLACES);
  });
});

/** Fitted bands 0.1 m wide across the face, centred in each bay. */
function fittedBands(period: number): Pattern {
  return {
    kind: "bands",
    along: "across",
    period: len(period),
    width: len(0.1),
    phase: 0.5,
    offset: len(0),
    fit: true,
    ramp: len(0),
  };
}
