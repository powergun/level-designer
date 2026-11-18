import { describe, expect, test } from "bun:test";
import { latticeHash, numberArithmetic as a } from "./index.js";

/** One operation's result beside the exact value of its meaning, in 64-bit floats. */
type Case = readonly [name: string, result: number, exact: number];

/** Inputs whose sums, products and roots are no 32-bit float. */
const P = 0.1;
const Q = 0.7;

const CASES: readonly Case[] = [
  ["constant", a.constant(P), P],
  ["add", a.add(P, Q), P + Q],
  ["sub", a.sub(P, Q), P - Q],
  ["mul", a.mul(P, Q), P * Q],
  ["div", a.div(P, Q), P / Q],
  ["min", a.min(P, Q), P],
  ["max", a.max(P, Q), Q],
  ["abs", a.abs(-P), P],
  ["floor", a.floor(-P), -1],
  ["fract", a.fract(Q + 3), Q + 3 - 3],
  ["sqrt", a.sqrt(Q), Math.sqrt(Q)],
  ["mix", a.mix(P, Q, 0.3), P * 0.7 + Q * 0.3],
  ["step", a.step(P, Q), 1],
  ["smoothstep", a.smoothstep(0, 1, P), P * P * (3 - 2 * P)],
  ["hash", a.hash(1, 0, 0), latticeHash(a, 1, 0, 0)],
];

describe("the number back end", () => {
  test("every operation returns the 32-bit rounding of its result", () => {
    expect(CASES.map(([name]) => name)).toHaveLength(15);
    for (const [name, result, exact] of CASES) {
      expect({ name, result }).toEqual({ name, result: Math.fround(result) });
      expect({ name, result }).toEqual({ name, result: Math.fround(exact) });
    }
  });

  test("mix, step and smoothstep take the shading languages' argument order", () => {
    expect(a.mix(2, 4, 0.25)).toBe(2.5);
    expect(a.mix(2, 4, 0)).toBe(2);
    expect(a.mix(2, 4, 1)).toBe(4);
    expect(a.step(1, 0.999)).toBe(0);
    expect(a.step(1, 1)).toBe(1);
    expect(a.step(1, 2)).toBe(1);
    expect(a.smoothstep(0, 1, 0.25)).toBe(0.15625);
    expect(a.smoothstep(2, 4, 2)).toBe(0);
    expect(a.smoothstep(2, 4, 1)).toBe(0);
    expect(a.smoothstep(2, 4, 4)).toBe(1);
    expect(a.smoothstep(2, 4, 5)).toBe(1);
  });

  test("floor and fract follow the shading languages below 0", () => {
    expect(a.floor(-0.25)).toBe(-1);
    expect(a.fract(-0.25)).toBe(0.75);
  });

  test("hash equals latticeHash over the other fourteen", () => {
    const ends = [0, 1, -1, 7, 4095, 4096, -4096];
    for (const x of ends) {
      for (const y of ends) {
        for (const seed of [0, 1, 4095]) {
          expect(a.hash(x, y, seed)).toBe(latticeHash(a, x, y, seed));
        }
      }
    }
  });
});
