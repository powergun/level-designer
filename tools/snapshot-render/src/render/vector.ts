/** A point or direction in the level frame, metres: +Y up, the back wall at -Z. */
export type Vec3 = readonly [number, number, number];

/** The difference a - b. */
export function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

/** The dot product. */
export function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/** The cross product a x b. */
export function cross(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

/** The unit vector along a; a zero vector stays zero. */
export function normalize(a: Vec3): Vec3 {
  const length = Math.hypot(a[0], a[1], a[2]);
  return length === 0 ? [0, 0, 0] : [a[0] / length, a[1] / length, a[2] / length];
}

/** The three entries of `values` from index `at` as a point. */
export function pointAt(values: ArrayLike<number>, at: number): Vec3 {
  return [values[at] ?? 0, values[at + 1] ?? 0, values[at + 2] ?? 0];
}
