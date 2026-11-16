import { describe, expect, test } from "bun:test";
import { slabBox } from "@level-designer/level-format";
import type { Quaternion, Slab, SlabBox, Vec3 } from "@level-designer/level-format";
import { buildSlabModel, meshSlab } from "@level-designer/slab-model";

/** A concrete slab of `size` at `position`, turned by `rotation`, coloured `color`. */
function slab(size: Vec3, position: Vec3 = [0, 0, 0], rotation: Quaternion = [0, 0, 0, 1]): Slab {
  return { size, material: "concrete", color: "#1a2430", position, rotation };
}

/** The unit quaternion along `q`. */
function unit(q: Quaternion): Quaternion {
  const length = Math.hypot(...q);
  return [q[0] / length, q[1] / length, q[2] / length, q[3] / length];
}

/** The dot product of two triples. */
function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/** The triple at index `i` of an xyz array. */
function triple(values: Float32Array, i: number): Vec3 {
  return [
    values[3 * i] ?? Number.NaN,
    values[3 * i + 1] ?? Number.NaN,
    values[3 * i + 2] ?? Number.NaN,
  ];
}

/** The linear value of an 8-bit sRGB channel, by the IEC transfer curve. */
function linearChannel(byte: number): number {
  const c = byte / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** The linear RGB of a `#rrggbb` colour. */
function linear(hex: string): Vec3 {
  const byte = (at: number): number => linearChannel(Number.parseInt(hex.slice(at, at + 2), 16));
  return [byte(1), byte(3), byte(5)];
}

/** The largest channel difference between two colours. */
function colorGap(a: Vec3, b: Vec3): number {
  return Math.max(...a.map((channel, i) => Math.abs(channel - (b[i] ?? Number.NaN))));
}

/** Which face of the slab a unit normal faces: `+Z`, `-Z` or one of the four edges. */
function faceOf(normal: Vec3, axes: readonly [Vec3, Vec3, Vec3]): string {
  const labels = ["X", "Y", "Z"];
  const index = axes.findIndex((axis) => Math.abs(Math.abs(dot(normal, axis)) - 1) < 1e-5);
  const axis = axes[index];
  if (axis === undefined) return "none";
  return `${dot(normal, axis) > 0 ? "+" : "-"}${labels[index]}`;
}

/** Every vertex colour of the mesh, grouped by the slab face its normal faces. */
function colorsByFace(subject: Slab): Map<string, Vec3[]> {
  const mesh = meshSlab(subject);
  const { axes } = slabBox(subject);
  const faces = new Map<string, Vec3[]>();
  for (let v = 0; v < mesh.positions.length / 3; v++) {
    const face = faceOf(triple(mesh.normals, v), axes);
    faces.set(face, [...(faces.get(face) ?? []), triple(mesh.colors, v)]);
  }
  return faces;
}

/** The geometric unit normal of the triangle at `t`, from its winding. */
function windingNormal(positions: Float32Array, indices: Uint32Array, t: number): Vec3 {
  const [a, b, c] = [0, 1, 2].map((k) => triple(positions, indices[3 * t + k] ?? -1));
  const u = [0, 1, 2].map((i) => (b?.[i] ?? 0) - (a?.[i] ?? 0));
  const w = [0, 1, 2].map((i) => (c?.[i] ?? 0) - (a?.[i] ?? 0));
  const [ux = 0, uy = 0, uz = 0] = u;
  const [wx = 0, wy = 0, wz = 0] = w;
  const n: Vec3 = [uy * wz - uz * wy, uz * wx - ux * wz, ux * wy - uy * wx];
  const length = Math.hypot(...n);
  return [n[0] / length, n[1] / length, n[2] / length];
}

/** The offset of the centroid of the triangle at `t` from the box centre. */
function outward(positions: Float32Array, indices: Uint32Array, t: number, box: SlabBox): Vec3 {
  const corners = [0, 1, 2].map((k) => triple(positions, indices[3 * t + k] ?? -1));
  const mean = (i: number): number =>
    corners.reduce((sum, p) => sum + (p[i] ?? 0), 0) / 3 - (box.center[i] ?? 0);
  return [mean(0), mean(1), mean(2)];
}

/** The lowest and highest offset of any vertex from the box centre along box axis `k`. */
function reachAlong(positions: Float32Array, box: SlabBox, k: number): readonly [number, number] {
  const axis = box.axes[k] ?? [0, 0, 0];
  const offsets = Array.from({ length: positions.length / 3 }, (_, v) => {
    const p = triple(positions, v);
    return dot([p[0] - box.center[0], p[1] - box.center[1], p[2] - box.center[2]], axis);
  });
  return [Math.min(...offsets), Math.max(...offsets)];
}

test("the shared builder gives each slab's model the slab's material", () => {
  const materials = ["wood", "brick", "concrete", "metal"] as const;
  const built = materials.map(
    (material) => buildSlabModel({ ...slab([1, 1, 0.05]), material }).materialId,
  );
  expect(built).toEqual([...materials]);
});

test("slabs mesh to destruction lib's measured intact triangle counts", () => {
  const cases: readonly (readonly [Vec3, number])[] = [
    [[1, 1, 0.05], 12],
    [[2, 1.2, 0.05], 20],
    [[4, 2.4, 0.05], 44],
    [[7, 3.2, 0.3], 92],
  ];
  const counts = cases.map(([size]) => meshSlab(slab(size)).indices.length / 3);
  expect(counts).toEqual(cases.map(([, triangles]) => triangles));
});

test("a dark slab shows its colour on +Z and the edges, and a light tint on -Z", () => {
  const subject = slab([2, 1.2, 0.05], [3, 4.5, -2], unit([0.3, -0.5, 0.2, -0.7]));
  const faces = colorsByFace(subject);
  expect([...faces.keys()].toSorted()).toEqual(["+X", "+Y", "+Z", "-X", "-Y", "-Z"]);
  const own = linear(subject.color);
  for (const face of ["+Z", "+X", "-X", "+Y", "-Y"]) {
    const gaps = (faces.get(face) ?? []).map((color) => colorGap(color, own));
    expect(Math.max(...gaps)).toBeLessThan(1e-6);
  }
  const back = faces.get("-Z") ?? [];
  const tint = back[0] ?? own;
  expect(Math.max(...back.map((color) => colorGap(color, tint)))).toBe(0);
  expect(tint.every((channel, i) => channel > (own[i] ?? 1))).toBe(true);
  expect(colorGap(tint, own)).toBeLessThan(colorGap(tint, [1, 1, 1]));
});

describe("the mesh of a rotated, lifted slab", () => {
  const corners: readonly Slab[] = [
    slab([0.02, 0.02, 0.02], [-30, 9.5, 41], unit([0.1, 0.9, -0.3, -0.2])),
    slab([40, 0.625, 0.02], [12.5, 9.5, -30], [1, 0, 0, 0]),
    slab([0.625, 40, 40], [-7, 3, 18], unit([0.4, 0.4, -0.6, 0.5])),
    slab([7, 3.2, 0.3], [0.5, 12, 0.5], unit([0, Math.SQRT1_2, 0, Math.SQRT1_2])),
  ];

  test.each(corners.map((subject) => [subject.size.join(" x "), subject] as const))(
    "%s m is indexed, wound outward along its normals and fills its box",
    (_size, subject) => {
      const mesh = meshSlab(subject);
      const vertices = mesh.positions.length / 3;
      expect(mesh.indices).toBeInstanceOf(Uint32Array);
      expect(mesh.indices.length).toBe(vertices);
      expect(mesh.indices.every((index) => index < vertices)).toBe(true);
      expect([mesh.normals.length, mesh.colors.length]).toEqual([3 * vertices, 3 * vertices]);
      const box = slabBox(subject);
      for (const [k, half] of box.halfExtents.entries()) {
        const [low, high] = reachAlong(mesh.positions, box, k);
        expect(low).toBeCloseTo(-half, 4);
        expect(high).toBeCloseTo(half, 4);
      }
      for (let t = 0; t < mesh.indices.length / 3; t++) {
        const normal = triple(mesh.normals, mesh.indices[3 * t] ?? -1);
        expect(Math.hypot(...normal)).toBeCloseTo(1, 5);
        expect(dot(normal, windingNormal(mesh.positions, mesh.indices, t))).toBeGreaterThan(0.999);
        expect(dot(normal, outward(mesh.positions, mesh.indices, t, box))).toBeGreaterThan(0);
      }
    },
  );
});
