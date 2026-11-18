/**
 * The fourteen scalar operations a back end supplies before its hash. `mix`, `step` and
 * `smoothstep` take the argument order of the shading languages.
 */
export interface CoreArithmetic<S> {
  /** Lifts a number into a scalar. */
  constant(value: number): S;
  /** Returns `a + b`. */
  add(a: S, b: S): S;
  /** Returns `a - b`. */
  sub(a: S, b: S): S;
  /** Returns `a * b`. */
  mul(a: S, b: S): S;
  /** Returns `a / b`. */
  div(a: S, b: S): S;
  /** Returns the smaller of `a` and `b`. */
  min(a: S, b: S): S;
  /** Returns the larger of `a` and `b`. */
  max(a: S, b: S): S;
  /** Returns the magnitude of `a`. */
  abs(a: S): S;
  /** Returns the largest integer not above `a`. */
  floor(a: S): S;
  /** Returns `a - floor(a)`. */
  fract(a: S): S;
  /** Returns the square root of `a`. */
  sqrt(a: S): S;
  /** Returns `a * (1 - t) + b * t`. */
  mix(a: S, b: S, t: S): S;
  /** Returns 0 where `x` lies below `edge`, else 1. */
  step(edge: S, x: S): S;
  /** Returns the Hermite ramp from 0 at `edge0` to 1 at `edge1`, clamped outside them. */
  smoothstep(edge0: S, edge1: S, x: S): S;
}

/** The fifteen operations the layer kinds are written over: the core and the lattice hash. */
export interface Arithmetic<S> extends CoreArithmetic<S> {
  /** Returns the lattice hash, in 0 to 1, of the cell `x`, `y` and the seed `z`. */
  hash(x: S, y: S, z: S): S;
}
