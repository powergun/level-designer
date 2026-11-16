import type { Quaternion, Slab, Vec3 } from "@level-designer/level-format";

/** Where a prop stands: the plan position `[x, z]` of its origin, its yaw in degrees and the floor height under it. */
export interface Site {
  readonly at: readonly [number, number];
  readonly yaw: number;
  readonly floor: number;
}

/** The Hamilton product `a * b` of two quaternions `[x, y, z, w]`. */
function multiply(a: Quaternion, b: Quaternion): Quaternion {
  const [ax, ay, az, aw] = a;
  const [bx, by, bz, bw] = b;
  return [
    aw * bx + ax * bw + ay * bz - az * by,
    aw * by - ax * bz + ay * bw + az * bx,
    aw * bz + ax * by - ay * bx + az * bw,
    aw * bw - ax * bx - ay * by - az * bz,
  ];
}

/**
 * A slab of the prop frame placed in the level frame: its base centre turned by the yaw about
 * +Y and moved onto the floor under `at`, and its rotation preceded by the yaw.
 */
export function placeSlab(slab: Slab, site: Site): Slab {
  const angle = (site.yaw * Math.PI) / 180;
  const [cos, sin] = [Math.cos(angle), Math.sin(angle)];
  const [x, y, z] = slab.position;
  const position: Vec3 = [
    site.at[0] + x * cos + z * sin,
    site.floor + y,
    site.at[1] - x * sin + z * cos,
  ];
  const yaw: Quaternion = [0, Math.sin(angle / 2), 0, Math.cos(angle / 2)];
  return { ...slab, position, rotation: multiply(yaw, slab.rotation) };
}
