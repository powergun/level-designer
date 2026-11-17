import { describe, expect, test } from "bun:test";
import { slabBox } from "@level-designer/level-format";
import type { PropSlab } from "@level-designer/prop-kit";
import { expectSides, expectSound, grid, localOffset } from "./checks.ts";
import type { Side } from "./checks.ts";
import { ODD_SITE, ORIGIN } from "./fixtures.ts";
import type { Params, TestSite } from "./fixtures.ts";

// Owner: prop-kit's robot-arm kind. The range proof follows the rule-corner retro: corners, a
// coarse grid and a seeded edge-biased sample, all held to the same checks.

/** The arm's ranges as the format states them. */
const RANGES = { reach: [1.5, 3.5], shoulder: [30, 90], elbow: [60, 160] } as const;

/** The float tolerance of the kit's own unrounded geometry. */
const FLOAT = 1e-9;

/** The slab indices of the four thick slabs: shoulder, upper arm, forearm and head. */
const LINKS = [5, 6, 7, 8] as const;

/** The stated sides: the pedestal's top and walls, then the four thick slabs and the accent. */
const SIDES: readonly Side[] = ["up", "+X", "-X", "+Z", "-Z", "+X", "+X", "+X", "+X", "+X"];

/** The local x of the slab's corners as an interval, before rounding. */
function localX(slab: PropSlab | undefined, site: TestSite): readonly [number, number] {
  const xs =
    slab === undefined ? [] : slabBox(slab.slab).corners.map((c) => localOffset(c, site)[0]);
  return [Math.min(...xs), Math.max(...xs)];
}

/**
 * The pedestal's side planes, read from the same expansion: the outer faces of its -X side
 * (slab 2) and its +X side (slab 1).
 */
function sidePlanes(slabs: readonly PropSlab[], site: TestSite): readonly [number, number] {
  return [localX(slabs[2], site)[0], localX(slabs[1], site)[1]];
}

/**
 * Checks one pose on one site: the shared promises with 9 or 10 slabs standing on the floor, the
 * stated sides, and every corner of the four thick slabs, as the kit places them before rounding,
 * above the floor and between the pedestal's side planes.
 */
function checkPose(pose: Params, site: TestSite): void {
  const count = pose.glow === undefined ? 9 : 10;
  const slabs = expectSound("robot-arm", pose, site, { count, low: 0 });
  expectSides(slabs, site, SIDES.slice(0, count));
  const planes = sidePlanes(slabs, site);
  const links = LINKS.map((k) => slabs[k]).filter((s): s is PropSlab => s !== undefined);
  expect(links.length).toBe(LINKS.length);
  for (const link of links) {
    for (const corner of slabBox(link.slab).corners) {
      expect(corner[1]).toBeGreaterThan(site.floor);
      const x = localOffset(corner, site)[0];
      expect(x).toBeGreaterThanOrEqual(planes[0] - FLOAT);
      expect(x).toBeLessThanOrEqual(planes[1] + FLOAT);
    }
  }
}

/** A seeded generator of numbers in [0, 1): mulberry32, so every run draws the same sample. */
function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A value of the range: its minimum a quarter of the time, its maximum a quarter, else uniform. */
function edgeBiased(next: () => number, [min, max]: readonly [number, number]): number {
  const pick = next();
  if (pick < 0.25) return min;
  if (pick < 0.5) return max;
  return min + (max - min) * next();
}

/** The values from `min` to `max` in steps of `step`, both ends included. */
function steps([min, max]: readonly [number, number], step: number): number[] {
  return Array.from({ length: Math.round((max - min) / step) + 1 }, (_, k) => min + k * step);
}

describe("robot-arm", () => {
  test("every corner of reach, shoulder, elbow and glow, on both sites", () => {
    const corners = grid({ ...RANGES, glow: [undefined, "cyan"] });
    for (const corner of corners) {
      for (const site of [ORIGIN, ODD_SITE]) checkPose(corner, site);
    }
  });

  test("a grid of shoulder and elbow every 10 degrees at three reaches, with a glow", () => {
    const shoulder = steps(RANGES.shoulder, 10);
    const elbow = steps(RANGES.elbow, 10);
    for (const pose of grid({ reach: [1.5, 2.5, 3.5], shoulder, elbow, glow: ["amber"] })) {
      checkPose(pose, ODD_SITE);
    }
  });

  test("a seeded, edge-biased sample of reach, shoulder and elbow at random sites", () => {
    const next = seeded(20261117);
    for (let i = 0; i < 600; i += 1) {
      const pose: Params = {
        reach: edgeBiased(next, RANGES.reach),
        shoulder: edgeBiased(next, RANGES.shoulder),
        elbow: edgeBiased(next, RANGES.elbow),
        ...(next() < 0.5 ? { glow: "cyan" } : {}),
      };
      const site: TestSite = {
        at: [next() * 40 - 20, next() * 40 - 20],
        yaw: next() * 360,
        floor: next() < 0.5 ? 0 : 0.3241,
      };
      checkPose(pose, site);
    }
  });
});
