import type { Arithmetic } from "../arithmetic/index.js";
import { saturate } from "./fade.js";

/**
 * The parameters of `disc`: its centre `[across, up]` and radius in metres; an optional
 * inner radius, which makes a ring; and `diamond`, which measures the distance along the
 * two coordinates summed.
 */
export interface DiscParams<S> {
  readonly at: readonly [S, S];
  readonly radius: S;
  readonly inner?: S;
  readonly diamond: boolean;
}

/** A filled disc of `radius` at `distance`: its edge ramps linearly over one footprint. */
function filled<S>(a: Arithmetic<S>, radius: S, distance: S, footprint: S): S {
  return saturate(a, a.add(a.div(a.sub(radius, distance), footprint), a.constant(0.5)));
}

/**
 * The coverage of one disc, ring or diamond: one half on each edge, the edges ramped over
 * one footprint. It spends no hash.
 */
export function disc<S>(a: Arithmetic<S>, p: DiscParams<S>, x: S, y: S, footprint: S): S {
  const dx = a.sub(x, p.at[0]);
  const dy = a.sub(y, p.at[1]);
  const distance = p.diamond
    ? a.add(a.abs(dx), a.abs(dy))
    : a.sqrt(a.add(a.mul(dx, dx), a.mul(dy, dy)));
  const outer = filled(a, p.radius, distance, footprint);
  if (p.inner === undefined) {
    return outer;
  }
  return saturate(a, a.sub(outer, filled(a, p.inner, distance, footprint)));
}
