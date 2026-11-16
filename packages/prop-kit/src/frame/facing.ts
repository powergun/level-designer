import type { Quaternion } from "@level-designer/level-format";

/** A prop axis by index: 0 is x, 1 is y, 2 is z. */
export type Axis = 0 | 1 | 2;

/**
 * Where a slab's +Z face looks in the prop frame. The quaternion turns the slab frame into
 * the prop frame; `width`, `height` and `thickness` name the prop axes that the slab's width
 * (+X), height (+Y) and thickness (+Z) run along.
 */
export interface Facing {
  readonly quaternion: Quaternion;
  readonly width: Axis;
  readonly height: Axis;
  readonly thickness: Axis;
}

/** The name of one of the six axis-aligned facings. */
export type FacingName = "+Z" | "+X" | "-Z" | "-X" | "up" | "down";

/** The sine and cosine of 45 degrees. */
const S = Math.SQRT1_2;

/**
 * The six axis-aligned facings. `+Z`, `+X`, `-Z` and `-X` stand upright, turned by a yaw of
 * 0, 90, 180 and 270 degrees. `up` lies with its +Z face to +Y and `down` to -Y; both run
 * their height along the prop's +Z.
 */
export const FACINGS: Readonly<Record<FacingName, Facing>> = {
  "+Z": { quaternion: [0, 0, 0, 1], width: 0, height: 1, thickness: 2 },
  "+X": { quaternion: [0, S, 0, S], width: 2, height: 1, thickness: 0 },
  "-Z": { quaternion: [0, 1, 0, 0], width: 0, height: 1, thickness: 2 },
  "-X": { quaternion: [0, -S, 0, S], width: 2, height: 1, thickness: 0 },
  up: { quaternion: [0, S, S, 0], width: 0, height: 2, thickness: 1 },
  down: { quaternion: [S, 0, 0, S], width: 0, height: 2, thickness: 1 },
};

/** The axis a slab of this facing splits along: its height axis when horizontal, else its width axis. */
export function runAxis(facing: Facing): Axis {
  return facing.height === 1 ? facing.width : facing.height;
}
