import type { Arithmetic } from "../arithmetic/index.js";
import type { PaintFace } from "../painter/index.js";

/** Three scalars along the level frame's X, Y and Z. */
export type Vec3<S> = readonly [S, S, S];

/** The interior box of the hall: its low corner and its size in metres, in level coordinates. */
export interface HallBox<S> {
  readonly low: Vec3<S>;
  readonly size: Vec3<S>;
}

/**
 * The finish format's hall frame rule, without a branch. A unit normal with a Y of 0.7 or
 * more is `top` and -0.7 or less `bottom`, painted in the level's X and Z; any other is
 * `outside`, painted in the level's Z where its X outweighs its Z, else the level's X, and the
 * level's Y. The face is the interior's along those coordinates; seed 0, wear 1.
 */
export function hallFace<S>(
  a: Arithmetic<S>,
  position: Vec3<S>,
  normal: Vec3<S>,
  interior: HallBox<S>,
): PaintFace<S> {
  const [nx, ny, nz] = normal;
  const limit = a.constant(0.7);
  const up = a.step(limit, ny);
  const down = a.step(limit, a.sub(a.constant(0), ny));
  const flat = a.add(up, down);
  const alongZ = a.sub(a.constant(1), a.step(a.abs(nx), a.abs(nz)));
  // A wall's first coordinate is the level's X or Z; a floor or a ceiling is painted in plan.
  const across = (v: Vec3<S>): S => a.mix(a.mix(v[0], v[2], alongZ), v[0], flat);
  const upward = (v: Vec3<S>): S => a.mix(v[1], v[2], flat);
  return {
    x: across(position),
    y: upward(position),
    low: [across(interior.low), upward(interior.low)],
    size: [across(interior.size), upward(interior.size)],
    faceClass: a.add(a.mul(a.constant(2), up), a.mul(a.constant(3), down)),
    seed: a.constant(0),
    wear: a.constant(1),
  };
}
