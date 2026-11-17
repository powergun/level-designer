import { expect } from "bun:test";
import { admitSlabs, roundSlab, slabBox } from "@level-designer/level-format";
import type { Slab, Vec3 } from "@level-designer/level-format";
import type { PropSlab } from "@level-designer/prop-kit";
import { expanded } from "./fixtures.ts";
import type { Params, TestSite } from "./fixtures.ts";
import { deepestEntry, lowestPoint } from "./geometry.ts";

/** The contact the `overlap` rule lets through, in metres. */
const CONTACT = 0.001;

/** The least height a slab tops out at above the floor under `at`, by the format's rule. */
const LEAST_TOP = 0.55;

/** The format's unit tolerance of a quaternion's length. */
const UNIT = 0.000001;

/** The colour every soundness case paints its props. */
const COLOR = "#3b4046";

/** What a case states of its expansion: the slab count and the lowest point's height above the floor. */
export interface Stated {
  readonly count: number;
  readonly low: number;
}

/** A point of the level frame turned back into the prop frame of the site: its local `[x, z]`. */
export function localOffset(point: Vec3, site: TestSite): readonly [number, number] {
  const angle = (site.yaw * Math.PI) / 180;
  const [dx, dz] = [point[0] - site.at[0], point[2] - site.at[1]];
  return [dx * Math.cos(angle) - dz * Math.sin(angle), dx * Math.sin(angle) + dz * Math.cos(angle)];
}

/** Where the slab's +Z face looks, as a direction of the prop frame. */
export function localNormal(slab: Slab, site: TestSite): Vec3 {
  const [nx, ny, nz] = slabBox(slab).axes[2];
  const [lx, lz] = localOffset([nx + site.at[0], 0, nz + site.at[1]], site);
  return [lx, ny, lz];
}

/** The highest world height any corner of the slab reaches. */
function topOf(slab: Slab): number {
  return Math.max(...slabBox(slab).corners.map((corner) => corner[1]));
}

/**
 * Expands a prop on a site and checks the format's sound-slab promises: the stated slab count;
 * on the rounded slabs, the slab admission, entries of at most 1 mm, unit rotations and tops at
 * 0.55 m or higher; and the lowest point at the stated height. Returns the unrounded slabs.
 */
export function expectSound(
  kind: string,
  params: Params,
  site: TestSite,
  stated: Stated,
): PropSlab[] {
  const slabs = expanded(kind, { color: COLOR, ...params }, site);
  expect(slabs.length).toBe(stated.count);
  const rounded = slabs.map((s) => roundSlab(s.slab));
  expect(admitSlabs([{ id: "p", slabs: rounded }])).toEqual([]);
  expect(deepestEntry(rounded)).toBeLessThanOrEqual(CONTACT);
  for (const slab of rounded) {
    expect(Math.abs(Math.hypot(...slab.rotation) - 1)).toBeLessThanOrEqual(UNIT);
    expect(topOf(slab) - site.floor).toBeGreaterThanOrEqual(LEAST_TOP);
  }
  expect(lowestPoint(slabs.map((s) => s.slab))).toBeCloseTo(site.floor + stated.low, 9);
  return slabs;
}

/** Every combination of the listed values, one params record per combination. */
export function grid(axes: Readonly<Record<string, readonly unknown[]>>): Params[] {
  return Object.entries(axes).reduce<Params[]>(
    (combos, [name, values]) =>
      combos.flatMap((combo) => values.map((value) => ({ ...combo, [name]: value }))),
    [{}],
  );
}

/** The six side names a kind gives its slabs, as directions of the prop frame. */
const SIDES = {
  "+X": [1, 0, 0],
  "-X": [-1, 0, 0],
  "+Z": [0, 0, 1],
  "-Z": [0, 0, -1],
  up: [0, 1, 0],
  down: [0, -1, 0],
} as const satisfies Readonly<Record<string, Vec3>>;

/** A side name of a slab's +Z face. */
export type Side = keyof typeof SIDES;

/** Asserts that each slab's +Z face looks to its stated side, in slab order. */
export function expectSides(
  slabs: readonly PropSlab[],
  site: TestSite,
  sides: readonly Side[],
): void {
  expect(slabs.length).toBe(sides.length);
  slabs.forEach((s, k) => {
    const normal = localNormal(s.slab, site);
    const want = SIDES[sides[k] ?? "up"];
    normal.forEach((value, axis) => expect(value).toBeCloseTo(want[axis] ?? 0, 9));
  });
}
