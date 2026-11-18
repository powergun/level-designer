import { describe, expect, test } from "bun:test";
import { slabBox } from "@level-designer/level-format";
import type { Quaternion, SlabMaterial, Vec3 } from "@level-designer/level-format";
import { expanded } from "./fixtures.ts";
import type { Params, TestSite } from "./fixtures.ts";
import { expectAxes, expectStated, expectVector } from "./stated.ts";
import type { Axes, Stated } from "./stated.ts";

/** A test case: a prop, its look, its stated slabs at the origin and, when they are a prefix, its count. */
interface Case {
  readonly name: string;
  readonly kind: string;
  readonly params: Params;
  readonly material: SlabMaterial;
  readonly stated: readonly Stated[];
  readonly count?: number;
}

const DARK = "#3b4046";
const STEEL = "#8a9099";
const RUST = "#7a4a2a";

/** The axes of a level link: its width up, its height along +Z and its +Z face to +X. */
const LEVEL: Axes = [
  [0, 1, 0],
  [0, 0, 1],
  [1, 0, 0],
];

const CASES: readonly Case[] = [
  {
    name: "the worked conveyor, length 8 with a glow and default width and height",
    kind: "conveyor",
    params: { length: 8, color: DARK, glow: "cyan" },
    material: "metal",
    stated: [
      { finish: "bed/deck", facing: "up", size: [0.8, 8, 0.05], base: [0, 0.875, -4] },
      { finish: "housing/skirt", facing: "+X", size: [8, 0.85, 0.05], base: [0.345, 0, 0] },
      { finish: "housing/skirt", facing: "-X", size: [8, 0.85, 0.05], base: [-0.345, 0, 0] },
      { finish: "luminaire/band", facing: "+X", size: [8, 0.08, 0.03], base: [0.385, 0.77, 0] },
      { finish: "luminaire/band", facing: "-X", size: [8, 0.08, 0.03], base: [-0.385, 0.77, 0] },
    ],
  },
  {
    name: "a default 3 x 2 metal enclosure with a glow",
    kind: "enclosure",
    params: { width: 3, length: 2, color: DARK, glow: "amber" },
    material: "metal",
    stated: [
      { finish: "housing/top", facing: "up", size: [3, 2, 0.05], base: [0, 2.375, -1] },
      { finish: "housing/machine-plate", facing: "+X", size: [2, 2.35, 0.05], base: [1.445, 0, 0] },
      { finish: "housing/machine", facing: "-X", size: [2, 2.35, 0.05], base: [-1.445, 0, 0] },
      { finish: "housing/machine", facing: "+Z", size: [2.84, 2.35, 0.05], base: [0, 0, 0.975] },
      { finish: "housing/machine", facing: "-Z", size: [2.84, 2.35, 0.05], base: [0, 0, -0.975] },
      { finish: "luminaire/band", facing: "+X", size: [2, 0.1, 0.03], base: [1.485, 1.2, 0] },
      { finish: "luminaire/band", facing: "-X", size: [2, 0.1, 0.03], base: [-1.485, 1.2, 0] },
    ],
  },
  {
    name: "the smallest concrete enclosure with a glow keeps metal bands",
    kind: "enclosure",
    params: { width: 1, length: 1, height: 1.5, material: "concrete", color: DARK, glow: "cyan" },
    material: "concrete",
    stated: [
      { finish: "cast-concrete/top", facing: "up", size: [1, 1, 0.1], base: [0, 1.45, -0.5] },
      { finish: "cast-concrete/wall", facing: "+X", size: [1, 1.4, 0.1], base: [0.42, 0, 0] },
      { finish: "cast-concrete/wall", facing: "-X", size: [1, 1.4, 0.1], base: [-0.42, 0, 0] },
      { finish: "cast-concrete/wall", facing: "+Z", size: [0.74, 1.4, 0.1], base: [0, 0, 0.45] },
      { finish: "cast-concrete/wall", facing: "-Z", size: [0.74, 1.4, 0.1], base: [0, 0, -0.45] },
      { finish: "luminaire/band", facing: "+X", size: [1, 0.1, 0.03], base: [0.485, 1.2, 0] },
      { finish: "luminaire/band", facing: "-X", size: [1, 0.1, 0.03], base: [-0.485, 1.2, 0] },
    ],
  },
  {
    name: "the largest concrete enclosure splits its roof and long sides in two",
    kind: "enclosure",
    params: { width: 6, length: 8, height: 3.5, material: "concrete", color: DARK },
    material: "concrete",
    stated: [
      { finish: "cast-concrete/top", facing: "up", size: [6, 4, 0.1], base: [0, 3.45, -4] },
      { finish: "cast-concrete/top", facing: "up", size: [6, 4, 0.1], base: [0, 3.45, 0] },
      { finish: "cast-concrete/wall", facing: "+X", size: [4, 3.4, 0.1], base: [2.92, 0, -2] },
      { finish: "cast-concrete/wall", facing: "+X", size: [4, 3.4, 0.1], base: [2.92, 0, 2] },
      { finish: "cast-concrete/wall", facing: "-X", size: [4, 3.4, 0.1], base: [-2.92, 0, -2] },
      { finish: "cast-concrete/wall", facing: "-X", size: [4, 3.4, 0.1], base: [-2.92, 0, 2] },
      { finish: "cast-concrete/wall", facing: "+Z", size: [5.74, 3.4, 0.1], base: [0, 0, 3.95] },
      { finish: "cast-concrete/wall", facing: "-Z", size: [5.74, 3.4, 0.1], base: [0, 0, -3.95] },
    ],
  },
  {
    name: "a default container",
    kind: "container",
    params: { color: DARK },
    material: "metal",
    stated: [
      {
        finish: "corrugated/roof",
        facing: "up",
        size: [2.44, 6.06, 0.05],
        base: [0, 2.565, -3.03],
      },
      { finish: "corrugated/side", facing: "+X", size: [6.06, 2.54, 0.05], base: [1.195, 0, 0] },
      { finish: "corrugated/side", facing: "-X", size: [6.06, 2.54, 0.05], base: [-1.195, 0, 0] },
      { finish: "corrugated/end", facing: "+Z", size: [2.34, 2.54, 0.05], base: [0, 0, 3.005] },
      { finish: "corrugated/end", facing: "-Z", size: [2.34, 2.54, 0.05], base: [0, 0, -3.005] },
    ],
  },
  {
    name: "the longest container splits its roof and long sides in two",
    kind: "container",
    params: { length: 12.2, color: DARK },
    material: "metal",
    stated: [
      { finish: "corrugated/roof", facing: "up", size: [2.44, 6.1, 0.05], base: [0, 2.565, -6.1] },
      { finish: "corrugated/roof", facing: "up", size: [2.44, 6.1, 0.05], base: [0, 2.565, 0] },
      { finish: "corrugated/side", facing: "+X", size: [6.1, 2.54, 0.05], base: [1.195, 0, -3.05] },
      { finish: "corrugated/side", facing: "+X", size: [6.1, 2.54, 0.05], base: [1.195, 0, 3.05] },
      {
        finish: "corrugated/side",
        facing: "-X",
        size: [6.1, 2.54, 0.05],
        base: [-1.195, 0, -3.05],
      },
      { finish: "corrugated/side", facing: "-X", size: [6.1, 2.54, 0.05], base: [-1.195, 0, 3.05] },
      { finish: "corrugated/end", facing: "+Z", size: [2.34, 2.54, 0.05], base: [0, 0, 6.075] },
      { finish: "corrugated/end", facing: "-Z", size: [2.34, 2.54, 0.05], base: [0, 0, -6.075] },
    ],
  },
  {
    name: "a default crate",
    kind: "crate",
    params: { color: "#8a6a40" },
    material: "wood",
    stated: [
      { finish: "timber/lid", facing: "up", size: [1.2, 1.2, 0.05], base: [0, 1.175, -0.6] },
      {
        finish: "timber/crate-stencil",
        facing: "+X",
        size: [1.2, 1.15, 0.05],
        base: [0.575, 0, 0],
      },
      {
        finish: "timber/crate-stencil",
        facing: "-X",
        size: [1.2, 1.15, 0.05],
        base: [-0.575, 0, 0],
      },
      { finish: "timber/crate", facing: "+Z", size: [1.1, 1.15, 0.05], base: [0, 0, 0.575] },
      { finish: "timber/crate", facing: "-Z", size: [1.1, 1.15, 0.05], base: [0, 0, -0.575] },
    ],
  },
  {
    name: "a default partition",
    kind: "partition",
    params: { width: 2, height: 3, color: DARK },
    material: "concrete",
    stated: [{ finish: "cast-concrete/panel", facing: "+Z", size: [2, 3, 0.3], base: [0, 0, 0] }],
  },
  {
    name: "the largest brick partition splits along X into two runs",
    kind: "partition",
    params: { width: 8, height: 4, thickness: 0.6, material: "brick", color: DARK },
    material: "brick",
    stated: [
      { finish: "block/wall", facing: "+Z", size: [4, 4, 0.6], base: [-2, 0, 0] },
      { finish: "block/wall", facing: "+Z", size: [4, 4, 0.6], base: [2, 0, 0] },
    ],
  },
  {
    name: "a light strip of default width",
    kind: "light-strip",
    params: { length: 1, height: 3, color: "#d0e0ff", glow: "cyan" },
    material: "metal",
    stated: [
      { finish: "luminaire/strip", facing: "down", size: [0.2, 1, 0.08], base: [0, 3.04, -0.5] },
    ],
  },
  {
    name: "the largest, highest light strip",
    kind: "light-strip",
    params: { length: 12, width: 0.6, height: 17, color: "#d0e0ff", glow: "amber" },
    material: "metal",
    stated: [
      { finish: "luminaire/strip", facing: "down", size: [0.6, 12, 0.08], base: [0, 17.04, -6] },
    ],
  },
  {
    name: "a robot arm of reach 2 with an upright upper arm and a level forearm, glow and base colour",
    kind: "robot-arm",
    params: { reach: 2, shoulder: 90, elbow: 90, color: DARK, baseColor: STEEL, glow: "cyan" },
    material: "metal",
    stated: [
      {
        finish: "housing/top",
        facing: "up",
        size: [0.4, 0.8, 0.05],
        base: [0, 0.875, -0.4],
        color: STEEL,
      },
      {
        finish: "housing/pedestal",
        facing: "+X",
        size: [0.8, 0.85, 0.05],
        base: [0.175, 0, 0],
        color: STEEL,
      },
      {
        finish: "housing/pedestal",
        facing: "-X",
        size: [0.8, 0.85, 0.05],
        base: [-0.175, 0, 0],
        color: STEEL,
      },
      {
        finish: "housing/pedestal",
        facing: "+Z",
        size: [0.3, 0.85, 0.05],
        base: [0, 0, 0.375],
        color: STEEL,
      },
      {
        finish: "housing/pedestal",
        facing: "-Z",
        size: [0.3, 0.85, 0.05],
        base: [0, 0, -0.375],
        color: STEEL,
      },
      { finish: "casting/shoulder", facing: "+X", size: [0.6, 0.4, 0.4], base: [0, 0.9, 0] },
      { finish: "casting/upper-arm", facing: "+X", size: [0.3, 0.9, 0.4], base: [0, 1.3, -0.05] },
      { finish: "casting/forearm", facing: LEVEL, size: [0.25, 0.8, 0.4], base: [0, 2.325, 0.1] },
      { finish: "casting/head", facing: LEVEL, size: [0.35, 0.3, 0.4], base: [0, 2.325, 0.9] },
      {
        finish: "luminaire/band",
        facing: LEVEL,
        size: [0.1, 0.18, 0.03],
        base: [0.215, 2.325, 0.96],
      },
    ],
  },
  {
    name: "a default bridge crane on span 10, travel 10 and rail height 6 with a runway colour",
    kind: "bridge-crane",
    params: { span: 10, travel: 10, railHeight: 6, color: DARK, runwayColor: RUST },
    material: "metal",
    stated: [
      {
        finish: "beam/runway",
        facing: "-X",
        size: [10, 0.5, 0.05],
        base: [5, 6.05, 0],
        color: RUST,
      },
      {
        finish: "beam/flange",
        facing: "down",
        size: [0.3, 10, 0.05],
        base: [5, 6.025, -5],
        color: RUST,
      },
      {
        finish: "beam/runway",
        facing: "+X",
        size: [10, 0.5, 0.05],
        base: [-5, 6.05, 0],
        color: RUST,
      },
      {
        finish: "beam/flange",
        facing: "down",
        size: [0.3, 10, 0.05],
        base: [-5, 6.025, -5],
        color: RUST,
      },
      { finish: "beam/truck", facing: "-X", size: [3, 0.4, 0.3], base: [5, 6.55, 0] },
      { finish: "beam/truck", facing: "+X", size: [3, 0.4, 0.3], base: [-5, 6.55, 0] },
      { finish: "beam/girder", facing: "+Z", size: [9.7, 1.25, 0.05], base: [0, 6.6, 0.75] },
      { finish: "beam/flange", facing: "down", size: [9.7, 0.3, 0.05], base: [0, 6.575, 0.6] },
      { finish: "beam/girder", facing: "-Z", size: [9.7, 1.25, 0.05], base: [0, 6.6, -0.75] },
      { finish: "beam/flange", facing: "down", size: [9.7, 0.3, 0.05], base: [0, 6.575, -0.9] },
      { finish: "housing/top", facing: "up", size: [1.2, 1.55, 0.05], base: [0, 8.325, -0.775] },
      { finish: "housing/hoist", facing: "+X", size: [1.55, 0.45, 0.05], base: [0.575, 7.85, 0] },
      { finish: "housing/hoist", facing: "-X", size: [1.55, 0.45, 0.05], base: [-0.575, 7.85, 0] },
      { finish: "housing/hoist", facing: "+Z", size: [1.1, 0.45, 0.05], base: [0, 7.85, 0.75] },
      { finish: "housing/hoist", facing: "-Z", size: [1.1, 0.45, 0.05], base: [0, 7.85, -0.75] },
      { finish: "beam/hook", facing: "+Z", size: [0.4, 0.5, 0.3], base: [0, 4, 0] },
    ],
  },
  {
    name: "a default jib crane up to its boom; the tie and hoist have their own test",
    kind: "jib-crane",
    params: { color: DARK },
    count: 9,
    material: "metal",
    stated: [
      { finish: "beam/plinth", facing: "up", size: [0.8, 0.8, 0.6], base: [0, 0.3, -0.4] },
      { finish: "beam/mast-front", facing: "+X", size: [0.5, 5.8, 0.05], base: [0.225, 0.6, 0] },
      { finish: "beam/mast", facing: "-X", size: [0.5, 5.8, 0.05], base: [-0.225, 0.6, 0] },
      { finish: "beam/mast", facing: "+Z", size: [0.4, 5.8, 0.05], base: [0, 0.6, 0.225] },
      { finish: "beam/mast", facing: "-Z", size: [0.4, 5.8, 0.05], base: [0, 0.6, -0.225] },
      { finish: "beam/boom", facing: "+X", size: [3.75, 0.4, 0.05], base: [0, 5.05, 2.125] },
      { finish: "beam/flange", facing: "down", size: [0.3, 3.75, 0.05], base: [0, 5.025, 0.25] },
    ],
  },
];

describe("each kind expands to its stated slabs in slab order", () => {
  for (const c of CASES) {
    test(c.name, () => {
      const glow = typeof c.params.glow === "string" ? c.params.glow : undefined;
      const look = { material: c.material, color: String(c.params.color), glow };
      const slabs = expanded(c.kind, c.params);
      expect(slabs.length).toBe(c.count ?? c.stated.length);
      expectStated(slabs.slice(0, c.stated.length), c.stated, look);
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

describe("pitched slabs", () => {
  test("an upper arm at shoulder 60 rises toward +Z from its hinge on the shoulder top", () => {
    const [sin, cos] = [Math.sqrt(3) / 2, 0.5];
    const upper = expanded("robot-arm", { reach: 2, shoulder: 60, elbow: 120, color: DARK })[6];
    expect(upper).toBeDefined();
    if (upper !== undefined) {
      expectAxes(upper.slab, [
        [0, cos, -sin],
        [0, sin, cos],
        [1, 0, 0],
      ]);
      expectVector(upper.slab.position, [0, 1.3 + 0.15 * cos, 0.1 - 0.15 * sin]);
    }
  });

  test("a jib tie touches the mast face and the web top each along one edge, 0.1 m wide", () => {
    const slabs = expanded("jib-crane", { height: 5, boom: 4, color: DARK });
    expect(slabs.length).toBe(9);
    const tie = slabs[7]?.slab;
    const hoist = slabs[8]?.slab;
    expect(tie).toBeDefined();
    if (tie === undefined || hoist === undefined) {
      return;
    }
    const corners = slabBox(tie).corners;
    const touches = (z: number, y: number): number =>
      corners.filter((c) => Math.abs(c[2] - z) < 1e-9 && Math.abs(c[1] - y) < 1e-9).length;
    expect(touches(0.25, 6.25)).toBe(2);
    expect(touches(2.875, 5.45)).toBe(2);
    expect(tie.size[0]).toBeCloseTo(0.1, 9);
    expect(Math.min(...corners.map((c) => c[2]))).toBeCloseTo(0.25, 9);
    expect(Math.min(...corners.map((c) => c[1]))).toBeCloseTo(5.45, 9);
    expectVector(hoist.size, [0.4, 0.4, 0.3]);
    expectVector(hoist.position, [0, 4.6, 3.7]);
  });
});
