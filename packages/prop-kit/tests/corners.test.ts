import { describe, expect, test } from "bun:test";
import { admitSlabs, roundSlab, slabBox } from "@level-designer/level-format";
import type { Slab } from "@level-designer/level-format";
import type { PropSlab } from "@level-designer/prop-kit";
import { expanded, ODD_SITE, ORIGIN } from "./fixtures.ts";
import type { Params, TestSite } from "./fixtures.ts";
import { deepestEntry, lowestPoint } from "./geometry.ts";

/** The contact the `overlap` rule lets through, in metres. */
const CONTACT = 0.001;

/** One corner or threshold of a kind with the slab count the format and the kind table state. */
interface Corner {
  readonly kind: string;
  readonly params: Params;
  readonly count: number;
}

const COLOR = "#3b4046";

/** Every combination of the listed values, one params record per combination. */
function grid(axes: Readonly<Record<string, readonly unknown[]>>): Params[] {
  return Object.entries(axes).reduce<Params[]>(
    (combos, [name, values]) =>
      combos.flatMap((combo) => values.map((value) => ({ ...combo, [name]: value }))),
    [{}],
  );
}

/** Conveyor corners: 3 slabs, 5 with a glow. */
const CONVEYORS: readonly Corner[] = grid({
  length: [1, 12],
  width: [0.6, 1.6],
  height: [0.6, 1.2],
  glow: [undefined, "cyan"],
}).map((p) => ({ kind: "conveyor", params: p, count: p.glow === undefined ? 3 : 5 }));

/**
 * Enclosure corners: the stated counts without a glow by width, length, height and material;
 * a glow adds 2. Only the 6 x 8 corners split the roof; only the 8 x 3.5 corners split the sides.
 */
const ENCLOSURES: readonly Corner[] = grid({
  width: [1, 6],
  length: [1, 8],
  height: [1.5, 3.5],
  material: ["metal", "concrete"],
  glow: [undefined, "amber"],
}).map((p) => {
  const roofRuns = p.width === 6 && p.length === 8 ? 2 : 1;
  const sideRuns = p.length === 8 && p.height === 3.5 ? 2 : 1;
  const glows = p.glow === undefined ? 0 : 2;
  return { kind: "enclosure", params: p, count: roofRuns + 2 * sideRuns + 2 + glows };
});

/** Enclosure split thresholds, each with its stated count without a glow. */
const ENCLOSURE_THRESHOLDS: readonly Corner[] = [
  { kind: "enclosure", params: { width: 6, length: 4.1666 }, count: 5 },
  { kind: "enclosure", params: { width: 6, length: 4.1667 }, count: 6 },
  // Off the grid: 25.00002 m2 unrounded passes the face cap, but it rounds to 25.0002 m2.
  { kind: "enclosure", params: { width: 6, length: 4.16667 }, count: 6 },
  { kind: "enclosure", params: { width: 4, length: 6.25 }, count: 5 },
  { kind: "enclosure", params: { width: 5, length: 5 }, count: 5 },
  { kind: "enclosure", params: { width: 5, length: 5.0001 }, count: 6 },
  { kind: "enclosure", params: { width: 1, length: 8, height: 3.175 }, count: 5 },
  { kind: "enclosure", params: { width: 1, length: 8, height: 3.1751 }, count: 7 },
  {
    kind: "enclosure",
    params: { width: 1, length: 8, height: 3.225, material: "concrete" },
    count: 5,
  },
  {
    kind: "enclosure",
    params: { width: 1, length: 8, height: 3.2251, material: "concrete" },
    count: 7,
  },
  { kind: "enclosure", params: { width: 3, length: 2 }, count: 5 },
  { kind: "enclosure", params: { width: 3, length: 2, glow: "cyan" }, count: 7 },
];

/** Container lengths at the range ends, the default and both split thresholds. */
const CONTAINERS: readonly Corner[] = [
  [3, 5],
  [6.06, 5],
  [9.8425, 5],
  [9.8426, 7],
  [10.2459, 7],
  [10.246, 8],
  [12.2, 8],
].map(([length, count]) => ({ kind: "container", params: { length }, count: count ?? 0 }));

/** Crate sizes at the range ends and the default. */
const CRATES: readonly Corner[] = [0.6, 1.2, 1.8].map((size) => ({
  kind: "crate",
  params: { size },
  count: 5,
}));

/** Partition corners in every material, and the face threshold. */
const PARTITIONS: readonly Corner[] = [
  ...grid({
    width: [1, 8],
    height: [1, 4],
    thickness: [0.1, 0.6],
    material: ["wood", "brick", "concrete", "metal"],
  }).map((p) => ({
    kind: "partition",
    params: p,
    count: p.width === 8 && p.height === 4 ? 2 : 1,
  })),
  { kind: "partition", params: { width: 6.25, height: 4 }, count: 1 },
  { kind: "partition", params: { width: 6.2501, height: 4 }, count: 2 },
];

/** Light strip corners, each one slab. */
const LIGHT_STRIPS: readonly Corner[] = grid({
  length: [0.5, 12],
  width: [0.1, 0.6],
  height: [2.5, 17],
  glow: ["cyan"],
}).map((p) => ({ kind: "light-strip", params: p, count: 1 }));

/** The slabs of a corner on a site, rounded to the format's grid as the pipeline rounds them. */
function roundedSlabs(corner: Corner, site: TestSite): Slab[] {
  return expanded(corner.kind, { ...corner.params, color: COLOR }, site).map((s) =>
    roundSlab(s.slab),
  );
}

/** The world-frame offset of a point from the prop's vertical centre axis through `at`, turned back into the prop frame. */
function localOffset(point: readonly number[], site: TestSite): readonly [number, number] {
  const angle = (site.yaw * Math.PI) / 180;
  const [dx, dz] = [(point[0] ?? 0) - site.at[0], (point[2] ?? 0) - site.at[1]];
  return [dx * Math.cos(angle) - dz * Math.sin(angle), dx * Math.sin(angle) + dz * Math.cos(angle)];
}

/**
 * Whether the slab's +Z face looks outward by the format's meaning: a top faces up, a hanging
 * slab down, a partition along local +Z, and any other panel away from the centre axis.
 */
function looksOutward(kind: string, slab: PropSlab, site: TestSite): boolean {
  const box = slabBox(slab.slab);
  const [nx, ny, nz] = box.axes[2];
  if (kind === "light-strip") {
    return ny < -0.999999;
  }
  const [lx, lz] = localOffset([nx + site.at[0], 0, nz + site.at[1]], site);
  if (kind === "partition") {
    return lz > 0.999999;
  }
  if (Math.abs(ny) > 0.999999) {
    return ny > 0;
  }
  const [ox, oz] = localOffset(box.center, site);
  return lx * ox + lz * oz > 1e-6;
}

const ALL: readonly Corner[] = [
  ...CONVEYORS,
  ...ENCLOSURES,
  ...ENCLOSURE_THRESHOLDS,
  ...CONTAINERS,
  ...CRATES,
  ...PARTITIONS,
  ...LIGHT_STRIPS,
];

describe("every kind at every corner and split threshold", () => {
  for (const corner of ALL) {
    const name = `${corner.kind} ${JSON.stringify(corner.params)}`;
    test(name, () => {
      for (const site of [ORIGIN, ODD_SITE]) {
        const slabs = expanded(corner.kind, { ...corner.params, color: COLOR }, site);
        expect(slabs.length).toBe(corner.count);
        const rounded = roundedSlabs(corner, site);
        expect(admitSlabs([{ id: "p", slabs: rounded }])).toEqual([]);
        expect(deepestEntry(rounded)).toBeLessThanOrEqual(CONTACT);
        expect(slabs.every((slab) => looksOutward(corner.kind, slab, site))).toBe(true);
        const hang = corner.kind === "light-strip" ? Number(corner.params.height) : 0;
        expect(lowestPoint(slabs.map((s) => s.slab))).toBeCloseTo(site.floor + hang, 9);
      }
    });
  }
});
