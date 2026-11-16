import type { Vec3 } from "../shape/index.js";
import type { Quaternion, Slab } from "./slab.js";

/**
 * A slab read as an oriented box in the level frame. `axes` are the slab's local +X (width),
 * +Y (height) and +Z (thickness, toward the +Z face) as world unit vectors. Corner `k` takes
 * the + side of local X when bit 0 of `k` is set, of Y for bit 1 and of Z for bit 2.
 */
export interface SlabBox {
  readonly center: Vec3;
  readonly axes: readonly [Vec3, Vec3, Vec3];
  readonly halfExtents: Vec3;
  readonly corners: readonly Vec3[];
}

/** The vector `v` turned by the unit quaternion `q`. */
function rotate(q: Quaternion, v: Vec3): Vec3 {
  const [qx, qy, qz, qw] = q;
  const [vx, vy, vz] = v;
  const tx = 2 * (qy * vz - qz * vy);
  const ty = 2 * (qz * vx - qx * vz);
  const tz = 2 * (qx * vy - qy * vx);
  return [
    vx + qw * tx + (qy * tz - qz * ty),
    vy + qw * ty + (qz * tx - qx * tz),
    vz + qw * tz + (qx * ty - qy * tx),
  ];
}

/** The point `origin + a * u + b * v + c * w` for the three axes `[u, v, w]`. */
function offset(origin: Vec3, axes: readonly [Vec3, Vec3, Vec3], amounts: Vec3): Vec3 {
  const [u, v, w] = axes;
  const [a, b, c] = amounts;
  return [
    origin[0] + a * u[0] + b * v[0] + c * w[0],
    origin[1] + a * u[1] + b * v[1] + c * w[1],
    origin[2] + a * u[2] + b * v[2] + c * w[2],
  ];
}

/** Reads a slab's stored size and pose as an oriented box with its eight world corners. */
export function slabBox(slab: Slab): SlabBox {
  const [width, height, thickness] = slab.size;
  const [hx, hy, hz] = [width / 2, height / 2, thickness / 2];
  const axes: readonly [Vec3, Vec3, Vec3] = [
    rotate(slab.rotation, [1, 0, 0]),
    rotate(slab.rotation, [0, 1, 0]),
    rotate(slab.rotation, [0, 0, 1]),
  ];
  const center = offset(slab.position, axes, [0, hy, 0]);
  const corners = Array.from({ length: 8 }, (_, k) =>
    offset(center, axes, [k & 1 ? hx : -hx, k & 2 ? hy : -hy, k & 4 ? hz : -hz]),
  );
  return { center, axes, halfExtents: [hx, hy, hz], corners };
}
