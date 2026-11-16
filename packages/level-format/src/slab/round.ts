import type { Vec3 } from "../shape/index.js";
import type { Quaternion, Slab } from "./slab.js";

/** Grid steps per metre: lengths lie on a 0.1 mm grid. */
const LENGTH_STEPS = 10_000;

/** Grid steps per unit: quaternion components lie on nine decimals. */
const QUATERNION_STEPS = 1_000_000_000;

/** Significant digits kept of a scaled value, so a typed decimal half step reads as a half. */
const SCALED_DIGITS = 15;

/**
 * `value` on a grid of `steps` per unit. A half step rounds away from zero, and the result
 * is never a negative zero.
 */
function toGrid(value: number, steps: number): number {
  const scaled = Number((Math.abs(value) * steps).toPrecision(SCALED_DIGITS));
  const rounded = (Math.sign(value) * Math.round(scaled)) / steps;
  return rounded === 0 ? 0 : rounded;
}

/** A length triple on the 0.1 mm grid. */
function lengthsToGrid([x, y, z]: Vec3): Vec3 {
  return [toGrid(x, LENGTH_STEPS), toGrid(y, LENGTH_STEPS), toGrid(z, LENGTH_STEPS)];
}

/**
 * The slab on the format's grid: every length of its size and position at 0.1 mm, every
 * rotation component at nine decimals, the other fields unchanged. Rounding twice equals
 * rounding once.
 */
export function roundSlab(slab: Slab): Slab {
  const [x, y, z, w] = slab.rotation;
  const rotation: Quaternion = [
    toGrid(x, QUATERNION_STEPS),
    toGrid(y, QUATERNION_STEPS),
    toGrid(z, QUATERNION_STEPS),
    toGrid(w, QUATERNION_STEPS),
  ];
  return {
    ...slab,
    size: lengthsToGrid(slab.size),
    position: lengthsToGrid(slab.position),
    rotation,
  };
}
