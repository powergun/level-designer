import type { Arithmetic } from "../arithmetic/index.js";
import { footprintFade } from "./fade.js";

/** A mask that turns the noise into a coverage: a soft step of `softness` at `threshold`. */
interface NoiseMask<S> {
  readonly threshold: S;
  readonly softness: S;
}

/** The parameters of `noise`: a wavelength `[across, up]` in metres, and an optional mask. */
export interface NoiseParams<S> {
  readonly wavelength: readonly [S, S];
  readonly mask?: NoiseMask<S>;
}

/**
 * Value noise in 0 to 1 from four hashed corners with the seed, faded to 0.5 by its shorter
 * wavelength; with a mask, the mask of the faded noise. It spends four hashes.
 */
export function noise<S>(
  a: Arithmetic<S>,
  p: NoiseParams<S>,
  x: S,
  y: S,
  seed: S,
  footprint: S,
): S {
  const [wavelengthX, wavelengthY] = p.wavelength;
  const u = a.div(x, wavelengthX);
  const v = a.div(y, wavelengthY);
  const cellU = a.floor(u);
  const cellV = a.floor(v);
  const smoothU = a.smoothstep(a.constant(0), a.constant(1), a.fract(u));
  const smoothV = a.smoothstep(a.constant(0), a.constant(1), a.fract(v));
  const one = a.constant(1);
  const nextU = a.add(cellU, one);
  const nextV = a.add(cellV, one);
  const low = a.mix(a.hash(cellU, cellV, seed), a.hash(nextU, cellV, seed), smoothU);
  const high = a.mix(a.hash(cellU, nextV, seed), a.hash(nextU, nextV, seed), smoothU);
  const fade = footprintFade(a, a.min(wavelengthX, wavelengthY), footprint);
  const value = a.mix(a.constant(0.5), a.mix(low, high, smoothV), fade);
  if (p.mask === undefined) {
    return value;
  }
  const half = a.mul(p.mask.softness, a.constant(0.5));
  return a.smoothstep(a.sub(p.mask.threshold, half), a.add(p.mask.threshold, half), value);
}
