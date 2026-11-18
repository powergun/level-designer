import type { Arithmetic } from "../arithmetic/index.js";
import { saturate } from "./fade.js";

/** The parameters of `bands`, in metres except `phase`, a share of the period. */
export interface BandsParams<S> {
  readonly period: S;
  readonly width: S;
  readonly phase: S;
  readonly offset: S;
  readonly ramp: S;
}

/** The covered length from 0 to `x` of boxes `span` long that start every `period`. */
function coveredLength<S>(a: Arithmetic<S>, x: S, period: S, span: S): S {
  const cycles = a.div(x, period);
  return a.add(a.mul(a.floor(cycles), span), a.min(a.mul(a.fract(cycles), period), span));
}

/**
 * The coverage of bands along the coordinate `t`, box-filtered over the footprint. A band's
 * centre lies at `phase` times the period plus `offset`; a ramp is a linear flank of that
 * width centred on each edge. Over many periods it returns `width / period`.
 */
export function bands<S>(a: Arithmetic<S>, p: BandsParams<S>, t: S, footprint: S): S {
  const half = a.constant(0.5);
  const start = a.sub(a.add(a.mul(p.phase, p.period), p.offset), a.mul(p.width, half));
  const local = a.sub(t, start);
  const filter = a.add(footprint, p.ramp);
  const reach = a.mul(filter, half);
  const high = coveredLength(a, a.add(local, reach), p.period, p.width);
  const low = coveredLength(a, a.sub(local, reach), p.period, p.width);
  return saturate(a, a.div(a.sub(high, low), filter));
}
