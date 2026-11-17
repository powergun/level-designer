import type { Quaternion, Slab } from "@level-designer/level-format";
import { FACINGS } from "./facing.js";
import { multiply } from "./quaternion.js";
import type { PitchedRole, PlanePoint } from "./role.js";

/** Radians per degree. */
const RADIANS = Math.PI / 180;

/**
 * The point `along` metres from `from` in the direction `pitch` degrees above local +Z, then
 * `across` metres in the direction a right angle above it, in the YZ plane.
 */
export function pitchPoint(
  from: PlanePoint,
  pitch: number,
  along: number,
  across: number,
): PlanePoint {
  const [cos, sin] = [Math.cos(pitch * RADIANS), Math.sin(pitch * RADIANS)];
  return [from[0] + along * cos - across * sin, from[1] + along * sin + across * cos];
}

/**
 * The slab of a pitched role in the prop frame. Its height runs along the pitched direction and
 * its width a right angle above it; its rotation is the turn about X by 90 degrees less the pitch
 * after the `+X` facing, a product of unit quaternions.
 */
export function pitchedSlab(role: PitchedRole): Slab {
  const half = ((90 - role.pitch) * RADIANS) / 2;
  const turn: Quaternion = [Math.sin(half), 0, 0, Math.cos(half)];
  const [z, y] = pitchPoint(role.hinge, role.pitch, 0, role.width / 2);
  const [x0, x1] = role.x;
  return {
    size: [role.width, role.length, x1 - x0],
    material: role.material,
    color: role.color,
    position: [(x0 + x1) / 2, y, z],
    rotation: multiply(turn, FACINGS["+X"].quaternion),
  };
}
