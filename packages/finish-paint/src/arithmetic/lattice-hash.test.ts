import { describe, expect, test } from "bun:test";
import { latticeHash, numberArithmetic } from "./index.js";

/** The lattice hash of one cell on the number back end. */
function hashOf(x: number, y: number, z: number): number {
  return latticeHash(numberArithmetic, x, y, z);
}

describe("the lattice hash", () => {
  test("returns Wall Lab's hash31 at stated cells", () => {
    // hash31: p = fract(c * 0.1031); p += dot(p, p.zyx + 31.32); fract((p.x + p.y) * p.z).
    // (0, 0, 0): p = 0, the dot is 0, so the hash is 0.
    expect(hashOf(0, 0, 0)).toBe(0);
    // (1, 0, 0): p = (0.1031, 0, 0); dot = 0.1031 * 31.32 = 3.229092;
    // p = (3.332192, 3.229092, 3.229092); 6.561284 * 3.229092 = 21.18699, fract 0.18699.
    expect(hashOf(1, 0, 0)).toBeCloseTo(0.18699, 4);
    // (0, 1, 0): dot = 0.1031 * 31.4231 = 3.239722; (3.239722 + 3.342822) * 3.239722.
    expect(hashOf(0, 1, 0)).toBeCloseTo(0.32561, 4);
    // (0, 0, 1), the seed alone: dot = 0.1031 * 31.32 = 3.229092; 6.458184 * 3.332192.
    expect(hashOf(0, 0, 1)).toBeCloseTo(0.51991, 4);
    // (3, 2, 17): p = (0.3093, 0.2062, 0.7527); dot = 40.228; 80.972 * 40.981 = 3318.295.
    // At 3,318 one 32-bit step is 2.4e-4, so the hash holds two places there.
    expect(hashOf(3, 2, 17)).toBeCloseTo(0.295, 2);
  });

  test("the 4,096 seeds give 4,096 different rows of eight cells", () => {
    const rows = new Set<string>();
    for (let seed = 0; seed < 4096; seed += 1) {
      const row = Array.from({ length: 8 }, (_, i) => hashOf(i, 0, seed));
      rows.add(row.join(","));
    }
    expect(rows.size).toBe(4096);
  });
});
