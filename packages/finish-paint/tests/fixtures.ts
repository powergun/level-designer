import {
  numberArithmetic,
  paintFace,
  type PaintFace,
  type Shade,
} from "@level-designer/finish-paint";
import type { Effects, Layer, Length, Pattern } from "@level-designer/level-format";

/** One footprint of 1 mm, far below every mark of the tests. */
export const FINE = 0.001;

/** A length of plain metres, or metres plus a share of the face's width or height. */
export function len(metres: number, share?: readonly ["w" | "h", number]): Length {
  return share === undefined ? { metres } : { metres, share: { of: share[0], factor: share[1] } };
}

/** A rectangle far wider than every face of the tests: coverage 1 wherever a layer draws. */
export const EVERYWHERE: Pattern = {
  kind: "rectangle",
  from: [len(-1000), len(-1000)],
  to: [len(1000), len(1000)],
};

/** Full metalness: a layer of it turns a bare base's metalness into its coverage. */
const METAL: Effects = { metalness: 1 };

/** A layer with the format's defaults, the stated keys over them. */
export function layer(pattern: Pattern, effects: Effects, keys: Partial<Layer> = {}): Layer {
  return { pattern, on: "outside", wear: false, amount: 1, ...keys, effects };
}

/** A slab's outside face, 2 x 1.2 m, centred: its low corner at (-1, 0). */
export const CENTRED: PaintFace<number> = {
  x: 0,
  y: 0,
  low: [-1, 0],
  size: [2, 1.2],
  faceClass: 0,
  seed: 7,
  wear: 0.3,
};

/** A hall wall, 16 x 8 m, its low corner at (10, -3) in level coordinates. */
export const HALL: PaintFace<number> = { ...CENTRED, low: [10, -3], size: [16, 8] };

/** A base of 32-bit values that no body gave. */
export const BASE: Shade<number> = {
  albedo: [Math.fround(0.2), Math.fround(0.4), Math.fround(0.6)],
  metalness: Math.fround(0.1),
  roughness: Math.fround(0.6),
  emission: 0,
};

/** A linear tint, exact in 32-bit floats. */
export const TINT = [0.5, 0.25, 0.125] as const;

/** A linear colour that `"glow"` takes, exact in 32-bit floats. */
export const LIGHT = [1, 0.5, 0] as const;

/** The default body; the painter reads only the base shade it is given. */
const BODY = { shade: 1, metalness: 0, roughness: 0.6, lit: 0 } as const;

/** The painted shade of layers at a point of a face, from a base. */
export function paintAt(
  layers: readonly Layer[],
  face: PaintFace<number>,
  base: Shade<number> = BASE,
  footprint = FINE,
): Shade<number> {
  const surface = { face, tint: TINT, light: LIGHT, footprint };
  return paintFace(numberArithmetic, { body: BODY, light: "#ffffff", layers }, base, surface);
}

/** A base of metalness 0: a layer moving metalness to 1 then shows its coverage. */
const BARE: Shade<number> = { ...BASE, metalness: 0 };

/**
 * A layer's coverage at a point, read through the painter as its metalness over a bare base.
 * The painter clamps only the albedo, so a coverage outside 0 to 1 shows unchanged.
 */
export function coverageAt(
  pattern: Pattern,
  keys: Partial<Layer>,
  face: PaintFace<number>,
  footprint = FINE,
): number {
  return paintAt([layer(pattern, METAL, keys)], face, BARE, footprint).metalness;
}
