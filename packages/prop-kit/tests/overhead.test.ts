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

/** The largest face the slab admission accepts, in m2. */
const MAX_FACE = 25;

/** A girder web's height and the end trucks' width, which the web runs between. */
const [GIRDER_WEB, TRUCK_WIDTH] = [1.25, 0.3];

/** How many runs a bridge crane's runway roles and girder webs take at its parameters. */
function bridgeRuns(params: Params): { readonly runway: number; readonly girder: number } {
  const runway = Number(params.travel) > MAX_SIDE ? 2 : 1;
  const girder = (Number(params.span) - TRUCK_WIDTH) * GIRDER_WEB > MAX_FACE ? 2 : 1;
  return { runway, girder };
}

/** The float tolerance of a rounded height that lies on the grid. */
const FLOAT = 1e-9;

/** Each side repeated `count` times, in order. */
function repeat(sides: readonly Side[], count: number): Side[] {
  return sides.flatMap((side) => Array<Side>(count).fill(side));
}

/** A bridge crane's stated sides; the runway roles and the girder webs repeat per run. */
function bridgeSides(runs: { readonly runway: number; readonly girder: number }): Side[] {
  return [
    ...repeat(["-X", "down", "+X", "down"], runs.runway),
    "-X",
    "+X",
    ...repeat(["+Z"], runs.girder),
    "down",
    ...repeat(["-Z"], runs.girder),
    "down",
    ...(["up", "+X", "-X", "+Z", "-Z", "+Z"] as const),
  ];
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
function expectMappings(slabs: readonly PropSlab[], site: TestSite, params: Params): void {
  const runs = bridgeRuns(params);
  const trucksAt = 4 * runs.runway;
  const runway = localSpan(slabs.slice(0, trucksAt), site, 1);
  const plusTruck = slabs.slice(trucksAt, trucksAt + 1);
  const minusTruck = slabs.slice(trucksAt + 1, trucksAt + 2);
  const trucks = localSpan([...plusTruck, ...minusTruck], site, 1);
  expect(trucks[0]).toBeGreaterThanOrEqual(runway[0] - FLOAT);
  expect(trucks[1]).toBeLessThanOrEqual(runway[1] + FLOAT);
  if (params.bridgeAt === 0) expect(trucks[0]).toBeCloseTo(runway[0], 9);
  if (params.bridgeAt === 1) expect(trucks[1]).toBeCloseTo(runway[1], 9);
  const inner: readonly [number, number] = [
    localSpan(minusTruck, site, 0)[1],
    localSpan(plusTruck, site, 0)[0],
  ];
  const trolleyAt = trucksAt + 4 + 2 * runs.girder;
  const trolley = localSpan(slabs.slice(trolleyAt, trolleyAt + 5), site, 0);
  expect(trolley[0]).toBeGreaterThanOrEqual(inner[0] - FLOAT);
  expect(trolley[1]).toBeLessThanOrEqual(inner[1] + FLOAT);
  if (params.trolleyAt === 0) expect(trolley[0]).toBeCloseTo(inner[0], 9);
  if (params.trolleyAt === 1) expect(trolley[1]).toBeCloseTo(inner[1], 9);
}

/**
 * Checks one bridge crane on one site: the shared promises with 16 slabs, two more above a span
 * of 20.3 m and four more above a travel of 40 m, hanging at `railHeight - hookDrop`; the stated sides; a hook at least 2.5 m up; a top
 * at most 2.4 m above `railHeight`; and the two mappings.
 */
function checkBridge(params: Params, site: TestSite): PropSlab[] {
  const runs = bridgeRuns(params);
  const low = Number(params.railHeight) - Number(params.hookDrop);
  const count = 10 + 4 * runs.runway + 2 * runs.girder;
  const slabs = expectSound("bridge-crane", params, site, { count, low });
  expectSides(slabs, site, bridgeSides(runs));
  const [bottom, top] = heights(slabs, site);
  expect(bottom).toBeGreaterThanOrEqual(LEAST_HANG - FLOAT);
  expect(top).toBeLessThanOrEqual(Number(params.railHeight) + MAX_RISE + FLOAT);
  expectMappings(slabs, site, params);
  return slabs;
}

describe("bridge-crane", () => {
  test("all corners of the six ranges and the girder's split span, hookDrop at 0.5 and its largest, on both sites", () => {
    const spans = [10, 20.3, 20.3001, 30];
    const ranges = { span: spans, travel: [10, 60], railHeight: [6, 15.5] };
    const corners = grid({ ...ranges, bridgeAt: [0, 1], trolleyAt: [0, 1] });
    expect(corners.length).toBe(64);
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

/** A bridge crane of the given span, with a short travel that keeps its runways whole. */
function craneOfSpan(span: number): PropSlab[] {
  return expanded("bridge-crane", { span, travel: 10, railHeight: 8, color: "#3b4046" });
}

describe("the deeper girder", () => {
  test("a girder web splits in two above a span of 20.3 m, its face at most 25 m2", () => {
    expect([20.2999, 20.3, 20.3001, 30].map((span) => craneOfSpan(span).length)).toEqual([
      16, 16, 18, 18,
    ]);
    const webs = craneOfSpan(30).filter((s) => s.slab.finish === "beam/girder");
    expect(webs.length).toBe(4);
    for (const web of webs) {
      const [w, h] = roundSlab(web.slab).size;
      expect(h).toBeCloseTo(GIRDER_WEB, 9);
      expect(w * h).toBeLessThanOrEqual(MAX_FACE);
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
