import type { Raster } from "../raster/index.js";

/** A tile being drawn: its picture and the depth key of the nearest surface per pixel. */
export interface Tile extends Raster {
  /** Smaller is nearer; `Infinity` where no surface was drawn. */
  readonly key: Float64Array;
}

/** One screen-space edge function e(x, y) = a x + b y + c, divided by the triangle's area. */
interface Edge {
  readonly a: number;
  readonly b: number;
  readonly c: number;
}

/** A triangle ready to fill: the weight function of each corner and the corners' depth keys. */
interface Weights {
  readonly edges: readonly [Edge, Edge, Edge];
  readonly keys: readonly [number, number, number];
}

/** Entry `index` of a corner array; the arrays this unit reads always hold it. */
function entry(values: Float64Array, index: number): number {
  return values[index] ?? 0;
}

/** The edge function of the edge from corner `from` to corner `to`, divided by `area`. */
function edgeOf(corners: Float64Array, from: number, to: number, area: number): Edge {
  const x0 = entry(corners, from * 3);
  const y0 = entry(corners, from * 3 + 1);
  const x1 = entry(corners, to * 3);
  const y1 = entry(corners, to * 3 + 1);
  return { a: (y0 - y1) / area, b: (x1 - x0) / area, c: (x0 * y1 - x1 * y0) / area };
}

/** Narrow the steps [low, high] to those where `value + slope * step` stays at or above 0. */
function narrow(range: [number, number], value: number, slope: number): void {
  if (slope > 0) range[0] = Math.max(range[0], Math.ceil(-value / slope));
  else if (slope < 0) range[1] = Math.min(range[1], Math.floor(-value / slope));
  else if (value < 0) range[1] = -1;
}

/** Keep a surface at a pixel when it is nearer than what the pixel holds. */
function keepNearer(tile: Tile, pixel: number, key: number, color: Uint8Array): void {
  if (key >= entry(tile.key, pixel)) return;
  tile.key[pixel] = key;
  const at = pixel * 3;
  tile.rgb[at] = color[0] ?? 0;
  tile.rgb[at + 1] = color[1] ?? 0;
  tile.rgb[at + 2] = color[2] ?? 0;
}

/** Fill the covered pixels of row `row` between columns `first` and `last`, depth tested. */
function fillRow(
  tile: Tile,
  weights: Weights,
  row: number,
  columns: readonly number[],
  color: Uint8Array,
): void {
  const [first = 0, last = -1] = columns;
  const { edges, keys } = weights;
  const starts = edges.map((edge) => edge.a * (first + 0.5) + edge.b * (row + 0.5) + edge.c);
  const steps: [number, number] = [0, last - first];
  edges.forEach((edge, corner) => narrow(steps, starts[corner] ?? 0, edge.a));
  const [b0 = 0, b1 = 0, b2 = 0] = starts;
  const [e0, e1, e2] = edges;
  for (let step = steps[0]; step <= steps[1]; step++) {
    const c0 = b0 + e0.a * step;
    const c1 = b1 + e1.a * step;
    const c2 = b2 + e2.a * step;
    keepNearer(
      tile,
      row * tile.width + first + step,
      c0 * keys[0] + c1 * keys[1] + c2 * keys[2],
      color,
    );
  }
}

/** The columns or rows whose pixel centres lie within [low, high], clamped to [0, size). */
function centresWithin(values: readonly number[], size: number): readonly [number, number] {
  const low = Math.min(...values);
  const high = Math.max(...values);
  return [Math.max(0, Math.ceil(low - 0.5)), Math.min(size - 1, Math.floor(high - 0.5))];
}

/**
 * Fill a screen-space triangle, three corners of x, y and depth key, with one colour. A pixel is
 * covered when its centre lies inside or on the triangle, and kept when it is nearer than
 * what the pixel holds.
 */
export function fillTriangle(tile: Tile, corners: Float64Array, color: Uint8Array): void {
  const xs = [entry(corners, 0), entry(corners, 3), entry(corners, 6)];
  const ys = [entry(corners, 1), entry(corners, 4), entry(corners, 7)];
  const [x0 = 0, x1 = 0, x2 = 0] = xs;
  const [y0 = 0, y1 = 0, y2 = 0] = ys;
  const area = (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0);
  if (area === 0 || !Number.isFinite(area)) return;
  const weights: Weights = {
    edges: [edgeOf(corners, 1, 2, area), edgeOf(corners, 2, 0, area), edgeOf(corners, 0, 1, area)],
    keys: [entry(corners, 2), entry(corners, 5), entry(corners, 8)],
  };
  const columns = centresWithin(xs, tile.width);
  const [top, bottom] = centresWithin(ys, tile.height);
  for (let row = top; row <= bottom; row++) fillRow(tile, weights, row, columns, color);
}
