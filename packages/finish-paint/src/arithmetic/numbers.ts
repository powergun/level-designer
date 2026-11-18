import type { Arithmetic, CoreArithmetic } from "./arithmetic.js";
import { latticeHash } from "./lattice-hash.js";

const round = Math.fround;

/** The fourteen operations on numbers, each rounding its result to a 32-bit float. */
const core: CoreArithmetic<number> = {
  constant: (value) => round(value),
  add: (a, b) => round(a + b),
  sub: (a, b) => round(a - b),
  mul: (a, b) => round(a * b),
  div: (a, b) => round(a / b),
  min: (a, b) => round(Math.min(a, b)),
  max: (a, b) => round(Math.max(a, b)),
  abs: (a) => round(Math.abs(a)),
  floor: (a) => round(Math.floor(a)),
  fract: (a) => round(a - Math.floor(a)),
  sqrt: (a) => round(Math.sqrt(a)),
  mix: (a, b, t) => round(a * (1 - t) + b * t),
  step: (edge, x) => (x < edge ? 0 : 1),
  smoothstep: (edge0, edge1, x) => {
    const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
    return round(t * t * (3 - 2 * t));
  },
};

/** The number back end: the patterns of the GPU on the CPU, within one rounding. */
export const numberArithmetic: Arithmetic<number> = {
  ...core,
  hash: (x, y, z) => latticeHash(core, x, y, z),
};
