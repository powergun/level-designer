import type { SlabMaterial } from "@level-designer/level-format";
import type { FacingName } from "./facing.js";

/** A closed interval `[min, max]` along one prop axis, in metres. */
export type Span = readonly [number, number];

/** An axis-aligned box of the prop frame: its x, y and z spans. */
export type Box = readonly [Span, Span, Span];

/**
 * One slab role of a kind, stated in the prop frame: its box, the facing of its +Z face, its
 * material and, for a glow slab, the glow name. The kit splits a role into runs and places it.
 */
export interface Role {
  readonly box: Box;
  readonly facing: FacingName;
  readonly material: SlabMaterial;
  readonly glow?: string;
}

/** The box mirrored in the plane x = 0. */
export function mirrorX([[x0, x1], y, z]: Box): Box {
  return [[-x1, -x0], y, z];
}

/** The box mirrored in the plane z = 0. */
export function mirrorZ([x, y, [z0, z1]]: Box): Box {
  return [x, y, [-z1, -z0]];
}
