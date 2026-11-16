import type { Vec3 } from "./vector.js";
import { dot, normalize } from "./vector.js";
import type { Frame } from "./view.js";

/** The share of a surface's colour that every surface keeps, lit or not. */
const AMBIENT = 0.45;
/** The share the light adds to a surface that faces it. */
const DIFFUSE = 0.55;
/** The light's direction in the view's frame: to the left, up, and behind the viewer. */
const LIGHT = { left: 0.5, up: 0.7, behind: 0.5 } as const;
/** The steps of the linear-to-sRGB table. */
const STEPS = 4096;

/** The sRGB byte of each linear step from 0 to 1. */
const SRGB: Uint8Array = Uint8Array.from({ length: STEPS + 1 }, (_, step) => {
  const linear = step / STEPS;
  const encoded = linear <= 0.0031308 ? 12.92 * linear : 1.055 * linear ** (1 / 2.4) - 0.055;
  return Math.round(encoded * 255);
});

/** The unit direction toward the one fixed light: from the upper left, behind the viewer. */
export function lightOf(frame: Frame): Vec3 {
  const { right, up, forward } = frame;
  return normalize([
    -LIGHT.left * right[0] + LIGHT.up * up[0] - LIGHT.behind * forward[0],
    -LIGHT.left * right[1] + LIGHT.up * up[1] - LIGHT.behind * forward[1],
    -LIGHT.left * right[2] + LIGHT.up * up[2] - LIGHT.behind * forward[2],
  ]);
}

/** The sRGB byte of a linear value, clamped to 0..1. */
function srgbByte(linear: number): number {
  const step = Math.round(Math.min(1, Math.max(0, linear)) * STEPS);
  return SRGB[step] ?? 0;
}

/**
 * The sRGB bytes of a linear colour lit by the light, for a unit normal that faces the viewer.
 */
export function shade(color: Vec3, normal: Vec3, light: Vec3, out: Uint8Array): void {
  const intensity = AMBIENT + DIFFUSE * Math.max(0, dot(normal, light));
  out[0] = srgbByte(color[0] * intensity);
  out[1] = srgbByte(color[1] * intensity);
  out[2] = srgbByte(color[2] * intensity);
}
