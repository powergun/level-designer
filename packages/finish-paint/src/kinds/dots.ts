import type { Arithmetic } from "../arithmetic/index.js";
import { footprintFade, saturate } from "./fade.js";

/** The parameters of `dots`: pairs `[across, up]` in metres, except `phase`, a share. */
export interface DotsParams<S> {
  readonly pitch: readonly [S, S];
  readonly radius: S;
  readonly phase: readonly [S, S];
  readonly offset: readonly [S, S];
}

/** The signed distance along one axis from `t` to the nearest lattice centre. */
function toNearest<S>(a: Arithmetic<S>, t: S, pitch: S, phase: S, offset: S): S {
  const half = a.constant(0.5);
  const centre = a.add(a.mul(phase, pitch), offset);
  const cycles = a.div(a.sub(t, centre), pitch);
  return a.mul(a.sub(a.fract(a.add(cycles, half)), half), pitch);
}

/**
 * The coverage of discs on a lattice. A disc's edge ramps linearly over one footprint, and
 * the pattern fades to the discs' share of the lattice by its shorter pitch.
 */
export function dots<S>(a: Arithmetic<S>, p: DotsParams<S>, x: S, y: S, footprint: S): S {
  const [pitchX, pitchY] = p.pitch;
  const dx = toNearest(a, x, pitchX, p.phase[0], p.offset[0]);
  const dy = toNearest(a, y, pitchY, p.phase[1], p.offset[1]);
  const distance = a.sqrt(a.add(a.mul(dx, dx), a.mul(dy, dy)));
  const ratio = a.div(a.sub(p.radius, distance), footprint);
  const edge = saturate(a, a.add(ratio, a.constant(0.5)));
  const area = a.mul(a.constant(Math.PI), a.mul(p.radius, p.radius));
  // Discs wider than the lattice overlap; their share of it is then at most the whole.
  const share = saturate(a, a.div(area, a.mul(pitchX, pitchY)));
  return a.mix(share, edge, footprintFade(a, a.min(pitchX, pitchY), footprint));
}
