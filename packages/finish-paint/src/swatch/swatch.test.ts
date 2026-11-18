import { describe, expect, test } from "bun:test";
import type { DrawnRecipe, Layer, Pattern } from "@level-designer/level-format";
import { paintSwatch, type Swatch, type SwatchRequest } from "./index.js";

/** A linear tint, exact in 32-bit floats. */
const TINT = [0.5, 0.25, 0.125] as const;

/** A layer on the outside face with the format's defaults that darkens to `shade`. */
function darken(pattern: Pattern, shade: number): Layer {
  return { pattern, on: "outside", wear: false, amount: 1, effects: { shade } };
}

/** Bands 0.25 m wide every metre across, centred at 0.5 m: each covers 0.375 to 0.625 m. */
const BANDS: Pattern = {
  kind: "bands",
  along: "across",
  period: { metres: 1 },
  width: { metres: 0.25 },
  phase: 0.5,
  offset: { metres: 0 },
  ramp: { metres: 0 },
  fit: false,
};

/** The upper half of a face 1 m high. */
const UPPER: Pattern = {
  kind: "rectangle",
  from: [{ metres: -100 }, { metres: 0.5 }],
  to: [{ metres: 100 }, { metres: 100 }],
};

/** A recipe of the default body and the given layers. */
function recipe(...layers: Layer[]): DrawnRecipe {
  return { body: { shade: 1, metalness: 0, roughness: 0.6, lit: 0 }, layers, light: "#ffffff" };
}

/** A slab's outside face of 4 x 1 m at 5 mm per pixel: 800 x 200 pixels. */
const REQUEST: SwatchRequest = {
  face: { low: [-2, 0], size: [4, 1], faceClass: 0, seed: 7, wear: 0.3 },
  scale: 0.005,
  tint: TINT,
  light: [1, 1, 1],
};

/** The red albedo of one pixel. */
function red(swatch: Swatch, column: number, row: number): number | undefined {
  return swatch.albedo[(row * swatch.width + column) * 3];
}

describe("paintSwatch", () => {
  test("the mean of a swatch of bands is the mix of its two shades", () => {
    const swatch = paintSwatch(recipe(darken(BANDS, 0.5)), REQUEST);
    expect([swatch.width, swatch.height]).toEqual([800, 200]);
    expect(swatch.albedo).toHaveLength(800 * 200 * 3);
    const share = 0.25;
    for (const [channel, tint] of TINT.entries()) {
      expect(swatch.mean[channel]).toBeCloseTo(tint * (1 - share + share * 0.5), 5);
    }
  });

  test("a band lands on its hand-computed pixel columns", () => {
    const swatch = paintSwatch(recipe(darken(BANDS, 0)), REQUEST);
    // Column c samples x = -2 + (c + 0.5) * 0.005: the band spans columns 475 to 524.
    expect(red(swatch, 474, 100)).toBeCloseTo(0.5, 5);
    expect(red(swatch, 475, 100)).toBeCloseTo(0, 5);
    expect(red(swatch, 524, 100)).toBeCloseTo(0, 5);
    expect(red(swatch, 525, 100)).toBeCloseTo(0.5, 5);
  });

  test("row 0 is the window's top", () => {
    const swatch = paintSwatch(recipe(darken(UPPER, 0)), REQUEST);
    expect(red(swatch, 10, 0)).toBeCloseTo(0, 5);
    expect(red(swatch, 10, 99)).toBeCloseTo(0, 5);
    expect(red(swatch, 10, 100)).toBeCloseTo(0.5, 5);
    expect(red(swatch, 10, 199)).toBeCloseTo(0.5, 5);
  });

  test("a window draws only its part of the face", () => {
    const window = { low: [0, 0], size: [1, 0.5] } as const;
    const swatch = paintSwatch(recipe(darken(BANDS, 0), darken(UPPER, 0)), {
      ...REQUEST,
      window,
    });
    expect([swatch.width, swatch.height]).toEqual([200, 100]);
    expect(red(swatch, 74, 50)).toBeCloseTo(0.5, 5);
    expect(red(swatch, 75, 50)).toBeCloseTo(0, 5);
    expect(swatch.mean[0]).toBeCloseTo(0.5 * 0.75, 5);
  });
});
