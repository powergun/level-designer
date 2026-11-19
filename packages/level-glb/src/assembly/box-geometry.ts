import type { Vec3 } from "./inputs.js";
import type { PrimitiveGeometry } from "../builder/index.js";

/** The corners of a face in its (u, v) plane, counter-clockwise seen from +axis. */
const QUAD: readonly (readonly [number, number])[] = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
];

/** One face of a box: on the + (sign 1) or - (sign -1) side of the box's own axis 0, 1 or 2. */
interface BoxFace {
  readonly axis: 0 | 1 | 2;
  readonly sign: 1 | -1;
}

/** One vertex of a box: its face, its corner's sign along each box axis, and its position. */
export interface BoxVertex {
  readonly face: BoxFace;
  readonly signs: Vec3;
  readonly position: Vec3;
}

/**
 * A box as the mesher reads it: its three unit axes and the position of the corner on the
 * given side (each sign -1 or 1) of each axis.
 */
export interface BoxCorners {
  readonly axes: readonly [Vec3, Vec3, Vec3];
  readonly corner: (signs: Vec3) => Vec3;
}

/** The six faces in mesh order: axis 0, 1, 2, each on its - side, then its + side. */
const FACES: readonly BoxFace[] = ([0, 1, 2] as const).flatMap((axis) =>
  ([-1, 1] as const).map((sign) => ({ axis, sign })),
);

/** The signs of a face's four corners, wound counter-clockwise seen from outside the box. */
function faceSigns(face: BoxFace): readonly Vec3[] {
  const { axis, sign } = face;
  // (u, v, axis) is cyclic, so u x v points along +axis.
  const u = (axis + 1) % 3;
  const v = (axis + 2) % 3;
  const corners = sign > 0 ? QUAD : QUAD.toReversed();
  return corners.map(([cu, cv]) => {
    const signs = [0, 0, 0];
    signs[axis] = sign;
    signs[u] = cu === 0 ? -1 : 1;
    signs[v] = cv === 0 ? -1 : 1;
    return [signs[0] ?? 0, signs[1] ?? 0, signs[2] ?? 0];
  });
}

/** The 24 vertices of a box, four per face in face order. */
export function boxVertices(box: BoxCorners): readonly BoxVertex[] {
  return FACES.flatMap((face) =>
    faceSigns(face).map((signs) => ({ face, signs, position: box.corner(signs) })),
  );
}

/** A face's outward unit normal; `+ 0` writes a zero component as +0, never -0. */
function faceNormal(box: BoxCorners, face: BoxFace): Vec3 {
  const [x, y, z] = box.axes[face.axis];
  return [x * face.sign + 0, y * face.sign + 0, z * face.sign + 0];
}

/**
 * A box's mesh: 24 vertices, four per face with the face's outward unit normal, and 12
 * triangles wound counter-clockwise seen from outside.
 */
export function boxGeometry(box: BoxCorners): PrimitiveGeometry {
  const vertices = boxVertices(box);
  const indices = FACES.flatMap((_, at) => {
    const first = at * 4;
    return [first, first + 1, first + 2, first, first + 2, first + 3];
  });
  return {
    positions: new Float32Array(vertices.flatMap((vertex) => [...vertex.position])),
    normals: new Float32Array(vertices.flatMap((vertex) => [...faceNormal(box, vertex.face)])),
    indices: new Uint32Array(indices),
  };
}
