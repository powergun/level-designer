import { describe, expect, test } from "bun:test";
import { seedOfId } from "@level-designer/level-format";
import { expanded, expandedProp, ORIGIN, propOf } from "./fixtures.ts";
import type { Params } from "./fixtures.ts";
import { edgeBiased, seeded } from "./sample.ts";

// Owner: prop-kit's paint of a slab: its number, its wear and its seed from the prop's seed and
// the slab's index.

const DARK = "#3b4046";

/** The largest seed, the lattice hash's range. */
const MAX_SEED = 4095;

/** The prop with the most slabs, 22: a bridge crane whose runway and girder webs split. */
const LONGEST: Params = { span: 30, travel: 60, railHeight: 15.5, color: DARK };

/** The slab seeds of the longest bridge crane with the given id and parameters. */
function seedsOf(params: Params, id = "p"): number[] {
  const prop = propOf("bridge-crane", { ...LONGEST, ...params }, ORIGIN, id);
  return expandedProp(prop, 0).map((s) => s.slab.seed);
}

/** Asserts that the seeds are whole, in 0 to 4,095, and all different. */
function expectDistinctSeeds(seeds: readonly number[]): void {
  for (const seed of seeds) {
    expect(Number.isInteger(seed)).toBe(true);
    expect(seed).toBeGreaterThanOrEqual(0);
    expect(seed).toBeLessThanOrEqual(MAX_SEED);
  }
  expect(new Set(seeds).size).toBe(seeds.length);
}

describe("the slab seed", () => {
  test("one prop's slabs carry different seeds in range at the seed's corners", () => {
    for (const seed of [0, 1, MAX_SEED - 1, MAX_SEED]) {
      const seeds = seedsOf({ seed });
      expect(seeds.length).toBe(22);
      expectDistinctSeeds(seeds);
    }
  });

  test("a seeded, edge-biased sample of prop seeds keeps every prop's slab seeds apart", () => {
    const next = seeded(20261118);
    for (let i = 0; i < 400; i += 1) {
      const seed = Math.round(edgeBiased(next, [0, MAX_SEED]));
      expectDistinctSeeds(seedsOf({ seed }));
    }
  });

  test("the slab seeds are stable for the prop's seed and differ between seeds", () => {
    const stated = seedsOf({ seed: 77 }, "crane-a");
    expect(seedsOf({ seed: 77 }, "crane-b")).toEqual(stated);
    expect(seedsOf({ seed: 78 }, "crane-a")).not.toEqual(stated);
  });

  test("a prop without a seed takes the hash of its id", () => {
    for (const id of ["crane-a", "bay-3-crane"]) {
      expect(seedsOf({}, id)).toEqual(seedsOf({ seed: seedOfId(id) }, id));
    }
  });
});

describe("the slab's number and wear", () => {
  test("every slab carries number 0 and the prop's wear, 0.3 by default", () => {
    for (const [params, wear] of [
      [{}, 0.3],
      [{ wear: 0 }, 0],
      [{ wear: 1 }, 1],
    ] as const) {
      const slabs = expanded("enclosure", {
        width: 3,
        length: 2,
        color: DARK,
        glow: "cyan",
        ...params,
      });
      expect(slabs.length).toBe(7);
      for (const s of slabs) {
        expect(s.slab.number).toBe(0);
        expect(s.slab.wear).toBe(wear);
      }
    }
  });
});
