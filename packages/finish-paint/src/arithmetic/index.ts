/**
 * The arithmetic interface the layer kinds are written over, the lattice hash that every
 * back end builds its `hash` from, and the number back end, rounded to 32-bit floats.
 */
export type { Arithmetic, CoreArithmetic } from "./arithmetic.js";
export { latticeHash } from "./lattice-hash.js";
export { numberArithmetic } from "./numbers.js";
