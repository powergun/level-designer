import type { Arithmetic } from "../arithmetic/index.js";
import { saturate } from "./fade.js";
import { rectangle } from "./rectangle.js";

/**
 * The parameters of `border`, in metres: the face's outline by its low and high corners
 * `[across, up]`, the frame's width at both ends, at the top and at the base, and its inset
 * from the outline.
 */
export interface BorderParams<S> {
  readonly low: readonly [S, S];
  readonly high: readonly [S, S];
  readonly ends: S;
  readonly top: S;
  readonly base: S;
  readonly inset: S;
}

/**
 * The coverage of a frame inside a face's outline: the outline inset by `inset`, less that
 * rectangle inset again by the widths. Widths past half the face leave the inner rectangle
 * empty, so the frame fills the inset outline; an inset past half the face leaves the
 * outline empty, so the frame covers nothing. It spends no hash.
 */
export function border<S>(a: Arithmetic<S>, p: BorderParams<S>, x: S, y: S, footprint: S): S {
  const outerLow = [a.add(p.low[0], p.inset), a.add(p.low[1], p.inset)] as const;
  const outerHigh = [
    a.max(outerLow[0], a.sub(p.high[0], p.inset)),
    a.max(outerLow[1], a.sub(p.high[1], p.inset)),
  ] as const;
  const innerLow = [a.add(outerLow[0], p.ends), a.add(outerLow[1], p.base)] as const;
  const innerHigh = [
    a.max(innerLow[0], a.sub(outerHigh[0], p.ends)),
    a.max(innerLow[1], a.sub(outerHigh[1], p.top)),
  ] as const;
  const outer = rectangle(a, { from: outerLow, to: outerHigh }, x, y, footprint);
  const inner = rectangle(a, { from: innerLow, to: innerHigh }, x, y, footprint);
  return saturate(a, a.sub(outer, inner));
}
