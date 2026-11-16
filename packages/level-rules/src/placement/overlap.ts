import { formatLength } from "@level-designer/level-format";
import type { SlabBox, Vec3 } from "@level-designer/level-format";
import type { Finding } from "../finding/index.js";
import { over } from "../finding/index.js";
import type { PropFooting } from "../footing/index.js";

/** The contact two props may make, 1 mm: placement and rounding push touching slabs together. */
const CONTACT = 0.001;

/** The deepest pair of slabs of two props and its depth. */
interface Entry {
  readonly i: number;
  readonly j: number;
  readonly depth: number;
}

/** The dot product. */
function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/** The unit cross product, or null for parallel axes. */
function unitCross(a: Vec3, b: Vec3): Vec3 | null {
  const c: Vec3 = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const length = Math.hypot(...c);
  return length < 1e-9 ? null : [c[0] / length, c[1] / length, c[2] / length];
}

/** The half length of a box's projection onto a unit axis. */
function radius(box: SlabBox, axis: Vec3): number {
  return box.axes.reduce((sum, u, i) => sum + box.halfExtents[i]! * Math.abs(dot(u, axis)), 0);
}

/**
 * The least overlap of two boxes along the separating axis candidates: the six face axes and
 * the nine edge cross products. It is 0 or less when an axis separates them.
 */
function depth(a: SlabBox, b: SlabBox): number {
  const crosses = a.axes.flatMap((u) => b.axes.map((v) => unitCross(u, v)));
  const axes = [...a.axes, ...b.axes, ...crosses.filter((axis) => axis !== null)];
  const d: Vec3 = [b.center[0] - a.center[0], b.center[1] - a.center[1], b.center[2] - a.center[2]];
  return Math.min(
    ...axes.map((axis) => radius(a, axis) + radius(b, axis) - Math.abs(dot(d, axis))),
  );
}

/** The world bounds of a set of boxes, as `[min, max]`. */
function extent(boxes: readonly SlabBox[]): readonly [Vec3, Vec3] {
  const corners = boxes.flatMap((box) => box.corners);
  const axis = (k: number): number[] => corners.map((c) => c[k]!);
  return [
    [Math.min(...axis(0)), Math.min(...axis(1)), Math.min(...axis(2))],
    [Math.max(...axis(0)), Math.max(...axis(1)), Math.max(...axis(2))],
  ];
}

/** True when two world bounds overlap on every axis. */
function meet(a: readonly [Vec3, Vec3], b: readonly [Vec3, Vec3]): boolean {
  return [0, 1, 2].every((k) => a[0][k]! < b[1][k]! && b[0][k]! < a[1][k]!);
}

/** The deepest pair of slabs of two props. */
function deepest(a: PropFooting, b: PropFooting): Entry {
  let best: Entry = { i: 0, j: 0, depth: 0 };
  a.boxes.forEach((boxA, i) => {
    b.boxes.forEach((boxB, j) => {
      const d = depth(boxA, boxB);
      if (d > best.depth) {
        best = { i, j, depth: d };
      }
    });
  });
  return best;
}

/** `overlap`: no two props intersect by more than 1 mm; a finding names their deepest pair. */
export function overlap(footing: readonly PropFooting[]): Finding[] {
  const extents = footing.map((prop) => extent(prop.boxes));
  return footing.flatMap((a, ia) =>
    footing.slice(ia + 1).flatMap((b, offset): Finding[] => {
      if (!meet(extents[ia]!, extents[ia + 1 + offset]!)) {
        return [];
      }
      const pair = deepest(a, b);
      if (!over(pair.depth, CONTACT)) {
        return [];
      }
      const message = `props ${a.id} and ${b.id} intersect: slab ${pair.i} enters slab ${pair.j} by ${formatLength(pair.depth)} m`;
      return [{ rule: "overlap", subject: a.id, message }];
    }),
  );
}
