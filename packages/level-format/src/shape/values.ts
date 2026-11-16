import type { ShapeNode } from "./node.js";

/** A point or a vector `[x, y, z]` in the level frame, in scaled metres. */
export type Vec3 = readonly [number, number, number];

/** A linear RGB triple, each channel from 0 to 1. */
export type LinearRgb = readonly [number, number, number];

/** The slack of every length limit, 0.05 mm, so a length typed at its limit passes. */
export const LENGTH_SLACK = 0.00005;

/** How far a unit vector's or a unit quaternion's length may differ from 1. */
const UNIT_TOLERANCE = 0.000001;

/** A surface colour: `#rrggbb` sRGB text. */
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

/** A list of three numbers. */
export function readVec3(node: ShapeNode): Vec3 {
  const [x = Number.NaN, y = Number.NaN, z = Number.NaN] = node.tuple(3).map((n) => n.number());
  return [x, y, z];
}

/** A linear RGB triple with every channel from 0 to 1. */
export function readLinearRgb(node: ShapeNode): LinearRgb {
  const [r = Number.NaN, g = Number.NaN, b = Number.NaN] = node
    .tuple(3)
    .map((n) => n.numberIn(0, 1));
  return [r, g, b];
}

/** Whether a value is a surface colour: `#rrggbb` text, in either letter case. */
export function isSurfaceColor(value: unknown): value is string {
  return typeof value === "string" && HEX_COLOR.test(value);
}

/** A `#rrggbb` surface colour. */
export function readHexColor(node: ShapeNode): string {
  if (isSurfaceColor(node.value)) {
    return node.value;
  }
  node.fail("a #rrggbb colour");
  return "";
}

/** Whether the components form a vector of length 1, within the unit tolerance. */
export function isUnit(components: readonly number[]): boolean {
  return Math.abs(Math.hypot(...components) - 1) <= UNIT_TOLERANCE;
}
