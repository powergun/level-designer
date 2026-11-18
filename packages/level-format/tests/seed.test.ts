import { describe, expect, test } from "bun:test";
import { MAX_SEED, seedOfId } from "@level-designer/level-format";

/** Ids `<prefix>0` to `<prefix>4095`, a prop kind's numbering pattern. */
function numberedIds(prefix: string): string[] {
  return Array.from({ length: MAX_SEED + 1 }, (_, i) => `${prefix}${i}`);
}

describe("seedOfId", () => {
  test("is stable: a seed sets a look, so these values never change", () => {
    // Computed in BigInt arithmetic, apart from the source: FNV-1a 32, Murmur3's finaliser.
    expect(seedOfId("a")).toBe(424);
    expect(seedOfId("crate-1")).toBe(3400);
    expect(seedOfId("crate-2")).toBe(2012);
    expect(seedOfId("housing-west-3")).toBe(3838);
    expect(seedOfId(`a${"b".repeat(47)}`)).toBe(3079);
  });

  test("lies in 0 to 4,095 as an integer for one-letter, longest and numbered ids", () => {
    const ids = [
      ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(97 + i)),
      `z${"9".repeat(47)}`,
      ...numberedIds("prop-"),
      ...numberedIds("x"),
    ];
    for (const id of ids) {
      const seed = seedOfId(id);
      expect(Number.isInteger(seed) && seed >= 0 && seed <= MAX_SEED).toBe(true);
    }
  });

  test("spreads ids that differ in their last characters like random seeds", () => {
    // 4,096 random draws from 4,096 values give about 2,589 distinct ones.
    for (const prefix of ["prop-", "crate-", "housing-west-"]) {
      expect(new Set(numberedIds(prefix).map(seedOfId)).size).toBeGreaterThan(2500);
    }
  });
});
