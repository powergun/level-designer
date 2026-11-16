import type { SlabBox } from "@level-designer/level-format";

/** A plan point `[x, z]`. */
export type PlanPoint = readonly [number, number];

/**
 * A convex plan polygon, its vertices counter-clockwise in the (x, z) plane: its shoelace area
 * is positive, and each edge's outward normal is the edge direction turned clockwise.
 */
export type Polygon = readonly PlanPoint[];

/** An axis-aligned plan rectangle. */
export interface PlanRect {
  readonly minX: number;
  readonly minZ: number;
  readonly maxX: number;
  readonly maxZ: number;
}

/** The z component of the cross product of `o -> a` and `o -> b`. */
function cross(o: PlanPoint, a: PlanPoint, b: PlanPoint): number {
  return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
}

/** One chain of the monotone hull over sorted points: it keeps only left turns. */
function chain(points: readonly PlanPoint[]): PlanPoint[] {
  const kept: PlanPoint[] = [];
  for (const p of points) {
    while (kept.length >= 2 && cross(kept.at(-2)!, kept.at(-1)!, p) <= 0) {
      kept.pop();
    }
    kept.push(p);
  }
  kept.pop();
  return kept;
}

/**
 * Points closer than this, 0.001 mm, are one vertex of an outline. An upright slab's top and
 * bottom corners differ in plan only by the rounding of its rotation, which would otherwise
 * leave edges of no length whose direction is noise.
 */
const SAME_POINT = 1e-6;

/** The convex hull of plan points, by the monotone chain, one vertex per cluster of points. */
function hull(points: readonly PlanPoint[]): Polygon {
  const distinct = points.filter((p, i) =>
    points.slice(0, i).every((q) => Math.hypot(p[0] - q[0], p[1] - q[1]) > SAME_POINT),
  );
  const sorted = distinct.toSorted((a, b) => a[0] - b[0] || a[1] - b[1]);
  return [...chain(sorted), ...chain(sorted.toReversed())];
}

/** A slab's plan outline: the outline of its box seen from above. */
export function outline(box: SlabBox): Polygon {
  return hull(box.corners.map((c): PlanPoint => [c[0], c[2]]));
}

/** The rectangle as a polygon, counter-clockwise like an outline. */
export function rectPolygon(rect: PlanRect): Polygon {
  return [
    [rect.minX, rect.minZ],
    [rect.maxX, rect.minZ],
    [rect.maxX, rect.maxZ],
    [rect.minX, rect.maxZ],
  ];
}

/** The smallest axis-aligned rectangle around a polygon. */
export function bounds(polygon: Polygon): PlanRect {
  const xs = polygon.map((p) => p[0]);
  const zs = polygon.map((p) => p[1]);
  return {
    minX: Math.min(...xs),
    minZ: Math.min(...zs),
    maxX: Math.max(...xs),
    maxZ: Math.max(...zs),
  };
}
