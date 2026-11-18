import { describe, expect, test } from "bun:test";
import { slabFrame } from "@level-designer/finish-paint";
import { slabBox } from "@level-designer/level-format";
import type { Quaternion, Slab, SlabBox, Vec3 } from "@level-designer/level-format";
import { buildSlabModel, meshSlab } from "@level-designer/slab-model";

/** A slab's number, seed and wear. */
type SlabMarks = Pick<Slab, "number" | "seed" | "wear">;

/** A concrete slab of `size` at `position`, turned by `rotation`, with `marks`. */
function slab(
  size: Vec3,
  position: Vec3 = [0, 0, 0],
  rotation: Quaternion = [0, 0, 0, 1],
  marks: SlabMarks = { number: 0, seed: 0, wear: 0.3 },
): Slab {
  return {
    size,
    material: "concrete",
    color: "#1a2430",
    position,
    rotation,
    finish: "housing/machine",
    ...marks,
  };
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

/** The difference of two triples. */
function minus(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

/** The `size` numbers at vertex `i` of an array of `size` numbers per vertex. */
function tuple(values: Float32Array, i: number, size: number): number[] {
  return Array.from({ length: size }, (_, k) => values[size * i + k] ?? Number.NaN);
}

/** The triple at index `i` of an xyz array. */
function triple(values: Float32Array, i: number): Vec3 {
  const [x = Number.NaN, y = Number.NaN, z = Number.NaN] = tuple(values, i, 3);
  return [x, y, z];
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

/** The largest difference between two equally long lists of numbers. */
function gap(a: readonly number[], b: readonly number[]): number {
  return Math.max(...a.map((value, i) => Math.abs(value - (b[i] ?? Number.NaN))));
}

/** A world point and a world direction in the slab's frame, recovered from its box. */
function slabLocal(box: SlabBox, point: Vec3, direction: Vec3): readonly [Vec3, Vec3] {
  const [ax, ay, az] = box.axes;
  const d = minus(point, box.center);
  const position: Vec3 = [dot(d, ax), dot(d, ay) + box.halfExtents[1], dot(d, az)];
  return [position, [dot(direction, ax), dot(direction, ay), dot(direction, az)]];
}

/** What the mesh's finish data of `subject` shows against the frames of its own vertices. */
interface FinishEvidence {
  readonly frameGap: number;
  readonly sizeGap: number;
  readonly colorGap: number;
  readonly classMismatches: number;
  readonly classes: readonly number[];
  readonly marks: readonly (readonly number[])[];
}

/** The finish data of every vertex, compared with the frame of its slab-local position. */
function finishEvidence(subject: Slab): FinishEvidence {
  const mesh = meshSlab(subject);
  const box = slabBox(subject);
  const own = linear(subject.color);
  const gaps = { frameGap: 0, sizeGap: 0, colorGap: 0, classMismatches: 0 };
  const classes = new Set<number>();
  const marks = new Map<string, readonly number[]>();
  for (let v = 0; v < mesh.positions.length / 3; v++) {
    const [position, normal] = slabLocal(box, triple(mesh.positions, v), triple(mesh.normals, v));
    const face = slabFrame(subject.size, position, normal);
    const [number = 0, seed = 0, wear = 0, faceClass = -1] = tuple(mesh.slab, v, 4);
    gaps.frameGap = Math.max(gaps.frameGap, gap(tuple(mesh.pattern, v, 2), [face.x, face.y]));
    gaps.sizeGap = Math.max(
      gaps.sizeGap,
      gap(tuple(mesh.faceSize, v, 2), [face.width, face.height]),
    );
    gaps.colorGap = Math.max(gaps.colorGap, gap(triple(mesh.colors, v), own));
    if (faceClass !== face.faceClass) gaps.classMismatches += 1;
    classes.add(faceClass);
    marks.set(`${number} ${seed} ${wear}`, [number, seed, wear]);
  }
  return { ...gaps, classes: [...classes].toSorted((a, b) => a - b), marks: [...marks.values()] };
}

/** The geometric unit normal of the triangle at `t`, from its winding. */
function windingNormal(positions: Float32Array, indices: Uint32Array, t: number): Vec3 {
  const [a, b, c] = [0, 1, 2].map((k) => triple(positions, indices[3 * t + k] ?? -1));
  const [ux, uy, uz] = minus(b ?? [0, 0, 0], a ?? [0, 0, 0]);
  const [wx, wy, wz] = minus(c ?? [0, 0, 0], a ?? [0, 0, 0]);
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
  const offsets = Array.from({ length: positions.length / 3 }, (_, v) =>
    dot(minus(triple(positions, v), box.center), axis),
  );
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

describe("the mesh of a rotated, lifted slab", () => {
  const corners: readonly Slab[] = [
    slab([0.02, 0.02, 0.02], [-30, 9.5, 41], unit([0.1, 0.9, -0.3, -0.2]), {
      number: 999_999,
      seed: 4_095,
      wear: 1,
    }),
    slab([40, 0.625, 0.02], [12.5, 9.5, -30], [1, 0, 0, 0], { number: 0, seed: 0, wear: 0 }),
    slab([0.625, 40, 40], [-7, 3, 18], unit([0.4, 0.4, -0.6, 0.5]), {
      number: 1,
      seed: 4_094,
      wear: 0.3,
    }),
    slab([7, 3.2, 0.3], [0.5, 12, 0.5], unit([0, Math.SQRT1_2, 0, Math.SQRT1_2]), {
      number: 123_456,
      seed: 2_048,
      wear: 0.5,
    }),
  ];
  const cases = corners.map((subject) => [subject.size.join(" x "), subject] as const);

  test.each(cases)(
    "%s m is indexed, wound outward along its normals and fills its box",
    (_size, subject) => {
      const mesh = meshSlab(subject);
      const vertices = mesh.positions.length / 3;
      expect(mesh.indices).toBeInstanceOf(Uint32Array);
      expect(mesh.indices.length).toBe(vertices);
      expect(mesh.indices.every((index) => index < vertices)).toBe(true);
      const lengths = [mesh.normals, mesh.colors, mesh.pattern, mesh.faceSize, mesh.slab].map(
        (values) => values.length / vertices,
      );
      expect(lengths).toEqual([3, 3, 2, 2, 4]);
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

  test.each(cases)(
    "%s m carries its own frame, the slab's colour and numbers on every vertex",
    (_size, subject) => {
      const evidence = finishEvidence(subject);
      expect(evidence.classes).toEqual([0, 1, 2, 3, 4, 5]);
      expect(evidence.classMismatches).toBe(0);
      expect(evidence.frameGap).toBeLessThan(1e-4);
      expect(evidence.sizeGap).toBeLessThan(1e-5);
      expect(evidence.colorGap).toBeLessThan(1e-6);
      expect(evidence.marks).toEqual([[subject.number, subject.seed, Math.fround(subject.wear)]]);
    },
  );
});
