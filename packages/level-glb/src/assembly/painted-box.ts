import type { BoxCorners, BoxVertex } from "./box-geometry.js";
import { boxGeometry, boxVertices } from "./box-geometry.js";
import type { BoxPaint, PlacedBox, Vec3 } from "./inputs.js";
import { linearColor } from "./materials.js";
import type { PrimitiveGeometry } from "../builder/index.js";

/** The face classes a box uses: its four sides are outside faces. */
const CLASS = { outside: 0, top: 2, bottom: 3 } as const;

/** A face's frame at one vertex: the pattern coordinates, the face's size and its class. */
interface FaceFrame {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly faceClass: number;
}

/** A placed box read as its corners: the centre plus each signed half extent along its axis. */
function placedCorners(box: PlacedBox): BoxCorners {
  const [ex, ey, ez] = box.axes;
  const [hx, hy, hz] = box.halfExtents;
  const along = (at: 0 | 1 | 2, [a, b, c]: Vec3): number =>
    box.center[at] + a * ex[at] + b * ey[at] + c * ez[at];
  return {
    axes: box.axes,
    corner: ([sx, sy, sz]) => {
      const amounts: Vec3 = [sx * hx, sy * hy, sz * hz];
      return [along(0, amounts), along(1, amounts), along(2, amounts)];
    },
  };
}

/**
 * The box's frame rule at one vertex. On a side `x` runs along the face from its centre toward
 * the right of a viewer who faces it, and `y` up from the base. On the upper and the lower face
 * `x` is the box's X from the centre and `y` the box's Z from the face's low edge.
 */
function frameAt(vertex: BoxVertex, halfExtents: Vec3): FaceFrame {
  const [hx, hy, hz] = halfExtents;
  const [sx, sy, sz] = vertex.signs;
  const { axis, sign } = vertex.face;
  const up = (sy + 1) * hy;
  if (axis === 1) {
    const faceClass = sign > 0 ? CLASS.top : CLASS.bottom;
    return { x: sx * hx, y: (sz + 1) * hz, width: 2 * hx, height: 2 * hz, faceClass };
  }
  // The viewer's right is the box's Y cross the outward normal: +X on +Z, -Z on +X.
  const x = axis === 2 ? sign * sx * hx : -sign * sz * hz;
  const width = axis === 2 ? 2 * hx : 2 * hz;
  return { x, y: up, width, height: 2 * hy, faceClass: CLASS.outside };
}

/**
 * A painted box's mesh in level coordinates from its corners and its half extents along its
 * own axes: the 24 vertices and 12 triangles, the linear tint on every vertex, and per vertex
 * its face's frame and the box's number, seed and wear.
 */
export function paintedGeometry(
  corners: BoxCorners,
  halfExtents: Vec3,
  color: string,
  paint: BoxPaint,
): PrimitiveGeometry {
  const frames = boxVertices(corners).map((vertex) => frameAt(vertex, halfExtents));
  const tint = linearColor(color);
  return {
    ...boxGeometry(corners),
    colors: new Float32Array(frames.flatMap(() => [...tint])),
    paint: {
      pattern: new Float32Array(frames.flatMap((frame) => [frame.x, frame.y])),
      faceSize: new Float32Array(frames.flatMap((frame) => [frame.width, frame.height])),
      slab: new Float32Array(
        frames.flatMap((frame) => [paint.number, paint.seed, paint.wear, frame.faceClass]),
      ),
    },
  };
}

/** A placed static object's painted mesh, its corners from the centre and the half extents. */
export function paintedBoxGeometry(
  box: PlacedBox,
  color: string,
  paint: BoxPaint,
): PrimitiveGeometry {
  return paintedGeometry(placedCorners(box), box.halfExtents, color, paint);
}
