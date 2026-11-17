import { describe, expect, test } from "bun:test";
import { roundSlab, slabBox } from "@level-designer/level-format";
import type { PropSlab } from "@level-designer/prop-kit";
import { expectSides, expectSound, grid, localOffset } from "./checks.ts";
import type { Side } from "./checks.ts";
import { expanded, ODD_SITE, ORIGIN } from "./fixtures.ts";
import type { Params, TestSite } from "./fixtures.ts";
import { lowestPoint } from "./geometry.ts";

// Owner: prop-kit's bridge-crane and jib-crane kinds at every parameter corner.

/** The least height of a hanging part's underside above the floor under `at`, by the format. */
const LEAST_HANG = 2.5;

/** How far a bridge crane may rise above `railHeight`, by the format. */
const MAX_RISE = 2.4;

/** The longest side the slab admission accepts. */
const MAX_SIDE = 40;

/** The float tolerance of a rounded height that lies on the grid. */
const FLOAT = 1e-9;

/** A bridge crane's stated sides; each of the first four, the runway roles, repeats per run. */
function bridgeSides(runs: number): Side[] {
  const runway: Side[] = ["-X", "down", "+X", "down"];
  const rest: Side[] = ["-X", "+X", "+Z", "down", "-Z", "down", "up", "+X", "-X", "+Z", "-Z", "+Z"];
  return [...runway.flatMap((side) => Array<Side>(runs).fill(side)), ...rest];
}

/** A jib crane's stated sides: plinth, mast, web, flange, tie and hoist. */
const JIB_SIDES: readonly Side[] = ["up", "+X", "-X", "+Z", "-Z", "+X", "down", "+X", "+X"];

/** The world heights the rounded slabs span above the floor: lowest and highest corner. */
function heights(slabs: readonly PropSlab[], site: TestSite): readonly [number, number] {
  const ys = slabs.flatMap((s) => slabBox(roundSlab(s.slab)).corners.map((corner) => corner[1]));
  return [Math.min(...ys) - site.floor, Math.max(...ys) - site.floor];
}

/** The largest `hookDrop` the format admits at a rail height. */
function largestDrop(railHeight: number): number {
  return Math.min(8, railHeight - LEAST_HANG);
}

/** The local x (axis 0) or z (axis 1) interval that the slabs' corners cover, before rounding. */
function localSpan(
  slabs: readonly PropSlab[],
  site: TestSite,
  axis: 0 | 1,
): readonly [number, number] {
  const values = slabs.flatMap((s) =>
    slabBox(s.slab).corners.map((corner) => localOffset(corner, site)[axis]),
  );
  return [Math.min(...values), Math.max(...values)];
}

/**
 * Checks the bridge crane's two mappings, reading each part from the expansion in slab order:
 * the end trucks stay on the runway and end flush with it at `bridgeAt` 0 and 1; the trolley
 * stays between the trucks' inner faces and touches one at `trolleyAt` 0 and 1.
 */
function expectMappings(
  slabs: readonly PropSlab[],
  site: TestSite,
  runs: number,
  params: Params,
): void {
  const runway = localSpan(slabs.slice(0, 4 * runs), site, 1);
  const plusTruck = slabs.slice(4 * runs, 4 * runs + 1);
  const minusTruck = slabs.slice(4 * runs + 1, 4 * runs + 2);
  const trucks = localSpan([...plusTruck, ...minusTruck], site, 1);
  expect(trucks[0]).toBeGreaterThanOrEqual(runway[0] - FLOAT);
  expect(trucks[1]).toBeLessThanOrEqual(runway[1] + FLOAT);
  if (params.bridgeAt === 0) expect(trucks[0]).toBeCloseTo(runway[0], 9);
  if (params.bridgeAt === 1) expect(trucks[1]).toBeCloseTo(runway[1], 9);
  const inner: readonly [number, number] = [
    localSpan(minusTruck, site, 0)[1],
    localSpan(plusTruck, site, 0)[0],
  ];
  const trolley = localSpan(slabs.slice(4 * runs + 6, 4 * runs + 11), site, 0);
  expect(trolley[0]).toBeGreaterThanOrEqual(inner[0] - FLOAT);
  expect(trolley[1]).toBeLessThanOrEqual(inner[1] + FLOAT);
  if (params.trolleyAt === 0) expect(trolley[0]).toBeCloseTo(inner[0], 9);
  if (params.trolleyAt === 1) expect(trolley[1]).toBeCloseTo(inner[1], 9);
}

/**
 * Checks one bridge crane on one site: the shared promises with 16 slabs, 20 above a travel of
 * 40 m, hanging at `railHeight - hookDrop`; the stated sides; a hook at least 2.5 m up; a top
 * at most 2.4 m above `railHeight`; and the two mappings.
 */
function checkBridge(params: Params, site: TestSite): PropSlab[] {
  const runs = Number(params.travel) > MAX_SIDE ? 2 : 1;
  const low = Number(params.railHeight) - Number(params.hookDrop);
  const slabs = expectSound("bridge-crane", params, site, { count: 12 + 4 * runs, low });
  expectSides(slabs, site, bridgeSides(runs));
  const [bottom, top] = heights(slabs, site);
  expect(bottom).toBeGreaterThanOrEqual(LEAST_HANG - FLOAT);
  expect(top).toBeLessThanOrEqual(Number(params.railHeight) + MAX_RISE + FLOAT);
  expectMappings(slabs, site, runs, params);
  return slabs;
}

describe("bridge-crane", () => {
  test("all 64 corners of the six ranges, hookDrop at 0.5 and its largest, on both sites", () => {
    const ranges = { span: [10, 30], travel: [10, 60], railHeight: [6, 15.5] };
    const corners = grid({ ...ranges, bridgeAt: [0, 1], trolleyAt: [0, 1] });
    expect(corners.length).toBe(32);
    for (const corner of corners) {
      for (const hookDrop of [0.5, largestDrop(Number(corner.railHeight))]) {
        for (const site of [ORIGIN, ODD_SITE]) checkBridge({ ...corner, hookDrop }, site);
      }
    }
  });

  test("hookDrop 3.6 at railHeight 6.1, typed at its limit, hangs 2.5 m up", () => {
    const params = { span: 12, travel: 20, railHeight: 6.1, hookDrop: 3.6 };
    for (const site of [ORIGIN, ODD_SITE]) checkBridge(params, site);
  });

  test("a runway splits above 40 m into runs of at most 40 m", () => {
    const counts = [40, 40.0001, 60].map((travel) => {
      const slabs = expanded("bridge-crane", { span: 10, travel, railHeight: 8, color: "#3b4046" });
      return slabs.length;
    });
    expect(counts).toEqual([16, 20, 20]);
    const runway = expanded("bridge-crane", {
      span: 10,
      travel: 60,
      railHeight: 8,
      color: "#3b4046",
    }).slice(0, 8);
    for (const run of runway) {
      expect(Math.max(...roundSlab(run.slab).size)).toBeLessThanOrEqual(MAX_SIDE);
    }
  });
});

describe("jib-crane", () => {
  test("every corner of height and boom on both sites; at height 3 the hoist hangs 2.5 m up", () => {
    for (const corner of grid({ height: [3, 8], boom: [2, 8] })) {
      for (const site of [ORIGIN, ODD_SITE]) {
        const slabs = expectSound("jib-crane", corner, site, { count: 9, low: 0 });
        expectSides(slabs, site, JIB_SIDES);
        const hoist = slabs.at(-1)?.slab;
        expect(hoist).toBeDefined();
        const underside = hoist === undefined ? 0 : lowestPoint([roundSlab(hoist)]);
        expect(underside - site.floor).toBeGreaterThanOrEqual(LEAST_HANG - FLOAT);
      }
    }
  });
});
