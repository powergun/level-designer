import type { SealBox, Vec3 } from "./inputs.js";
import type { PrimitiveGeometry } from "./scene-builder.js";

/** The corners of a face in its (u, v) plane, counter-clockwise seen from +axis. */
const QUAD: readonly (readonly [number, number])[] = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
];

/** One face of the box on the `max` (sign 1) or `min` (sign -1) side of an axis. */
interface Face {
  readonly axis: number;
  readonly sign: 1 | -1;
}

/** The four corners of a face, wound counter-clockwise seen from outside the box. */
function faceCorners(seal: SealBox, face: Face): readonly Vec3[] {
  const { axis, sign } = face;
  // (u, v, axis) is cyclic, so u x v points along +axis.
  const u = (axis + 1) % 3;
  const v = (axis + 2) % 3;
  const plane = (sign > 0 ? seal.max : seal.min)[axis] ?? 0;
  const corners = sign > 0 ? QUAD : QUAD.toReversed();
  return corners.map(([cu, cv]) => {
    const point = [0, 0, 0];
    point[axis] = plane;
    point[u] = (cu === 0 ? seal.min : seal.max)[u] ?? 0;
    point[v] = (cv === 0 ? seal.min : seal.max)[v] ?? 0;
    return [point[0] ?? 0, point[1] ?? 0, point[2] ?? 0];
  });
}

/**
 * A seal's box: 24 vertices, four per face with the face's outward normal, and 12 triangles
 * wound counter-clockwise seen from outside.
 */
export function sealGeometry(seal: SealBox): PrimitiveGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  for (const axis of [0, 1, 2]) {
    for (const sign of [-1, 1] as const) {
      const first = positions.length / 3;
      const normal = [0, 0, 0].map((_, at) => (at === axis ? sign : 0));
      for (const corner of faceCorners(seal, { axis, sign })) {
        positions.push(...corner);
        normals.push(...normal);
      }
      indices.push(first, first + 1, first + 2, first, first + 2, first + 3);
    }
  }
  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    indices: new Uint32Array(indices),
  };
}
