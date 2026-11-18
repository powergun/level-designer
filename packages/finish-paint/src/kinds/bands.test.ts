import { describe, expect, test } from "bun:test";
import { numberArithmetic as a } from "../arithmetic/index.js";
import { bands, type BandsParams } from "./index.js";

/** One footprint of 1 mm, far below every band's width. */
const FINE = 0.001;

/** Decimal places a 1 mm box filter holds in 32-bit floats a few metres from the origin. */
const PLACES = 3;

/** Bands 0.2 m wide every metre, centred at 0.5 m: each covers 0.4 to 0.6 m. */
const PLAIN: BandsParams<number> = { period: 1, width: 0.2, phase: 0.5, offset: 0, ramp: 0 };

/** The plain bands with flanks of 0.1 m centred on each edge: full from 0.45 to 0.55. */
const RAMPED: BandsParams<number> = { ...PLAIN, ramp: 0.1 };

describe("bands", () => {
  test("covers 1 inside a band, 0 outside and one half on its edge", () => {
    expect(bands(a, PLAIN, 0.5, FINE)).toBeCloseTo(1, PLACES);
    expect(bands(a, PLAIN, 0.6 - FINE, FINE)).toBeCloseTo(1, PLACES);
    expect(bands(a, PLAIN, 0.6, FINE)).toBeCloseTo(0.5, PLACES);
    expect(bands(a, PLAIN, 0.6 + FINE, FINE)).toBeCloseTo(0, PLACES);
    expect(bands(a, PLAIN, 0.4 - FINE, FINE)).toBeCloseTo(0, PLACES);
    expect(bands(a, PLAIN, 7.5, FINE)).toBeCloseTo(1, PLACES);
    expect(bands(a, PLAIN, -2.5, FINE)).toBeCloseTo(1, PLACES);
  });

  test("ten periods in a footprint return the width over the period", () => {
    for (const t of [0, 0.37, 0.6, -13.2]) {
      expect(bands(a, PLAIN, t, 10)).toBeCloseTo(0.2, 3);
      // The ramp widens the filter to 10.1 m, which may hold one more band: two places.
      expect(bands(a, RAMPED, t, 10)).toBeCloseTo(0.2, 2);
    }
  });

  test("phase 0 puts a band on the origin, and offset moves it", () => {
    const origin = { ...PLAIN, phase: 0 };
    expect(bands(a, origin, 0, FINE)).toBeCloseTo(1, PLACES);
    expect(bands(a, origin, 0.5, FINE)).toBeCloseTo(0, PLACES);
    expect(bands(a, { ...origin, offset: 0.25 }, 0.25, FINE)).toBeCloseTo(1, PLACES);
    expect(bands(a, { ...origin, offset: 0.25 }, 0, FINE)).toBeCloseTo(0, PLACES);
  });

  test("a ramp is a flank centred on each edge, one half on the edge", () => {
    expect(bands(a, RAMPED, 0.55 - FINE, FINE)).toBeCloseTo(1, PLACES);
    expect(bands(a, RAMPED, 0.6, FINE)).toBeCloseTo(0.5, PLACES);
    expect(bands(a, RAMPED, 0.4, FINE)).toBeCloseTo(0.5, PLACES);
    expect(bands(a, RAMPED, 0.625, FINE)).toBeCloseTo(0.2525, PLACES);
    expect(bands(a, RAMPED, 0.65 + FINE, FINE)).toBeCloseTo(0, PLACES);
    expect(bands(a, RAMPED, 0.35 - FINE, FINE)).toBeCloseTo(0, PLACES);
  });
});
