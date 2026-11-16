import type { Tile } from "./rasterize.js";
import type { Projection } from "./view.js";
import { depthTolerance } from "./view.js";

/** The share of its colour that a pixel keeps on a depth outline. */
const OUTLINE_KEEP = 0.35;

/** The key at a pixel index, or `fallback` when the index lies off the line or holds no surface. */
function keyOr(key: Float64Array, pixel: number, onLine: boolean, fallback: number): number {
  const value = onLine ? (key[pixel] ?? Infinity) : Infinity;
  return value === Infinity ? fallback : value;
}

/**
 * The nearer of the pixels `p` and `q = p + step` when the depth jumps between them: each key
 * misses the value that its own side's slope predicts for the other. A plane seen at a grazing
 * angle keeps its slope and draws no outline. `room` holds how many pixels lie on the line
 * before `p` and after `q`, capped at 1.
 */
function jumpAt(tile: Tile, projection: Projection, p: number, step: number, room: number): number {
  const { key } = tile;
  const kp = key[p] ?? Infinity;
  const kq = key[p + step] ?? Infinity;
  if (kp === Infinity || kq === Infinity) return -1;
  const before = keyOr(key, p - step, (room & 1) !== 0, kp);
  const beyond = keyOr(key, p + 2 * step, (room & 2) !== 0, kq);
  const tolerance = depthTolerance(projection, kp, kq);
  if (Math.abs(kq - (2 * kp - before)) <= tolerance) return -1;
  if (Math.abs(kp - (2 * kq - beyond)) <= tolerance) return -1;
  return kp < kq ? p : p + step;
}

/** The room flags of a pixel at `index` along a line of `length` pixels: bit 1 before, bit 2 after. */
function roomOf(index: number, length: number): number {
  return (index > 0 ? 1 : 0) | (index + 2 < length ? 2 : 0);
}

/** Mark the outlined pixels of one row: against the right and the lower neighbour. */
function markRow(tile: Tile, projection: Projection, row: number, marked: Uint8Array): void {
  const { width, height } = tile;
  for (let column = 0; column < width; column++) {
    const pixel = row * width + column;
    if (tile.key[pixel] === Infinity) continue;
    if (column + 1 < width) {
      const right = jumpAt(tile, projection, pixel, 1, roomOf(column, width));
      if (right >= 0) marked[right] = 1;
    }
    if (row + 1 < height) {
      const below = jumpAt(tile, projection, pixel, width, roomOf(row, height));
      if (below >= 0) marked[below] = 1;
    }
  }
}

/** Darken the nearer pixel wherever the depth jumps between horizontal or vertical neighbours. */
export function drawOutlines(tile: Tile, projection: Projection): void {
  const marked = new Uint8Array(tile.width * tile.height);
  for (let row = 0; row < tile.height; row++) markRow(tile, projection, row, marked);
  const { rgb } = tile;
  for (let pixel = 0; pixel < marked.length; pixel++) {
    if (marked[pixel] === 0) continue;
    for (let at = pixel * 3; at < pixel * 3 + 3; at++) {
      rgb[at] = Math.round((rgb[at] ?? 0) * OUTLINE_KEEP);
    }
  }
}
