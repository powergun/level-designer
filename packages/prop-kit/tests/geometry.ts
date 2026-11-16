import { slabBox } from "@level-designer/level-format";
import type { Slab, SlabBox, Vec3 } from "@level-designer/level-format";

/** The dot product of two vectors. */
function dot([ax, ay, az]: Vec3, [bx, by, bz]: Vec3): number {
  return ax * bx + ay * by + az * bz;
}

/** The cross product of two vectors, scaled to length 1, or nothing when they are parallel. */
function unitCross([ax, ay, az]: Vec3, [bx, by, bz]: Vec3): Vec3 | undefined {
  const [cx, cy, cz] = [ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx];
  const length = Math.hypot(cx, cy, cz);
  return length > 1e-6 ? [cx / length, cy / length, cz / length] : undefined;
}

/** The interval that the box's corners cover along `axis`. */
function project(box: SlabBox, axis: Vec3): readonly [number, number] {
  const values = box.corners.map((corner) => dot(corner, axis));
  return [Math.min(...values), Math.max(...values)];
}

/**
 * How deep two slabs enter each other, in metres, by the separating axis test: the smallest
 * overlap of their projections over the 15 candidate axes, or 0 when one axis separates them.
 */
function penetration(a: Slab, b: Slab): number {
  const [boxA, boxB] = [slabBox(a), slabBox(b)];
  const crossed = boxA.axes.flatMap((u) => boxB.axes.map((v) => unitCross(u, v)));
  const candidates = [...boxA.axes, ...boxB.axes, ...crossed].filter((axis) => axis !== undefined);
  const overlaps = candidates.map((axis) => {
    const [minA, maxA] = project(boxA, axis);
    const [minB, maxB] = project(boxB, axis);
    return Math.min(maxA, maxB) - Math.max(minA, minB);
  });
  return Math.max(0, Math.min(...overlaps));
}

/** The deepest entry between any two of the slabs, in metres. */
export function deepestEntry(slabs: readonly Slab[]): number {
  const depths = slabs.flatMap((a, i) => slabs.slice(i + 1).map((b) => penetration(a, b)));
  return Math.max(0, ...depths);
}

/** The lowest world height any corner of the slabs reaches. */
export function lowestPoint(slabs: readonly Slab[]): number {
  return Math.min(...slabs.flatMap((slab) => slabBox(slab).corners.map((corner) => corner[1])));
}
