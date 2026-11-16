import { formatLength, LENGTH_SLACK } from "@level-designer/level-format";
import type { Finding } from "../finding/index.js";
import { point, under } from "../finding/index.js";
import { bounds, freeCrossing, planGap, rectPolygon } from "../plan/index.js";
import type { PlanRect, Polygon } from "../plan/index.js";
import type { Footprint } from "./footprint.js";
import { gapTo, rectDistance } from "./footprint.js";

/** A gap narrower than this, 0.7 m, keeps the player out: the capsule enters 0.76 m. */
const NARROW = 0.7;

/** A gap this wide, 1.5 m, lets the navmesh through; a gap between the two is a pocket. */
const WIDE = 1.5;

/** The advice every `gap` message ends with. */
const GAP_ADVICE = `keep a gap under ${formatLength(NARROW)} m or at least ${formatLength(WIDE)} m`;

/**
 * A shape that can block a crossing's lane: a part of a standing footprint or a static
 * obstacle, with its plan bounds and its owner's index, props first, then the obstacles.
 */
interface Blocker {
  readonly polygon: Polygon;
  readonly extent: PlanRect;
  readonly owner: number;
}

/** True when a measured gap is a pocket: the player enters it and the navmesh does not. */
function pocket(distance: number): boolean {
  return !under(distance, NARROW) && under(distance, WIDE);
}

/** Every shape that can block a lane: the footprints' parts, then the static obstacles. */
function blockers(standing: readonly Footprint[], obstacles: readonly PlanRect[]): Blocker[] {
  const parts = standing.flatMap((f, owner) =>
    f.parts.map((polygon) => ({ polygon, extent: bounds(polygon), owner })),
  );
  const fixed = obstacles.map((extent, k) => ({
    polygon: rectPolygon(extent),
    extent,
    owner: standing.length + k,
  }));
  return [...parts, ...fixed];
}

/** The bounds of two polygons together, grown by half a lane on every side. */
function laneReach(p: Polygon, q: Polygon): PlanRect {
  const box = bounds([...p, ...q]);
  const half = NARROW / 2 + LENGTH_SLACK;
  return {
    minX: box.minX - half,
    minZ: box.minZ - half,
    maxX: box.maxX + half,
    maxZ: box.maxZ + half,
  };
}

/**
 * The length and the end on the second footprint of the shortest crossing with a free lane
 * between two footprints' parts, or null. A lane runs from a point of one part to a point of
 * the other, so only a shape within half a lane of the two parts' bounds can block it; the
 * shapes of the pair's own two owners never do.
 */
function shortestFree(
  a: readonly Polygon[],
  b: readonly Polygon[],
  scene: readonly Blocker[],
  owners: readonly [number, number],
): { readonly length: number; readonly end: readonly [number, number] } | null {
  let best: { readonly length: number; readonly end: readonly [number, number] } | null = null;
  for (const p of a) {
    for (const q of b.filter((part) => under(planGap(p, part).distance, WIDE))) {
      const reach = laneReach(p, q);
      const others = scene
        .filter((s) => s.owner !== owners[0] && s.owner !== owners[1])
        .filter((s) => rectDistance(s.extent, reach) === 0)
        .map((s) => s.polygon);
      const found = freeCrossing(p, q, others, NARROW, { min: NARROW, max: WIDE });
      if (found !== null && (best === null || found.length < best.length)) {
        best = { length: found.length, end: found.onSecond };
      }
    }
  }
  return best;
}

/** The `gap` findings of the prop at index `i` against the later props. */
function propGaps(i: number, standing: readonly Footprint[], scene: readonly Blocker[]): Finding[] {
  const a = standing[i]!;
  return standing.slice(i + 1).flatMap((b, offset): Finding[] => {
    if (!under(rectDistance(a.extent, b.extent), WIDE)) {
      return [];
    }
    const distance = Math.min(...b.parts.map((part) => gapTo(a, part).distance));
    const free = pocket(distance)
      ? shortestFree(a.parts, b.parts, scene, [i, i + 1 + offset])
      : null;
    if (free === null) {
      return [];
    }
    const message = `props ${a.id} and ${b.id} stand ${formatLength(free.length)} m apart; ${GAP_ADVICE}`;
    return [{ rule: "gap", subject: a.id, message }];
  });
}

/** The `gap` findings of the prop at index `i` against the static standing obstacles. */
function obstacleGaps(
  i: number,
  standing: readonly Footprint[],
  obstacles: readonly PlanRect[],
  scene: readonly Blocker[],
): Finding[] {
  const a = standing[i]!;
  return obstacles.flatMap((rect, k): Finding[] => {
    if (!under(rectDistance(a.extent, rect), WIDE)) {
      return [];
    }
    const box = rectPolygon(rect);
    const owners = [i, standing.length + k] as const;
    const free = pocket(gapTo(a, box).distance)
      ? shortestFree(a.parts, [box], scene, owners)
      : null;
    if (free === null) {
      return [];
    }
    const message = `prop ${a.id} stands ${formatLength(free.length)} m from the static obstacle at ${point(free.end)}; ${GAP_ADVICE}`;
    return [{ rule: "gap", subject: a.id, message }];
  });
}

/**
 * `gap`: a pair of standing footprints, or a footprint and a static standing obstacle, that
 * stand 0.7 m or more and under 1.5 m apart fails only when a crossing between the two of
 * that length has a free lane, 0.7 m wide, that no other footprint or obstacle overlaps. Per
 * prop, its pairs with later props come first, then its static obstacles in body world order.
 */
export function gap(standing: readonly Footprint[], obstacles: readonly PlanRect[]): Finding[] {
  const scene = blockers(standing, obstacles);
  return standing.flatMap((_, i) => [
    ...propGaps(i, standing, scene),
    ...obstacleGaps(i, standing, obstacles, scene),
  ]);
}
