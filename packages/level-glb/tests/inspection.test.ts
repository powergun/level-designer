import { describe, expect, test } from "bun:test";
import type { SealBox, WorldTriangles } from "@level-designer/level-glb";
import {
  assembleLevelScene,
  assembleStaticScene,
  inspectGlb,
  readWorldTriangles,
} from "@level-designer/level-glb";
import type { GltfDocument } from "../src/container/index.js";
import { readGlb, writeGlb } from "../src/container/index.js";
import { LOOKS, PROPS } from "./fixtures.js";
import { SYNTHETIC_COLOR, syntheticBase } from "./synthetic-glb.js";

// Owner: level-glb's inspection unit, on hand-built files with hand-computed expectations.

/** A seal box off every axis, so each corner coordinate is distinct. */
const SEAL: SealBox = {
  id: "slot",
  min: [1, 2, 3],
  max: [2, 4, 7],
  color: "#ff8000",
  metalness: 0,
  roughness: 1,
};

/** The static scene of the synthetic base at scale 2 with the one seal. */
function staticScene(): Uint8Array {
  const built = assembleStaticScene(
    syntheticBase(true),
    { scale: 2, materials: new Map(), doubleSided: [] },
    [SEAL],
  );
  if (!built.ok) throw new Error("the synthetic look names nothing");
  return built.glb;
}

/** The synthetic base with a material, its document rewritten by `change`. */
function rewrittenBase(change: (document: GltfDocument) => GltfDocument): Uint8Array {
  const { document, bin } = readGlb(syntheticBase(true));
  return writeGlb(change(document), bin);
}

/** The document with every material emissive green at strength 0. */
function withoutStrength(document: GltfDocument): GltfDocument {
  const materials = (document.materials ?? []).map((material) => ({
    ...material,
    emissiveFactor: [0, 1, 0],
    extensions: { KHR_materials_emissive_strength: { emissiveStrength: 0 } },
  }));
  return { ...document, materials };
}

/** The corners and colour of triangle `t`. */
function triangle(triangles: WorldTriangles, t: number) {
  const corner = (k: number): number[] => [
    ...triangles.positions.subarray(t * 9 + k * 3, t * 9 + k * 3 + 3),
  ];
  return {
    corners: [corner(0), corner(1), corner(2)],
    color: [...triangles.colors.subarray(t * 3, t * 3 + 3)],
  };
}

/** Evidence of outward winding: the face normal (b - a) x (c - a) points away from the centre. */
function outwardness(corners: readonly number[][], centre: readonly number[]): number {
  const [a = [], b = [], c = []] = corners;
  const u = [0, 1, 2].map((i) => (b[i] ?? 0) - (a[i] ?? 0));
  const v = [0, 1, 2].map((i) => (c[i] ?? 0) - (a[i] ?? 0));
  const n = [0, 1, 2].map((i) => {
    const [j, k] = [(i + 1) % 3, (i + 2) % 3];
    return (u[j] ?? 0) * (v[k] ?? 0) - (u[k] ?? 0) * (v[j] ?? 0);
  });
  const toFace = [0, 1, 2].map(
    (i) => ((a[i] ?? 0) + (b[i] ?? 0) + (c[i] ?? 0)) / 3 - (centre[i] ?? 0),
  );
  return n.reduce((sum, value, i) => sum + value * (toFace[i] ?? 0), 0);
}

describe("inspection", () => {
  test("reports a primitive without a material by its mesh name", () => {
    expect(inspectGlb(syntheticBase(false))).toEqual({
      triangles: 1,
      primitivesWithoutMaterial: ["floor"],
      images: 0,
    });
    expect(inspectGlb(syntheticBase(true)).primitivesWithoutMaterial).toEqual([]);
  });
});

test("the reader refuses a GLB with two buffers", () => {
  const twoBuffers = rewrittenBase((document) => ({
    ...document,
    buffers: [...document.buffers, { byteLength: 0 }],
  }));
  expect(() => inspectGlb(twoBuffers)).toThrow("exactly one buffer");
});

describe("world triangles", () => {
  test("keep the base colour of an emissive material at strength 0", () => {
    const dark = rewrittenBase(withoutStrength);
    expect(triangle(readWorldTriangles(dark), 0).color).toEqual([...SYNTHETIC_COLOR]);
  });

  test("compose the stage scale over the base node matrices, with the material colour", () => {
    const triangles = readWorldTriangles(staticScene());
    expect(triangles.positions).toHaveLength((1 + 12) * 9);
    // floor_0 moves the triangle +10 m in x, and stage scales by 2.
    expect(triangle(triangles, 0).corners).toEqual([
      [20, 0, 0],
      [22, 0, 0],
      [20, 2, 0],
    ]);
    expect(triangle(triangles, 0).color).toEqual([...SYNTHETIC_COLOR]);
  });

  test("place a seal's 12 triangles on its box, wound outward, in its linear colour", () => {
    const triangles = readWorldTriangles(staticScene());
    const centre = [1.5, 3, 5];
    const corners = new Set<string>();
    for (let t = 1; t <= 12; t++) {
      const { corners: points, color } = triangle(triangles, t);
      for (const point of points) {
        point.forEach((value, axis) => expect([SEAL.min[axis], SEAL.max[axis]]).toContain(value));
        corners.add(point.join(","));
      }
      expect(outwardness(points, centre)).toBeGreaterThan(0);
      expect(color[0]).toBe(1);
      expect(color[1]).toBeCloseTo(0.2158605, 6);
      expect(color[2]).toBe(0);
    }
    expect(corners.size).toBe(8);
  });

  test("give a slab its vertex colour, a lit glowing slab its glow colour and an unlit one its vertex colour", () => {
    const triangles = readWorldTriangles(assembleLevelScene(staticScene(), PROPS, LOOKS));
    expect(triangles.positions).toHaveLength((1 + 12 + 14) * 9);
    // After the floor and the seal: two crate slabs, then the lamp's lit glowing strip, its
    // unlit glowing housing and its plain lit strip, then the sign's unlit glowing housing.
    expect(triangle(triangles, 13).corners).toEqual([
      [0, 0, 1],
      [1, 0, 1],
      [1, 1, 1],
    ]);
    const colors = [13, 15, 17, 19, 21, 23].map((t) => triangle(triangles, t).color);
    const expected = [
      [0.5, 0.3, 0.1],
      [0.5, 0.3, 0.1],
      [0, 0.8, 1],
      [0.2, 0.2, 0.2],
      [0.2, 0.2, 0.2],
      [0.4, 0.1, 0.1],
    ];
    for (const [at, color] of colors.entries()) {
      color.forEach((value, channel) =>
        expect(value).toBeCloseTo(expected[at]?.[channel] ?? -1, 6),
      );
    }
  });
});
