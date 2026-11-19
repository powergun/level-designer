import { expect } from "bun:test";
import type { GlbContainer, GltfPrimitive } from "../src/container/index.js";
import { accessorValues } from "./bin-data.js";
import { entryAt } from "./contract.js";

/** A point or vector of three components. */
export type Triple = readonly [number, number, number];

/**
 * One face of a box by hand: its outward normal, its size, its class, and its corners' x and
 * y, each corner keyed by its sides along the box's X, Y and Z, such as `+-+`.
 */
export interface ExpectedFace {
  readonly normal: Triple;
  readonly size: readonly [number, number];
  readonly faceClass: number;
  readonly corners: readonly (readonly [string, number, number])[];
}

/** One written vertex of a painted box: every attribute it carries. */
export interface WrittenVertex {
  readonly position: Triple;
  readonly normal: Triple;
  readonly color: Triple;
  readonly pattern: readonly number[];
  readonly faceSize: readonly number[];
  readonly constants: readonly number[];
}

/** An attribute's values cut into elements of `width` components. */
function elements(
  container: GlbContainer,
  primitive: GltfPrimitive,
  semantic: string,
  width: number,
): number[][] {
  const values = accessorValues(container, primitive.attributes[semantic] ?? -1);
  return Array.from({ length: values.length / width }, (_, k) =>
    values.slice(k * width, (k + 1) * width),
  );
}

/** The first three numbers of a list as a triple. */
function triple(values: readonly number[]): Triple {
  return [values[0] ?? 0, values[1] ?? 0, values[2] ?? 0];
}

/** Every vertex of a painted box's primitive, read from the file. */
export function writtenVertices(
  container: GlbContainer,
  primitive: GltfPrimitive,
): readonly WrittenVertex[] {
  const read = (semantic: string, width: number): number[][] =>
    elements(container, primitive, semantic, width);
  const normals = read("NORMAL", 3);
  const colors = read("COLOR_0", 3);
  const patterns = read("TEXCOORD_0", 2);
  const sizes = read("TEXCOORD_1", 2);
  const constants = read("_SLAB", 4);
  return read("POSITION", 3).map((position, k) => ({
    position: triple(position),
    normal: triple(entryAt(normals, k)),
    color: triple(entryAt(colors, k)),
    pattern: entryAt(patterns, k),
    faceSize: entryAt(sizes, k),
    constants: entryAt(constants, k),
  }));
}

/** Whether two lists of numbers agree to float32 precision. */
function near(actual: readonly number[], expected: readonly number[]): boolean {
  return expected.every((value, k) => Math.abs((actual[k] ?? Number.NaN) - value) < 1e-5);
}

/** Evidence: every list holds the expected numbers to float32 precision. */
export function expectNear(
  actual: readonly (readonly number[])[],
  expected: readonly number[],
): void {
  expect(actual.filter((values) => !near(values, expected))).toEqual([]);
}

/** The class a vertex's face takes by the box's frame rule, told by its normal. */
function classOf(vertex: WrittenVertex): number {
  if (vertex.normal[1] > 0.5) return 2;
  return vertex.normal[1] < -0.5 ? 3 : 0;
}

/** Whether a triangle's corners wind counter-clockwise seen along its first corner's normal. */
function windsOutward(p: WrittenVertex, q: WrittenVertex, r: WrittenVertex): boolean {
  const minus = (a: Triple, b: Triple): Triple => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const [u0, u1, u2] = minus(q.position, p.position);
  const [w0, w1, w2] = minus(r.position, p.position);
  const cross: Triple = [u1 * w2 - u2 * w1, u2 * w0 - u0 * w2, u0 * w1 - u1 * w0];
  return cross[0] * p.normal[0] + cross[1] * p.normal[1] + cross[2] * p.normal[2] > 0;
}

/**
 * Evidence: a box primitive is 24 vertices and 12 triangles wound outward, each vertex on one
 * of the expected corners.
 */
export function expectOutwardBox(
  container: GlbContainer,
  primitive: GltfPrimitive,
  corners: readonly Triple[],
): void {
  const { accessors } = container.document;
  expect(entryAt(accessors, primitive.attributes.POSITION).count).toBe(24);
  expect(entryAt(accessors, primitive.indices).count).toBe(36);
  const vertices = writtenVertices(container, primitive);
  expect(vertices.filter((v) => !corners.some((c) => near(v.position, c)))).toEqual([]);
  const indices = accessorValues(container, primitive.indices ?? -1);
  const corner = (at: number): WrittenVertex => entryAt(vertices, indices[at]);
  const triangles = Array.from({ length: indices.length / 3 }, (_, k) =>
    windsOutward(corner(3 * k), corner(3 * k + 1), corner(3 * k + 2)),
  );
  expect(triangles).toEqual(triangles.map(() => true));
}

/** Evidence: each face's four corners carry the hand-computed frame and class, one vertex each. */
export function expectFaceFrames(
  vertices: readonly WrittenVertex[],
  corners: Readonly<Record<string, Triple>>,
  faces: readonly ExpectedFace[],
): void {
  for (const face of faces) {
    for (const [key, x, y] of face.corners) {
      const matches = vertices.filter(
        (v) => near(v.normal, face.normal) && near(v.position, corners[key] ?? [Number.NaN]),
      );
      expect(matches).toHaveLength(1);
      const [vertex] = matches;
      expectNear([vertex?.pattern ?? []], [x, y]);
      expectNear([vertex?.faceSize ?? []], face.size);
      expect(vertex?.constants[3]).toBe(face.faceClass);
    }
  }
}

/**
 * Evidence: a painted box's primitive carries the six FLOAT attributes and UNSIGNED_INT
 * indices, its constants on every vertex, and each face's class: 16 outside, 4 top, 4 bottom.
 */
export function expectPaintedBox(
  container: GlbContainer,
  primitive: GltfPrimitive,
  constants: Triple,
): void {
  const { accessors } = container.document;
  expect(Object.keys(primitive.attributes).toSorted()).toEqual([
    "COLOR_0",
    "NORMAL",
    "POSITION",
    "TEXCOORD_0",
    "TEXCOORD_1",
    "_SLAB",
  ]);
  const types = Object.values(primitive.attributes).map(
    (index) => entryAt(accessors, index).componentType,
  );
  expect(types).toEqual(types.map(() => 5126));
  expect(entryAt(accessors, primitive.indices).componentType).toBe(5125);
  const vertices = writtenVertices(container, primitive);
  expectNear(
    vertices.map((v) => v.constants.slice(0, 3)),
    constants,
  );
  expect(vertices.map((v) => v.constants[3])).toEqual(vertices.map(classOf));
  const classes = vertices.map(classOf).toSorted((a, b) => a - b);
  expect(classes).toEqual([...Array(16).fill(0), 2, 2, 2, 2, 3, 3, 3, 3]);
}
