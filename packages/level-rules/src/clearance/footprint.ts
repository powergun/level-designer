import { LENGTH_SLACK } from "@level-designer/level-format";
import type { PropFooting } from "../footing/index.js";
import { bounds, planGap } from "../plan/index.js";
import type { PlanGap, PlanPoint, PlanRect, Polygon } from "../plan/index.js";

/**
 * A standing prop's footprint as the clearance rules read it: the prop's id, the standing slab
 * outlines that no other outline of the prop contains, and their plan bounds. A crate's sides
 * lie inside its lid's outline, so the lid alone stands for the crate.
 */
export interface Footprint {
  readonly id: string;
  readonly parts: readonly Polygon[];
  readonly extent: PlanRect;
}

/** True when the point lies inside the counter-clockwise polygon or within the slack of it. */
function within(p: PlanPoint, polygon: Polygon): boolean {
  return polygon.every((a, i) => {
    const b = polygon[(i + 1) % polygon.length]!;
    const edge = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const side = (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
    return side >= -LENGTH_SLACK * edge;
  });
}

/** True when every vertex of `inner` lies within `outer`. */
function contains(outer: Polygon, inner: Polygon): boolean {
  return inner.every((p) => within(p, outer));
}

/** The outlines that no other outline contains; of two equal outlines the first stays. */
function outermost(outlines: readonly Polygon[]): Polygon[] {
  return outlines.filter((p, i) =>
    outlines.every((q, j) => j === i || !contains(q, p) || (contains(p, q) && i < j)),
  );
}

/** The footprints of the standing props, in description order. */
export function footprints(footing: readonly PropFooting[]): readonly Footprint[] {
  return footing
    .filter((prop) => prop.standing.length > 0)
    .map((prop) => {
      const parts = outermost(prop.standing.map((slab) => slab.outline));
      return { id: prop.id, parts, extent: bounds(parts.flat()) };
    });
}

/** The plan distance between two rectangles; 0 when they touch or overlap. */
export function rectDistance(a: PlanRect, b: PlanRect): number {
  const dx = Math.max(a.minX - b.maxX, b.minX - a.maxX, 0);
  const dz = Math.max(a.minZ - b.maxZ, b.minZ - a.maxZ, 0);
  return Math.hypot(dx, dz);
}

/** The plan gap from a footprint to a convex shape: the least gap over its parts. */
export function gapTo(footprint: Footprint, shape: Polygon): PlanGap {
  return footprint.parts
    .map((part) => planGap(part, shape))
    .reduce((best, next) => (next.distance < best.distance ? next : best));
}
