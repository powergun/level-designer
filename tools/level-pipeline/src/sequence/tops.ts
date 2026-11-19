import { LENGTH_SLACK, slabBox } from "@level-designer/level-format";
import type { Slab, SlabBox } from "@level-designer/level-format";

/** The top a litter lies on: the slab's index in its prop and the height of its upper face. */
export interface Top {
  readonly slab: number;
  readonly height: number;
}

/** The corners per face of a box. */
const FACE_CORNERS = 4;

/**
 * The height of the slab's level upper face, or `undefined` for a slab without one: its four
 * highest corners lie within the format's slack of the highest.
 */
function levelTop(box: SlabBox): number | undefined {
  const heights = box.corners.map((corner) => corner[1]).toSorted((a, b) => b - a);
  const highest = heights[0] ?? 0;
  const lowestOfFace = heights[FACE_CORNERS - 1] ?? highest;
  return highest - lowestOfFace <= LENGTH_SLACK ? highest : undefined;
}

/**
 * Whether the plan point lies over the box's level upper face, with the format's slack: its
 * offset from the centre, along each of the two axes that lie flat, stays within that half
 * extent. The upright axis is the one with the largest height component.
 */
function holds(box: SlabBox, [x, z]: readonly [number, number]): boolean {
  const dx = x - box.center[0];
  const dz = z - box.center[2];
  const rise = box.axes.map((axis) => Math.abs(axis[1]));
  const upright = rise.indexOf(Math.max(...rise));
  return box.axes.every((axis, k) => {
    if (k === upright) return true;
    const along = dx * axis[0] + dz * axis[2];
    return Math.abs(along) <= (box.halfExtents[k] ?? 0) + LENGTH_SLACK;
  });
}

/**
 * The highest level top of a prop's rounded slabs whose plan outline holds `at`, or
 * `undefined`. A top replaces the one held only when it stands higher by more than the slack,
 * so a tie keeps the first in slab order.
 */
export function topUnder(slabs: readonly Slab[], at: readonly [number, number]): Top | undefined {
  let found: Top | undefined;
  slabs.forEach((slab, index) => {
    const box = slabBox(slab);
    const height = levelTop(box);
    if (height === undefined || !holds(box, at)) return;
    if (found === undefined || height > found.height + LENGTH_SLACK)
      found = { slab: index, height };
  });
  return found;
}
