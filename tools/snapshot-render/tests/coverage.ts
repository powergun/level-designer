import type { Pixels } from "./png-pixels.js";
import { pixelAt } from "./png-pixels.js";

/** A rectangle of pixels, its right and bottom edges excluded. */
export interface PixelRect {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

/** Whether a pixel shows the loud magenta background. */
export function isBackground(pixels: Pixels, x: number, y: number): boolean {
  const [r, g, b] = pixelAt(pixels, x, y);
  return r === 255 && g === 0 && b === 255;
}

/** The rectangle moved by a tile's origin on its sheet and grown by `grow` pixels per side. */
function onSheet(origin: readonly [number, number], rect: PixelRect, grow: number): PixelRect {
  return {
    left: origin[0] + rect.left - grow,
    top: origin[1] + rect.top - grow,
    right: origin[0] + rect.right + grow,
    bottom: origin[1] + rect.bottom + grow,
  };
}

/** Whether a pixel lies inside a rectangle. */
function inside(rect: PixelRect, x: number, y: number): boolean {
  return x >= rect.left && x < rect.right && y >= rect.top && y < rect.bottom;
}

/**
 * The pixels that break the coverage of a tile rectangle within one pixel: inside the
 * rectangle shrunk by one pixel every pixel shows a surface; in a three-pixel ring outside the
 * rectangle grown by one pixel every pixel shows the background. Returns the misses as `x,y`.
 */
export function coverageMisses(
  pixels: Pixels,
  origin: readonly [number, number],
  rect: PixelRect,
): readonly string[] {
  const core = onSheet(origin, rect, -1);
  const free = onSheet(origin, rect, 1);
  const ring = onSheet(origin, rect, 4);
  const misses: string[] = [];
  for (let y = ring.top; y < ring.bottom; y++) {
    for (let x = ring.left; x < ring.right; x++) {
      const wrong = inside(core, x, y)
        ? isBackground(pixels, x, y)
        : !inside(free, x, y) && !isBackground(pixels, x, y);
      if (wrong) misses.push(`${x},${y}`);
    }
  }
  return misses;
}

/** The pixels of a tile rectangle, grown by one pixel, that show a surface instead of the background. */
export function surfaceInside(
  pixels: Pixels,
  origin: readonly [number, number],
  rect: PixelRect,
): readonly string[] {
  const grown = onSheet(origin, rect, 1);
  const found: string[] = [];
  for (let y = grown.top; y < grown.bottom; y++) {
    for (let x = grown.left; x < grown.right; x++) {
      if (!isBackground(pixels, x, y)) found.push(`${x},${y}`);
    }
  }
  return found;
}
