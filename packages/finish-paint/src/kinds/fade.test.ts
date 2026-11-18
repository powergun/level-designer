import { expect, test } from "bun:test";
import { numberArithmetic as a } from "../arithmetic/index.js";
import { footprintFade } from "./index.js";

test("the footprint fade keeps a feature to 0.22 of its wavelength and removes it at 0.5", () => {
  const wavelength = 0.06;
  expect(footprintFade(a, wavelength, 0.001)).toBe(1);
  expect(footprintFade(a, wavelength, 0.22 * wavelength)).toBe(1);
  expect(footprintFade(a, wavelength, 0.5 * wavelength)).toBe(0);
  expect(footprintFade(a, wavelength, 2 * wavelength)).toBe(0);
  for (const share of [0.23, 0.36, 0.49]) {
    const weight = footprintFade(a, wavelength, share * wavelength);
    expect(weight).toBeGreaterThan(0);
    expect(weight).toBeLessThan(1);
  }
});
