import type { CoreArithmetic } from "./arithmetic.js";

/**
 * The lattice hash of one cell, in 0 to 1, after Wall Lab's `hash31`, scalar by scalar.
 * The third scalar carries the seed. Every back end builds its `hash` from this function.
 */
export function latticeHash<S>(a: CoreArithmetic<S>, x: S, y: S, z: S): S {
  const scale = a.constant(0.1031);
  const lift = a.constant(31.32);
  const px = a.fract(a.mul(x, scale));
  const py = a.fract(a.mul(y, scale));
  const pz = a.fract(a.mul(z, scale));
  const dot = a.add(
    a.add(a.mul(px, a.add(pz, lift)), a.mul(py, a.add(py, lift))),
    a.mul(pz, a.add(px, lift)),
  );
  const sum = a.add(a.add(px, dot), a.add(py, dot));
  return a.fract(a.mul(sum, a.add(pz, dot)));
}
