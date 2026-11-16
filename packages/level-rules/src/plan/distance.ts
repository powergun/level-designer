import type { PlanPoint, PlanRect, Polygon } from "./polygon.js";
import { rectPolygon } from "./polygon.js";

/** The plan distance between two shapes, the nearest point of the first and of the second. */
export interface PlanGap {
  readonly distance: number;
  readonly start: PlanPoint;
  readonly nearest: PlanPoint;
}

/** The lowest and highest projection of a polygon onto an axis. */
function project(polygon: Polygon, axis: PlanPoint): readonly [number, number] {
  let low = Infinity;
  let high = -Infinity;
  for (const p of polygon) {
    const d = p[0] * axis[0] + p[1] * axis[1];
    low = Math.min(low, d);
    high = Math.max(high, d);
  }
  return [low, high];
}

/** The edge normals of a polygon, unnormalized; a degenerate edge gives a zero axis. */
function normals(polygon: Polygon): PlanPoint[] {
  return polygon.map((p, i) => {
    const q = polygon[(i + 1) % polygon.length]!;
    return [q[1] - p[1], p[0] - q[0]];
  });
}

/**
 * True when some edge normal separates the two convex polygons. With `touching` true, shapes
 * that only touch count as separated, so only an overlap of positive area joins them.
 */
function separated(a: Polygon, b: Polygon, touching: boolean): boolean {
  return [...normals(a), ...normals(b)].some((axis) => {
    const [lowA, highA] = project(a, axis);
    const [lowB, highB] = project(b, axis);
    return touching ? highA <= lowB || highB <= lowA : highA < lowB || highB < lowA;
  });
}

/**
 * True when two convex polygons overlap by more than `depth` along every edge normal of
 * both, so shapes that only touch, or meet within `depth`, do not overlap.
 */
export function overlapsBeyond(a: Polygon, b: Polygon, depth: number): boolean {
  return [...normals(a), ...normals(b)].every((axis) => {
    const length = Math.hypot(axis[0], axis[1]);
    if (length === 0) {
      return true;
    }
    const unit: PlanPoint = [axis[0] / length, axis[1] / length];
    const [lowA, highA] = project(a, unit);
    const [lowB, highB] = project(b, unit);
    return Math.min(highA, highB) - Math.max(lowA, lowB) > depth;
  });
}

/** True when the polygon and the rectangle share an area of positive size. */
export function overlapsRect(polygon: Polygon, rect: PlanRect): boolean {
  return !separated(polygon, rectPolygon(rect), true);
}

/** The point of segment `p -> q` nearest to `o`. */
function nearestOnSegment(o: PlanPoint, p: PlanPoint, q: PlanPoint): PlanPoint {
  const dx = q[0] - p[0];
  const dz = q[1] - p[1];
  const length2 = dx * dx + dz * dz;
  const t = length2 === 0 ? 0 : ((o[0] - p[0]) * dx + (o[1] - p[1]) * dz) / length2;
  const s = Math.min(1, Math.max(0, t));
  return [p[0] + s * dx, p[1] + s * dz];
}

/** The nearest pair of a vertex and an edge point: the vertex, the edge point, their distance. */
interface VertexPair {
  readonly vertex: PlanPoint;
  readonly onEdge: PlanPoint;
  readonly distance: number;
}

/** The nearest pair of a vertex of `vertices` and a point on an edge of `edges`. */
function nearestPair(vertices: Polygon, edges: Polygon): VertexPair {
  let best: VertexPair = { vertex: vertices[0]!, onEdge: edges[0]!, distance: Infinity };
  for (const vertex of vertices) {
    edges.forEach((p, i) => {
      const onEdge = nearestOnSegment(vertex, p, edges[(i + 1) % edges.length]!);
      const distance = Math.hypot(onEdge[0] - vertex[0], onEdge[1] - vertex[1]);
      if (distance < best.distance) {
        best = { vertex, onEdge, distance };
      }
    });
  }
  return best;
}

/**
 * The plan gap from one convex polygon to another: 0 when they touch or overlap, otherwise the
 * least distance, with the nearest points of `from` and `to`. Two disjoint convex polygons are nearest at
 * a vertex of one and an edge of the other.
 */
export function planGap(from: Polygon, to: Polygon): PlanGap {
  if (!separated(from, to, false)) {
    return { distance: 0, start: from[0]!, nearest: to[0]! };
  }
  const fromVertex = nearestPair(from, to);
  const toVertex = nearestPair(to, from);
  return fromVertex.distance <= toVertex.distance
    ? { distance: fromVertex.distance, start: fromVertex.vertex, nearest: fromVertex.onEdge }
    : { distance: toVertex.distance, start: toVertex.onEdge, nearest: toVertex.vertex };
}
