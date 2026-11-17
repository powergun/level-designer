import { expect } from "bun:test";
import { slabBox } from "@level-designer/level-format";
import type { Slab, SlabMaterial, Vec3 } from "@level-designer/level-format";
import type { PropSlab } from "@level-designer/prop-kit";

/** The facing names of the kind tables. */
type Facing = "+Z" | "+X" | "-Z" | "-X" | "up" | "down";

/** A slab's +X, +Y and +Z directions in the prop frame. */
export type Axes = readonly [Vec3, Vec3, Vec3];

/** Each facing's slab +X, +Y and +Z directions in the prop frame, as the kind tables state them. */
const FACING_AXES: Readonly<Record<Facing, Axes>> = {
  "+Z": [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ],
  "+X": [
    [0, 0, -1],
    [0, 1, 0],
    [1, 0, 0],
  ],
  "-Z": [
    [-1, 0, 0],
    [0, 1, 0],
    [0, 0, -1],
  ],
  "-X": [
    [0, 0, 1],
    [0, 1, 0],
    [-1, 0, 0],
  ],
  up: [
    [-1, 0, 0],
    [0, 0, 1],
    [0, 1, 0],
  ],
  down: [
    [1, 0, 0],
    [0, 0, 1],
    [0, -1, 0],
  ],
};

/**
 * One slab as the kind tables state it in the prop frame: its facing, or the axes of a pitched
 * slab; its size and base centre; its glow; and its colour where it differs from the prop's.
 */
export interface Stated {
  readonly facing: Facing | Axes;
  readonly size: Vec3;
  readonly base: Vec3;
  readonly glow?: string;
  readonly color?: string;
}

/** Asserts that two vectors agree to 1e-9. */
export function expectVector(actual: Vec3, expected: Vec3): void {
  expected.forEach((value, axis) => expect(actual[axis]).toBeCloseTo(value, 9));
}

/** Asserts that the slab turns its three axes as stated. */
export function expectAxes(slab: Slab, axes: Axes): void {
  slabBox(slab).axes.forEach((axis, i) => expectVector(axis, axes[i] ?? [0, 0, 0]));
}

/** Asserts that the prop at the origin expands to exactly the stated slabs, in order. */
export function expectStated(
  slabs: readonly PropSlab[],
  stated: readonly Stated[],
  look: { readonly material: SlabMaterial; readonly color: string },
): void {
  expect(slabs.length).toBe(stated.length);
  stated.forEach((want, k) => {
    const got = slabs[k];
    expect(got).toBeDefined();
    if (got === undefined) {
      return;
    }
    expectVector(got.slab.size, want.size);
    expectVector(got.slab.position, want.base);
    expectAxes(got.slab, typeof want.facing === "string" ? FACING_AXES[want.facing] : want.facing);
    expect(got.slab.color).toBe(want.color ?? look.color);
    expect(got.slab.material).toBe(want.glow === undefined ? look.material : "metal");
    expect(got.glow).toBe(want.glow);
  });
}
