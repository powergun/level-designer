import { describe, expect, test } from "bun:test";
import { numberArithmetic as a, slabFace, slabFrame } from "@level-designer/finish-paint";
import type { Pattern } from "@level-designer/level-format";
import { CENTRED, EVERYWHERE, TINT, coverageAt, layer, len, paintAt } from "./fixtures.ts";

/** Places of this file: one footprint is 1 mm, so three decimals hold. */
const PLACES = 3;

/** A slab's outside face of 3 x 0.8 m, centred: its low corner at (-1.5, 0). */
const WIDE = { ...CENTRED, low: [-1.5, 0], size: [3, 0.8] } as const;

/** A layer's coverage at `(x, y)` of the centred 2 x 1.2 m face. */
function centredAt(pattern: Pattern, x: number, y: number): number {
  return coverageAt(pattern, {}, { ...CENTRED, x, y });
}

describe("the painter's wiring of bands and dots", () => {
  test("a diagonal band runs along the sum of the coordinates, measured across the band", () => {
    // Period 1 m, width 0.2 m, centred on t = (u + v) / sqrt(2) = 0: |t| < 0.1 is covered.
    const diagonal: Pattern = {
      kind: "bands",
      along: "diagonal",
      period: len(1),
      width: len(0.2),
      phase: 0,
      offset: len(0),
      ramp: len(0),
    };
    expect(centredAt(diagonal, 0.06, 0.06)).toBeCloseTo(1, PLACES);
    expect(centredAt(diagonal, 0.08, 0.08)).toBeCloseTo(0, PLACES);
    expect(centredAt(diagonal, Math.SQRT1_2, Math.SQRT1_2)).toBeCloseTo(1, PLACES);
    expect(centredAt(diagonal, 0.5, -0.5)).toBeCloseTo(1, PLACES);
  });

  test("a band's phase, offset and ramp place its centre and its flank", () => {
    // Period 0.7, width 0.1: centre 0.25 * 0.7 + 0.01 = 0.185, edge 0.235, flank 0.04 m.
    const band: Pattern = {
      kind: "bands",
      along: "across",
      fit: false,
      period: len(0.7),
      width: len(0.1),
      phase: 0.25,
      offset: len(0.01),
      ramp: len(0.04),
    };
    expect(centredAt(band, 0.185, 0.5)).toBeCloseTo(1, PLACES);
    expect(centredAt(band, 0.235, 0.5)).toBeCloseTo(0.5, PLACES);
    // The window of 0.041 m at 0.25 holds 0.0055 m of the box: 0.13415.
    expect(centredAt(band, 0.25, 0.5)).toBeCloseTo(0.13415, PLACES);
    expect(centredAt(band, 0.257, 0.5)).toBeCloseTo(0, PLACES);
  });

  test("dots take their phase, offset and a radius with a share of the face", () => {
    // Radius 0.01 of the 2 m width: 0.02 m. Centres at (0.2 + 0.05, 0.7 - 0.03) + k.
    const dots: Pattern = {
      kind: "dots",
      pitch: [len(1), len(1)],
      radius: len(0, ["w", 0.01]),
      phase: [0.2, 0.7],
      offset: [len(0.05), len(-0.03)],
    };
    expect(centredAt(dots, 0.25, 0.67)).toBeCloseTo(1, PLACES);
    expect(centredAt(dots, -0.75, 1.67)).toBeCloseTo(1, PLACES);
    expect(centredAt(dots, 0.27, 0.67)).toBeCloseTo(0.5, PLACES);
    expect(centredAt(dots, 0.2, 0.7)).toBeCloseTo(0, PLACES);
  });
});

describe("the painter's wiring of fits, seeds, effect order and faces", () => {
  test("dots fitted on both coordinates fit each one to the face", () => {
    // 3 m over 0.7 m rounds to 4 bays of 0.75 m; 0.8 m over 0.3 m to 3 bays of 0.2667 m.
    const dots: Pattern = {
      kind: "dots",
      pitch: [len(0.7), len(0.3)],
      radius: len(0.02),
      phase: [0.5, 0.5],
      offset: [len(0), len(0)],
      fit: "both",
    };
    for (const [x, y] of [
      [-1.125, 0.8 / 6],
      [-1.125, 0.4],
      [1.125, 0.8 - 0.8 / 6],
      [-0.375, 0.4],
    ] as const) {
      expect(coverageAt(dots, {}, { ...WIDE, x, y })).toBeCloseTo(1, PLACES);
    }
    expect(coverageAt(dots, {}, { ...WIDE, x: -0.75, y: 0.4 })).toBeCloseTo(0, PLACES);
  });

  test("noise hashes with the face's seed, and its mask is a soft step", () => {
    // Wavelength 1 m: at the lattice point (2, 1) the noise is the hash of that cell.
    const wear: Pattern = { kind: "noise", wavelength: [len(1), len(1)] };
    const at = (seed: number, pattern: Pattern = wear): number =>
      coverageAt(pattern, {}, { ...CENTRED, x: 2, y: 1, seed });
    expect(at(7)).toBeCloseTo(a.hash(2, 1, 7), 6);
    expect(at(1)).toBeCloseTo(a.hash(2, 1, 1), 6);
    expect(at(1)).not.toBeCloseTo(at(2), 3);
    const value = a.hash(2, 1, 7);
    const masked = (threshold: number): Pattern => ({
      ...wear,
      mask: { threshold, softness: 0.2 },
    });
    expect(at(7, masked(value))).toBeCloseTo(0.5, 4);
    expect(at(7, masked(value - 0.1))).toBeCloseTo(1, 6);
    expect(at(7, masked(value + 0.1))).toBeCloseTo(0, 6);
  });

  test("shade then paint in one layer ends at the tint", () => {
    const both = layer(EVERYWHERE, { shade: 2, paint: 1 });
    expect(paintAt([both], CENTRED).albedo).toEqual(TINT);
  });

  test("slabFace puts a slab face's low corner half its width below 0", () => {
    const frame = slabFrame([3, 0.8, 0.2], [0.5, 0.8, 0.05], [0, 1, 0]);
    const vertex = { ...frame, seed: 9, wear: 0.5 };
    const face = slabFace(a, vertex);
    expect(face.low).toEqual([-1.5, 0]);
    expect(face.size).toEqual([3, 0.2]);
    expect([face.x, face.y, face.faceClass, face.seed, face.wear]).toEqual([
      0.5,
      frame.y,
      2,
      9,
      0.5,
    ]);
  });
});
