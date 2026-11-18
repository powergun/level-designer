import type { Arithmetic } from "../arithmetic/index.js";
import { bands } from "./bands.js";
import { footprintFade } from "./fade.js";

/**
 * The parameters of `cells`: the pitch `[across, up]` in metres, a cell plus its gap; the
 * gap; a row's shift as a share of the pitch across; and the share of cells covered whole.
 */
export interface CellsParams<S> {
  readonly pitch: readonly [S, S];
  readonly gap: S;
  readonly shift: S;
  readonly share: S;
}

/** What `cells` returns: its coverage, the gaps alone, and the cell's tone in 0 to 1. */
export interface CellsCoverage<S> {
  readonly coverage: S;
  readonly gaps: S;
  readonly tone: S;
}

/**
 * A grid of cells whose gaps are centred on multiples of the pitch, each row shifted by
 * `shift` of the pitch across. The gaps are box-filtered; the tone is one seeded hash per
 * cell, faded to 0.5 by the shorter pitch. Cells whose tone lies below `share` are covered
 * whole, faded to `share`. It spends one hash.
 */
export function cells<S>(
  a: Arithmetic<S>,
  p: CellsParams<S>,
  x: S,
  y: S,
  seed: S,
  footprint: S,
): CellsCoverage<S> {
  const [pitchX, pitchY] = p.pitch;
  const zero = a.constant(0);
  const one = a.constant(1);
  const row = a.floor(a.div(y, pitchY));
  const shifted = a.sub(x, a.mul(row, a.mul(p.shift, pitchX)));
  const gap = { width: p.gap, phase: zero, offset: zero, ramp: zero };
  const gapX = bands(a, { ...gap, period: pitchX }, shifted, footprint);
  const gapY = bands(a, { ...gap, period: pitchY }, y, footprint);
  const gaps = a.sub(one, a.mul(a.sub(one, gapX), a.sub(one, gapY)));
  const raw = a.hash(a.floor(a.div(shifted, pitchX)), row, seed);
  const fade = footprintFade(a, a.min(pitchX, pitchY), footprint);
  const chosen = a.mix(p.share, a.sub(one, a.step(p.share, raw)), fade);
  return {
    coverage: a.add(gaps, a.mul(a.sub(one, gaps), chosen)),
    gaps,
    tone: a.mix(a.constant(0.5), raw, fade),
  };
}
