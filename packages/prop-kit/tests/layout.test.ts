import { describe, expect, test } from "bun:test";
import { slabBox } from "@level-designer/level-format";
import type { Quaternion, Slab, SlabMaterial, Vec3 } from "@level-designer/level-format";
import type { PropSlab } from "@level-designer/prop-kit";
import { expanded } from "./fixtures.ts";
import type { Params, TestSite } from "./fixtures.ts";

/** The facing names of the kind tables. */
type Facing = "+Z" | "+X" | "-Z" | "-X" | "up" | "down";

/** Each facing's slab +X, +Y and +Z directions in the prop frame, as the kind tables state them. */
const FACING_AXES: Readonly<Record<Facing, readonly [Vec3, Vec3, Vec3]>> = {
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

/** One slab as the kind tables state it in the prop frame. */
interface Stated {
  readonly facing: Facing;
  readonly size: Vec3;
  readonly base: Vec3;
  readonly glow?: string;
}

/** Asserts that two vectors agree to 1e-9. */
function expectVector(actual: Vec3, expected: Vec3): void {
  expected.forEach((value, axis) => expect(actual[axis]).toBeCloseTo(value, 9));
}

/** Asserts that the slab turns its three axes as the facing states. */
function expectAxes(slab: Slab, axes: readonly [Vec3, Vec3, Vec3]): void {
  slabBox(slab).axes.forEach((axis, i) => expectVector(axis, axes[i] ?? [0, 0, 0]));
}

/** Asserts that the prop at the origin expands to exactly the stated slabs, in order. */
function expectStated(
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
    expectAxes(got.slab, FACING_AXES[want.facing]);
    expect(got.slab.color).toBe(look.color);
    expect(got.slab.material).toBe(want.glow === undefined ? look.material : "metal");
    expect(got.glow).toBe(want.glow);
  });
}

/** A test case: a prop, its look and its stated slabs at the origin. */
interface Case {
  readonly name: string;
  readonly kind: string;
  readonly params: Params;
  readonly material: SlabMaterial;
  readonly stated: readonly Stated[];
}

const DARK = "#3b4046";

const CASES: readonly Case[] = [
  {
    name: "the worked conveyor, length 8 with a glow and default width and height",
    kind: "conveyor",
    params: { length: 8, color: DARK, glow: "cyan" },
    material: "metal",
    stated: [
      { facing: "up", size: [0.8, 8, 0.05], base: [0, 0.875, -4] },
      { facing: "+X", size: [8, 0.85, 0.05], base: [0.345, 0, 0] },
      { facing: "-X", size: [8, 0.85, 0.05], base: [-0.345, 0, 0] },
      { facing: "+X", size: [8, 0.08, 0.03], base: [0.385, 0.77, 0], glow: "cyan" },
      { facing: "-X", size: [8, 0.08, 0.03], base: [-0.385, 0.77, 0], glow: "cyan" },
    ],
  },
  {
    name: "a default 3 x 2 metal enclosure with a glow",
    kind: "enclosure",
    params: { width: 3, length: 2, color: DARK, glow: "amber" },
    material: "metal",
    stated: [
      { facing: "up", size: [3, 2, 0.05], base: [0, 2.375, -1] },
      { facing: "+X", size: [2, 2.35, 0.05], base: [1.445, 0, 0] },
      { facing: "-X", size: [2, 2.35, 0.05], base: [-1.445, 0, 0] },
      { facing: "+Z", size: [2.84, 2.35, 0.05], base: [0, 0, 0.975] },
      { facing: "-Z", size: [2.84, 2.35, 0.05], base: [0, 0, -0.975] },
      { facing: "+X", size: [2, 0.1, 0.03], base: [1.485, 1.2, 0], glow: "amber" },
      { facing: "-X", size: [2, 0.1, 0.03], base: [-1.485, 1.2, 0], glow: "amber" },
    ],
  },
  {
    name: "the smallest concrete enclosure with a glow keeps metal bands",
    kind: "enclosure",
    params: { width: 1, length: 1, height: 1.5, material: "concrete", color: DARK, glow: "cyan" },
    material: "concrete",
    stated: [
      { facing: "up", size: [1, 1, 0.1], base: [0, 1.45, -0.5] },
      { facing: "+X", size: [1, 1.4, 0.1], base: [0.42, 0, 0] },
      { facing: "-X", size: [1, 1.4, 0.1], base: [-0.42, 0, 0] },
      { facing: "+Z", size: [0.74, 1.4, 0.1], base: [0, 0, 0.45] },
      { facing: "-Z", size: [0.74, 1.4, 0.1], base: [0, 0, -0.45] },
      { facing: "+X", size: [1, 0.1, 0.03], base: [0.485, 1.2, 0], glow: "cyan" },
      { facing: "-X", size: [1, 0.1, 0.03], base: [-0.485, 1.2, 0], glow: "cyan" },
    ],
  },
  {
    name: "the largest concrete enclosure splits its roof and long sides in two",
    kind: "enclosure",
    params: { width: 6, length: 8, height: 3.5, material: "concrete", color: DARK },
    material: "concrete",
    stated: [
      { facing: "up", size: [6, 4, 0.1], base: [0, 3.45, -4] },
      { facing: "up", size: [6, 4, 0.1], base: [0, 3.45, 0] },
      { facing: "+X", size: [4, 3.4, 0.1], base: [2.92, 0, -2] },
      { facing: "+X", size: [4, 3.4, 0.1], base: [2.92, 0, 2] },
      { facing: "-X", size: [4, 3.4, 0.1], base: [-2.92, 0, -2] },
      { facing: "-X", size: [4, 3.4, 0.1], base: [-2.92, 0, 2] },
      { facing: "+Z", size: [5.74, 3.4, 0.1], base: [0, 0, 3.95] },
      { facing: "-Z", size: [5.74, 3.4, 0.1], base: [0, 0, -3.95] },
    ],
  },
  {
    name: "a default container",
    kind: "container",
    params: { color: DARK },
    material: "metal",
    stated: [
      { facing: "up", size: [2.44, 6.06, 0.05], base: [0, 2.565, -3.03] },
      { facing: "+X", size: [6.06, 2.54, 0.05], base: [1.195, 0, 0] },
      { facing: "-X", size: [6.06, 2.54, 0.05], base: [-1.195, 0, 0] },
      { facing: "+Z", size: [2.34, 2.54, 0.05], base: [0, 0, 3.005] },
      { facing: "-Z", size: [2.34, 2.54, 0.05], base: [0, 0, -3.005] },
    ],
  },
  {
    name: "the longest container splits its roof and long sides in two",
    kind: "container",
    params: { length: 12.2, color: DARK },
    material: "metal",
    stated: [
      { facing: "up", size: [2.44, 6.1, 0.05], base: [0, 2.565, -6.1] },
      { facing: "up", size: [2.44, 6.1, 0.05], base: [0, 2.565, 0] },
      { facing: "+X", size: [6.1, 2.54, 0.05], base: [1.195, 0, -3.05] },
      { facing: "+X", size: [6.1, 2.54, 0.05], base: [1.195, 0, 3.05] },
      { facing: "-X", size: [6.1, 2.54, 0.05], base: [-1.195, 0, -3.05] },
      { facing: "-X", size: [6.1, 2.54, 0.05], base: [-1.195, 0, 3.05] },
      { facing: "+Z", size: [2.34, 2.54, 0.05], base: [0, 0, 6.075] },
      { facing: "-Z", size: [2.34, 2.54, 0.05], base: [0, 0, -6.075] },
    ],
  },
  {
    name: "a default crate",
    kind: "crate",
    params: { color: "#8a6a40" },
    material: "wood",
    stated: [
      { facing: "up", size: [1.2, 1.2, 0.05], base: [0, 1.175, -0.6] },
      { facing: "+X", size: [1.2, 1.15, 0.05], base: [0.575, 0, 0] },
      { facing: "-X", size: [1.2, 1.15, 0.05], base: [-0.575, 0, 0] },
      { facing: "+Z", size: [1.1, 1.15, 0.05], base: [0, 0, 0.575] },
      { facing: "-Z", size: [1.1, 1.15, 0.05], base: [0, 0, -0.575] },
    ],
  },
  {
    name: "a default partition",
    kind: "partition",
    params: { width: 2, height: 3, color: DARK },
    material: "concrete",
    stated: [{ facing: "+Z", size: [2, 3, 0.3], base: [0, 0, 0] }],
  },
  {
    name: "the largest brick partition splits along X into two runs",
    kind: "partition",
    params: { width: 8, height: 4, thickness: 0.6, material: "brick", color: DARK },
    material: "brick",
    stated: [
      { facing: "+Z", size: [4, 4, 0.6], base: [-2, 0, 0] },
      { facing: "+Z", size: [4, 4, 0.6], base: [2, 0, 0] },
    ],
  },
  {
    name: "a light strip of default width",
    kind: "light-strip",
    params: { length: 1, height: 3, color: "#d0e0ff", glow: "cyan" },
    material: "metal",
    stated: [{ facing: "down", size: [0.2, 1, 0.08], base: [0, 3.04, -0.5], glow: "cyan" }],
  },
  {
    name: "the largest, highest light strip",
    kind: "light-strip",
    params: { length: 12, width: 0.6, height: 17, color: "#d0e0ff", glow: "amber" },
    material: "metal",
    stated: [{ facing: "down", size: [0.6, 12, 0.08], base: [0, 17.04, -6], glow: "amber" }],
  },
];

describe("each kind expands to its stated slabs in slab order", () => {
  for (const c of CASES) {
    test(c.name, () => {
      const look = { material: c.material, color: String(c.params.color) };
      expectStated(expanded(c.kind, c.params), c.stated, look);
    });
  }
});

/** One placed slab of the worked example: its world position and its rotation. */
interface Placed {
  readonly position: Vec3;
  readonly rotation: Quaternion;
}

describe("placement", () => {
  test("the worked conveyor at (-4, 12.5) with yaw 90 on a floor at 0.3241", () => {
    const site: TestSite = { at: [-4, 12.5], yaw: 90, floor: 0.3241 };
    const slabs = expanded("conveyor", { length: 8, color: DARK, glow: "cyan" }, site);
    const placed: readonly Placed[] = [
      { position: [-8, 1.1991, 12.5], rotation: [0.5, 0.5, 0.5, -0.5] },
      { position: [-4, 0.3241, 12.155], rotation: [0, 1, 0, 0] },
      { position: [-4, 0.3241, 12.845], rotation: [0, 0, 0, 1] },
      { position: [-4, 1.0941, 12.115], rotation: [0, 1, 0, 0] },
      { position: [-4, 1.0941, 12.885], rotation: [0, 0, 0, 1] },
    ];
    expect(slabs.length).toBe(placed.length);
    placed.forEach((want, k) => {
      const got = slabs[k]?.slab;
      expect(got).toBeDefined();
      if (got !== undefined) {
        expectVector(got.position, want.position);
        expectAxes(got, slabBox({ ...got, rotation: want.rotation }).axes);
      }
    });
  });

  test("a yaw of 90 degrees turns local +Z to world +X", () => {
    const site: TestSite = { at: [0, 0], yaw: 90, floor: 0 };
    const [wall] = expanded("partition", { width: 2, height: 2, color: DARK }, site);
    expect(wall).toBeDefined();
    if (wall !== undefined) {
      expectVector(slabBox(wall.slab).axes[2], [1, 0, 0]);
    }
  });
});
