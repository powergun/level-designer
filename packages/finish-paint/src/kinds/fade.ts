import type { Arithmetic } from "../arithmetic/index.js";

/**
 * The weight that removes a feature as the footprint grows from 0.22 to 0.5 of its
 * wavelength, after Wall Lab's `lodFade`: 1 below, 0 beyond.
 */
export function footprintFade<S>(a: Arithmetic<S>, wavelength: S, footprint: S): S {
  const ramp = a.smoothstep(a.constant(0.22), a.constant(0.5), a.div(footprint, wavelength));
  return a.sub(a.constant(1), ramp);
}

/** Clamps a coverage to 0 to 1, against the bits a box filter's difference loses. */
export function saturate<S>(a: Arithmetic<S>, value: S): S {
  return a.min(a.max(value, a.constant(0)), a.constant(1));
}
