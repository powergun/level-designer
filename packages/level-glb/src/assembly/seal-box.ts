import type { BoxCorners } from "./box-geometry.js";
import { boxGeometry } from "./box-geometry.js";
import type { SealBox, Vec3 } from "./inputs.js";
import { paintedGeometry } from "./painted-box.js";
import type { PrimitiveGeometry } from "../builder/index.js";

/** A seal read as a box on the level's axes; each corner takes the seal's own min or max. */
function sealCorners(seal: SealBox): BoxCorners {
  const side = (sign: number): Vec3 => (sign < 0 ? seal.min : seal.max);
  return {
    axes: [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ],
    corner: ([x, y, z]) => [side(x)[0], side(y)[1], side(z)[2]],
  };
}

/**
 * A seal's box: 24 vertices, four per face with the face's outward normal, and 12 triangles
 * wound counter-clockwise seen from outside. A painted seal adds its tint and its frames by
 * the box's frame rule on the level's axes, at the seal's exact corners.
 */
export function sealGeometry(seal: SealBox): PrimitiveGeometry {
  const corners = sealCorners(seal);
  if (seal.paint === undefined) return boxGeometry(corners);
  const half = (axis: 0 | 1 | 2): number => (seal.max[axis] - seal.min[axis]) / 2;
  return paintedGeometry(corners, [half(0), half(1), half(2)], seal.color, seal.paint);
}
