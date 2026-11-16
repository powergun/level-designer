import type { HalfSpace } from "./view.js";

/** How far a polygon corner lies outside a half-space; zero or less is inside. */
function outside(polygon: readonly number[], corner: number, plane: HalfSpace): number {
  const [nx, ny, nz] = plane.normal;
  const at = corner * 3;
  const x = polygon[at] ?? 0;
  const y = polygon[at + 1] ?? 0;
  const z = polygon[at + 2] ?? 0;
  return nx * x + ny * y + nz * z - plane.offset;
}

/** Push the point between corners a and b where their outside distances da and db meet 0. */
function pushCrossing(out: number[], polygon: readonly number[], ends: readonly number[]): void {
  const [a = 0, b = 0, da = 0, db = 0] = ends;
  const t = da / (da - db);
  for (let axis = 0; axis < 3; axis++) {
    const from = polygon[a * 3 + axis] ?? 0;
    out.push(from + ((polygon[b * 3 + axis] ?? 0) - from) * t);
  }
}

/**
 * Clip a convex polygon, flat xyz corners, to one half-space (Sutherland-Hodgman). The points
 * where its edges cross the plane are also appended to `trace` when one is given.
 */
export function clipPolygon(
  polygon: readonly number[],
  plane: HalfSpace,
  trace?: number[],
): number[] {
  const out: number[] = [];
  const corners = polygon.length / 3;
  for (let corner = 0; corner < corners; corner++) {
    const previous = (corner + corners - 1) % corners;
    const here = outside(polygon, corner, plane);
    const before = outside(polygon, previous, plane);
    if (here <= 0 !== before <= 0) {
      const crossing = out.length;
      pushCrossing(out, polygon, [previous, corner, before, here]);
      trace?.push(...out.slice(crossing));
    }
    if (here <= 0) {
      for (let axis = 0; axis < 3; axis++) out.push(polygon[corner * 3 + axis] ?? 0);
    }
  }
  return out;
}

/** Whether every corner of a polygon lies inside the half-space. */
export function insideAll(polygon: readonly number[], plane: HalfSpace): boolean {
  for (let corner = 0; corner < polygon.length / 3; corner++) {
    if (outside(polygon, corner, plane) > 0) return false;
  }
  return true;
}
