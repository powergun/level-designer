import { LENGTH_SLACK } from "@level-designer/level-format";
import { overlapsBeyond, planGap } from "./distance.js";
import type { PlanPoint, Polygon } from "./polygon.js";

/** The lengths a crossing must have to count: from `min` to under `max`, each with the slack. */
export interface CrossingRange {
  readonly min: number;
  readonly max: number;
}

/** A crossing with a free lane: its length and its end points on the first and second outline. */
export interface FreeCrossing {
  readonly length: number;
  readonly onFirst: PlanPoint;
  readonly onSecond: PlanPoint;
}

/**
 * A family of parallel crossings: from the points `s0 -> s1` on one outline, each along the
 * unit vector `toward` to the other outline, with lengths running linearly from `l0` to `l1`.
 * A single crossing has `s0` equal to `s1`. `fromSecond` tells which outline the starts lie on.
 */
interface Family {
  readonly s0: PlanPoint;
  readonly s1: PlanPoint;
  readonly toward: PlanPoint;
  readonly l0: number;
  readonly l1: number;
  readonly fromSecond: boolean;
}

/** Edges shorter than this, 1 nm, have no direction and give no crossing. */
const NO_LENGTH = 1e-9;

/** `a - b`. */
function minus(a: PlanPoint, b: PlanPoint): PlanPoint {
  return [a[0] - b[0], a[1] - b[1]];
}

/** `a + k * b`. */
function along(a: PlanPoint, b: PlanPoint, k: number): PlanPoint {
  return [a[0] + k * b[0], a[1] + k * b[1]];
}

/** The dot product. */
function dot(a: PlanPoint, b: PlanPoint): number {
  return a[0] * b[0] + a[1] * b[1];
}

/** The z component of the cross product. */
function cross(a: PlanPoint, b: PlanPoint): number {
  return a[0] * b[1] - a[1] * b[0];
}

/** Narrows the parameter range `[t0, t1]` of a segment to where the linear `f` is not negative. */
function keep(range: readonly [number, number], f0: number, f1: number): [number, number] {
  const [t0, t1] = range;
  if (f0 < 0 && f1 < 0) {
    return [1, 0];
  }
  if (f0 < 0) {
    return [Math.max(t0, f0 / (f0 - f1)), t1];
  }
  return f1 < 0 ? [t0, Math.min(t1, f0 / (f0 - f1))] : [t0, t1];
}

/**
 * The crossings from the edge `p0 -> p1` that meet the edge `q0 -> q1` of a counter-clockwise
 * outline at a right angle: the stretch of `p` outside that edge whose points project onto it.
 */
function drop(
  p: readonly [PlanPoint, PlanPoint],
  q: readonly [PlanPoint, PlanPoint],
  fromSecond: boolean,
): Family | null {
  const edge = minus(q[1], q[0]);
  const size = Math.hypot(edge[0], edge[1]);
  if (size < NO_LENGTH) {
    return null;
  }
  const u: PlanPoint = [edge[0] / size, edge[1] / size];
  const n: PlanPoint = [u[1], -u[0]];
  const out = (x: PlanPoint): number => dot(minus(x, q[0]), n);
  const on = (x: PlanPoint): number => dot(minus(x, q[0]), u);
  let range = keep([0, 1], out(p[0]), out(p[1]));
  range = keep(range, on(p[0]), on(p[1]));
  range = keep(range, size - on(p[0]), size - on(p[1]));
  if (range[1] < range[0]) {
    return null;
  }
  const d = minus(p[1], p[0]);
  const s0 = along(p[0], d, range[0]);
  const s1 = along(p[0], d, range[1]);
  return { s0, s1, toward: [-n[0], -n[1]], l0: out(s0), l1: out(s1), fromSecond };
}

/** The edges of a polygon as point pairs. */
function edges(polygon: Polygon): (readonly [PlanPoint, PlanPoint])[] {
  return polygon.map((p, i) => [p, polygon[(i + 1) % polygon.length]!] as const);
}

/** The crossings from the edges of `from` that meet an edge of `to` at a right angle. */
function drops(from: Polygon, to: Polygon, fromSecond: boolean): Family[] {
  return edges(to).flatMap((q) => edges(from).flatMap((p) => drop(p, q, fromSecond) ?? []));
}

/** Every crossing family between two convex outlines: the right-angle drops both ways and the shortest. */
function families(a: Polygon, b: Polygon): Family[] {
  const all = [...drops(a, b, false), ...drops(b, a, true)];
  const near = planGap(a, b);
  if (near.distance > 0) {
    const toward = minus(near.nearest, near.start);
    const unit: PlanPoint = [toward[0] / near.distance, toward[1] / near.distance];
    const single = {
      s0: near.start,
      s1: near.start,
      toward: unit,
      l0: near.distance,
      l1: near.distance,
    };
    all.push({ ...single, fromSecond: false });
  }
  return all;
}

/** The start, the end and the length of the family's crossing at parameter `t`. */
function crossingAt(f: Family, t: number): readonly [PlanPoint, PlanPoint, number] {
  const start = along(f.s0, minus(f.s1, f.s0), t);
  const length = f.l0 + t * (f.l1 - f.l0);
  return [start, along(start, f.toward, length), length];
}

/** The lane of a crossing: the rectangle `width` wide along it. */
function lane(f: Family, t: number, width: number): Polygon {
  const [start, end] = crossingAt(f, t);
  const side: PlanPoint = [(-f.toward[1] * width) / 2, (f.toward[0] * width) / 2];
  const back: PlanPoint = [-side[0], -side[1]];
  return [along(start, back, 1), along(start, side, 1), along(end, side, 1), along(end, back, 1)];
}

/**
 * The parameters where a lane's overlap with a polygon can change: where a lane side passes a
 * vertex of the polygon, or a point where a polygon edge crosses the line of the starts or of
 * the ends.
 */
function events(f: Family, polygon: Polygon, width: number): number[] {
  const span = minus(f.s1, f.s0);
  const side: PlanPoint = [-f.toward[1], f.toward[0]];
  const lateral = dot(span, side);
  if (Math.abs(lateral) < NO_LENGTH) {
    return [];
  }
  const passes = (x: PlanPoint): number[] => {
    const offset = dot(minus(x, f.s0), side);
    return [(offset - width / 2) / lateral, (offset + width / 2) / lateral];
  };
  const e0 = along(f.s0, f.toward, f.l0);
  const lines = [
    [f.s0, span],
    [e0, minus(along(f.s1, f.toward, f.l1), e0)],
  ] as const;
  return edges(polygon).flatMap(([p, q]) => {
    const e = minus(q, p);
    const meets = lines.flatMap(([origin, direction]) => {
      const c = cross(direction, e);
      const k = Math.abs(c) < NO_LENGTH ? -1 : cross(direction, minus(p, origin)) / -c;
      return k >= 0 && k <= 1 ? passes(along(p, e, k)) : [];
    });
    return [...passes(p), ...meets];
  });
}

/** The parameters a family is probed at: its ends, its events, the length limits and the midpoints. */
function probes(
  f: Family,
  others: readonly Polygon[],
  width: number,
  range: CrossingRange,
): number[] {
  const marks = [0, 1, ...others.flatMap((polygon) => events(f, polygon, width))];
  if (f.l0 !== f.l1) {
    marks.push(
      ...[range.min, range.max].map((limit) => (limit - LENGTH_SLACK - f.l0) / (f.l1 - f.l0)),
    );
  }
  const sorted = [...new Set(marks.filter((t) => t >= 0 && t <= 1))].toSorted((x, y) => x - y);
  return sorted.flatMap((t, i) => (i === 0 ? [t] : [(sorted[i - 1]! + t) / 2, t]));
}

/**
 * The shortest crossing between two convex outlines whose length lies in the range and whose
 * lane, `width` wide, overlaps none of the other polygons by more than the slack; or null. The
 * lane's state changes only at the probed parameters, so between them it holds.
 */
export function freeCrossing(
  a: Polygon,
  b: Polygon,
  others: readonly Polygon[],
  width: number,
  range: CrossingRange,
): FreeCrossing | null {
  let best: FreeCrossing | null = null;
  for (const f of families(a, b)) {
    for (const t of probes(f, others, width, range)) {
      const [start, end, length] = crossingAt(f, t);
      const counts = length >= range.min - LENGTH_SLACK && length < range.max - LENGTH_SLACK;
      if (!counts || (best !== null && length >= best.length)) {
        continue;
      }
      const strip = lane(f, t, width);
      if (others.every((polygon) => !overlapsBeyond(strip, polygon, LENGTH_SLACK))) {
        best = f.fromSecond
          ? { length, onFirst: end, onSecond: start }
          : { length, onFirst: start, onSecond: end };
      }
    }
  }
  return best;
}
