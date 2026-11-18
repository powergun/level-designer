import type { Arithmetic } from "../arithmetic/index.js";
import { saturate } from "./fade.js";

/** The parameters of `rectangle`: two corners `[across, up]` in metres, in either order. */
export interface RectangleParams<S> {
  readonly from: readonly [S, S];
  readonly to: readonly [S, S];
}

/** The share of one footprint centred on `t` that lies between `end0` and `end1`. */
function intervalCoverage<S>(a: Arithmetic<S>, t: S, end0: S, end1: S, footprint: S): S {
  const reach = a.mul(footprint, a.constant(0.5));
  const high = a.min(a.add(t, reach), a.max(end0, end1));
  const low = a.max(a.sub(t, reach), a.min(end0, end1));
  return saturate(a, a.div(a.sub(high, low), footprint));
}

/** The coverage of one axis-aligned rectangle, box-filtered over the footprint on each axis. */
export function rectangle<S>(a: Arithmetic<S>, p: RectangleParams<S>, x: S, y: S, footprint: S): S {
  const across = intervalCoverage(a, x, p.from[0], p.to[0], footprint);
  return a.mul(across, intervalCoverage(a, y, p.from[1], p.to[1], footprint));
}
