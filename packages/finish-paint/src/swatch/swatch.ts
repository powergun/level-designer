import type { DrawnRecipe } from "@level-designer/level-format";
import { numberArithmetic } from "../arithmetic/index.js";
import { bodyShade, type PaintFace, paintFace, type Rgb } from "../painter/index.js";

/**
 * The face a swatch draws: its low corner and size `[width, height]` in metres, in the
 * face's pattern coordinates, its class, seed and wear.
 */
export type SwatchFace = Omit<PaintFace<number>, "x" | "y">;

/** A window of a face: its low corner and size `[width, height]` in metres. */
export interface SwatchWindow {
  readonly low: readonly [number, number];
  readonly size: readonly [number, number];
}

/**
 * What a swatch draws: the face, a window of it (the whole face by default), the metres per
 * pixel, which is also the footprint, the linear tint, and the linear colour `"glow"` takes.
 */
export interface SwatchRequest {
  readonly face: SwatchFace;
  readonly window?: SwatchWindow;
  readonly scale: number;
  readonly tint: Rgb<number>;
  readonly light: Rgb<number>;
}

/**
 * A recipe drawn as pixels: linear RGB albedo, three per pixel, row-major, row 0 at the
 * window's top and column 0 at its low end; and the mean albedo of all pixels.
 */
export interface Swatch {
  readonly width: number;
  readonly height: number;
  readonly albedo: Float32Array;
  readonly mean: Rgb<number>;
}

/** The pixels along one side of a window: its length over the scale, rounded, at least 1. */
function pixelsAlong(length: number, scale: number): number {
  return Math.max(1, Math.round(length / scale));
}

/**
 * A drawn recipe on the number back end, each pixel sampled at its centre over a footprint
 * of one pixel, from the base shade of the recipe's body on the tint.
 */
export function paintSwatch(recipe: DrawnRecipe, request: SwatchRequest): Swatch {
  const { face, scale, tint, light } = request;
  const window = request.window ?? { low: face.low, size: face.size };
  const width = pixelsAlong(window.size[0], scale);
  const height = pixelsAlong(window.size[1], scale);
  const base = bodyShade(numberArithmetic, recipe.body, tint);
  const albedo = new Float32Array(width * height * 3);
  const sum = [0, 0, 0];
  const top = window.low[1] + window.size[1];
  for (let row = 0; row < height; row += 1) {
    const y = top - (row + 0.5) * scale;
    for (let column = 0; column < width; column += 1) {
      const x = window.low[0] + (column + 0.5) * scale;
      const surface = { face: { ...face, x, y }, tint, light, footprint: scale };
      const shade = paintFace(numberArithmetic, recipe, base, surface);
      const at = (row * width + column) * 3;
      for (const [channel, value] of shade.albedo.entries()) {
        albedo[at + channel] = value;
        sum[channel] = (sum[channel] ?? 0) + value;
      }
    }
  }
  const count = width * height;
  const [r = 0, g = 0, b = 0] = sum.map((total) => total / count);
  return { width, height, albedo, mean: [r, g, b] };
}
