import type { SlabMaterial } from "@level-designer/level-format";
import type { FacingName } from "./facing.js";

/** A closed interval `[min, max]` along one prop axis, in metres. */
export type Span = readonly [number, number];

/** An axis-aligned box of the prop frame: its x, y and z spans. */
export type Box = readonly [Span, Span, Span];

/** A point of the prop's YZ plane as `[z, y]`, the plane a pitched slab turns in. */
export type PlanePoint = readonly [number, number];

/** What every role carries besides its geometry: material, colour and, for a glow slab, the glow name. */
interface Look {
  readonly material: SlabMaterial;
  readonly color: string;
  readonly glow?: string;
}

/** A role that fills an axis-aligned box of the prop frame, its +Z face looking to `facing`. */
export interface BoxRole extends Look {
  readonly form: "box";
  readonly box: Box;
  readonly facing: FacingName;
}

/**
 * A role that keeps the facing `+X` and turns about local X: a rectangle of the YZ plane that
 * grows from `hinge` by `length` along its pitched direction, `pitch` degrees above local +Z,
 * and by `width` along the direction a right angle above it; it spans `x` in thickness.
 */
export interface PitchedRole extends Look {
  readonly form: "pitched";
  readonly x: Span;
  readonly hinge: PlanePoint;
  readonly length: number;
  readonly width: number;
  readonly pitch: number;
}

/**
 * One slab role of a kind, stated in the prop frame. The kit splits a box role into runs, keeps
 * a pitched role whole, and places every slab.
 */
export type Role = BoxRole | PitchedRole;

/** The box mirrored in the plane x = 0. */
export function mirrorX([[x0, x1], y, z]: Box): Box {
  return [[-x1, -x0], y, z];
}

/** The box mirrored in the plane z = 0. */
export function mirrorZ([x, y, [z0, z1]]: Box): Box {
  return [x, y, [-z1, -z0]];
}

/** The box moved by `[dx, dy, dz]`. */
export function moveBox(
  [[x0, x1], [y0, y1], [z0, z1]]: Box,
  [dx, dy, dz]: readonly [number, number, number],
): Box {
  return [
    [x0 + dx, x1 + dx],
    [y0 + dy, y1 + dy],
    [z0 + dz, z1 + dz],
  ];
}
