import { expect, test } from "bun:test";
import type { GltfPrimitive } from "../src/container/index.js";
import type { StaticBox } from "@level-designer/level-glb";
import { assembleLevelScene, inspectGlb } from "@level-designer/level-glb";
import { accessorValues } from "./bin-data.js";
import type { ExpectedObject } from "./contract.js";
import {
  entryAt,
  expectNoRequiredExtension,
  expectObjectRoots,
  expectOneBufferContainer,
  expectOwnAlignedViews,
  expectReaderSubset,
  objectPrimitives,
} from "./contract.js";
import { BASE_TRIANGLES, LOOKS, PROPS, SEALS, STATICS } from "./fixtures.js";
import { assembleFixtureLevel, PROP_OBJECTS, SEAL_OBJECTS } from "./level-fixture.js";

// Owner: level-glb's level scene assembly of static objects, before the props.
const { staticGlb, staticScene, glb, level } = await assembleFixtureLevel(STATICS);

/** cos 30 degrees. */
const COS_30 = Math.sqrt(3) / 2;

/** The linear value of the sRGB channel 0x80. */
const LINEAR_80 = 0.2158605;

/** A point or vector of three components. */
type Triple = readonly [number, number, number];

/**
 * The corners of `sheet-a` (centre (2, 0.06, 3), half extents 0.2, 0.06, 0.5, yaw 30), keyed
 * by their sides along the box's X, Y and Z; computed by hand.
 */
const CORNERS: Readonly<Record<string, Triple>> = {
  "+-+": [2.4232051, 0, 3.3330127],
  "+++": [2.4232051, 0.12, 3.3330127],
  "+--": [1.9232051, 0, 2.4669873],
  "++-": [1.9232051, 0.12, 2.4669873],
  "--+": [2.0767949, 0, 3.5330127],
  "-++": [2.0767949, 0.12, 3.5330127],
  "---": [1.5767949, 0, 2.6669873],
  "-+-": [1.5767949, 0.12, 2.6669873],
};

/** One face of `sheet-a` by hand: its outward normal, its size, its class, its corners' x, y. */
interface ExpectedFace {
  readonly normal: Triple;
  readonly size: readonly [number, number];
  readonly faceClass: number;
  readonly corners: readonly (readonly [string, number, number])[];
}

/** The box's frame rule on `sheet-a`'s six faces: +Z, -Z, +X, -X, upper and lower. */
const FRAMES: readonly ExpectedFace[] = [
  {
    normal: [0.5, 0, COS_30],
    size: [0.4, 0.12],
    faceClass: 0,
    corners: [
      ["+-+", 0.2, 0],
      ["+++", 0.2, 0.12],
      ["--+", -0.2, 0],
      ["-++", -0.2, 0.12],
    ],
  },
  {
    normal: [-0.5, 0, -COS_30],
    size: [0.4, 0.12],
    faceClass: 0,
    corners: [
      ["+--", -0.2, 0],
      ["++-", -0.2, 0.12],
      ["---", 0.2, 0],
      ["-+-", 0.2, 0.12],
    ],
  },
  {
    normal: [COS_30, 0, -0.5],
    size: [1, 0.12],
    faceClass: 0,
    corners: [
      ["+-+", -0.5, 0],
      ["+++", -0.5, 0.12],
      ["+--", 0.5, 0],
      ["++-", 0.5, 0.12],
    ],
  },
  {
    normal: [-COS_30, 0, 0.5],
    size: [1, 0.12],
    faceClass: 0,
    corners: [
      ["--+", 0.5, 0],
      ["-++", 0.5, 0.12],
      ["---", -0.5, 0],
      ["-+-", -0.5, 0.12],
    ],
  },
  {
    normal: [0, 1, 0],
    size: [0.4, 1],
    faceClass: 2,
    corners: [
      ["+++", 0.2, 1],
      ["++-", 0.2, 0],
      ["-++", -0.2, 1],
      ["-+-", -0.2, 0],
    ],
  },
  {
    normal: [0, -1, 0],
    size: [0.4, 1],
    faceClass: 3,
    corners: [
      ["+-+", 0.2, 1],
      ["+--", 0.2, 0],
      ["--+", -0.2, 1],
      ["---", -0.2, 0],
    ],
  },
];

/** One written vertex of a static object's box: every attribute it carries. */
interface WrittenVertex {
  readonly position: Triple;
  readonly normal: Triple;
  readonly color: Triple;
  readonly pattern: readonly number[];
  readonly faceSize: readonly number[];
  readonly constants: readonly number[];
}

/** The one primitive of the static object at `at` in `STATICS`. */
function staticPrimitive(at: number): GltfPrimitive {
  const primitives = objectPrimitives(level.document, 1 + SEALS.length + at);
  expect(primitives).toHaveLength(1);
  return entryAt(primitives, 0);
}

/** An attribute's values cut into elements of `width` components. */
function elements(primitive: GltfPrimitive, semantic: string, width: number): number[][] {
  const values = accessorValues(level, primitive.attributes[semantic] ?? -1);
  return Array.from({ length: values.length / width }, (_, k) =>
    values.slice(k * width, (k + 1) * width),
  );
}

/** The first three numbers of a list as a triple. */
function triple(values: readonly number[]): Triple {
  return [values[0] ?? 0, values[1] ?? 0, values[2] ?? 0];
}

/** Every vertex of the static object at `at`, read from the file. */
function writtenVertices(at: number): readonly WrittenVertex[] {
  const primitive = staticPrimitive(at);
  const normals = elements(primitive, "NORMAL", 3);
  const colors = elements(primitive, "COLOR_0", 3);
  const patterns = elements(primitive, "TEXCOORD_0", 2);
  const sizes = elements(primitive, "TEXCOORD_1", 2);
  const constants = elements(primitive, "_SLAB", 4);
  return elements(primitive, "POSITION", 3).map((position, k) => ({
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

/** The level scene's nodes named `name`. */
function nodesNamed(name: string) {
  return level.document.nodes.filter((entry) => entry.name === name);
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

/** Evidence: every list holds the expected numbers to float32 precision. */
function expectNear(actual: readonly (readonly number[])[], expected: readonly number[]): void {
  expect(actual.filter((values) => !near(values, expected))).toEqual([]);
}

test("static objects stand after the seals and before the props, each a `static` object with one mesh node", () => {
  const statics: readonly ExpectedObject[] = [
    { id: "sheet-a", extras: { role: "static" }, meshes: 1 },
    { id: "sheet-b", extras: { role: "static", support: "crate-a/1" }, meshes: 1 },
    { id: "tag-c", extras: { role: "static" }, meshes: 1 },
  ];
  expectObjectRoots(level.document, [...SEAL_OBJECTS, ...statics, ...PROP_OBJECTS]);
});

test("a litter's support names the mesh node of its prop's slab, and floor litter has none", () => {
  const [litter] = nodesNamed("sheet-b");
  const support = String(litter?.extras?.support);
  const [slab] = nodesNamed(support);
  expect(slab?.mesh).toBeNumber();
  const [crate] = nodesNamed("crate-a");
  expect(crate?.children?.map((child) => level.document.nodes[child]?.name)).toContain(support);
  expect(Object.keys(nodesNamed("sheet-a")[0]?.extras ?? {})).toEqual(["role"]);
});

test("a static object's box is 24 vertices and 12 triangles at its hand-computed corners, wound outward", () => {
  const primitive = staticPrimitive(0);
  const position = entryAt(level.document.accessors, primitive.attributes.POSITION);
  expect(position.count).toBe(24);
  expect(entryAt(level.document.accessors, primitive.indices).count).toBe(36);
  expectNear([position.min ?? []], [1.5767949, 0, 2.4669873]);
  expectNear([position.max ?? []], [2.4232051, 0.12, 3.5330127]);
  const vertices = writtenVertices(0);
  const corners = Object.values(CORNERS);
  expect(vertices.filter((v) => !corners.some((c) => near(v.position, c)))).toEqual([]);
  const indices = accessorValues(level, primitive.indices ?? -1);
  const corner = (at: number): WrittenVertex => entryAt(vertices, indices[at]);
  const triangles = Array.from({ length: indices.length / 3 }, (_, k) =>
    windsOutward(corner(3 * k), corner(3 * k + 1), corner(3 * k + 2)),
  );
  expect(triangles).toEqual(triangles.map(() => true));
});

test("each of a yawed box's six faces carries its hand-computed frame at its four corners", () => {
  const vertices = writtenVertices(0);
  for (const face of FRAMES) {
    for (const [key, x, y] of face.corners) {
      const matches = vertices.filter(
        (v) => near(v.normal, face.normal) && near(v.position, CORNERS[key] ?? [Number.NaN]),
      );
      expect(matches).toHaveLength(1);
      const [vertex] = matches;
      expectNear([vertex?.pattern ?? []], [x, y]);
      expectNear([vertex?.faceSize ?? []], face.size);
      expect(vertex?.constants[3]).toBe(face.faceClass);
    }
  }
});

test("a painted box carries NORMAL, its linear colour, the pattern data and its constants per vertex", () => {
  STATICS.forEach((object, at) => {
    const primitive = staticPrimitive(at);
    expect(Object.keys(primitive.attributes).toSorted()).toEqual([
      "COLOR_0",
      "NORMAL",
      "POSITION",
      "TEXCOORD_0",
      "TEXCOORD_1",
      "_SLAB",
    ]);
    const types = Object.values(primitive.attributes).map(
      (index) => entryAt(level.document.accessors, index).componentType,
    );
    expect(types).toEqual(types.map(() => 5126));
    expect(entryAt(level.document.accessors, primitive.indices).componentType).toBe(5125);
    const vertices = writtenVertices(at);
    const { number, seed, wear } = object.paint;
    expectNear(
      vertices.map((v) => v.constants.slice(0, 3)),
      [number, seed, wear],
    );
    expect(vertices.map((v) => v.constants[3])).toEqual(vertices.map(classOf));
    expect(vertices.map(classOf).toSorted((a, b) => a - b)).toEqual([
      ...Array(16).fill(0),
      2,
      2,
      2,
      2,
      3,
      3,
      3,
      3,
    ]);
  });
  // #ff8000 and #808080 in linear RGB: 0x80 decodes to 0.2158605.
  expectNear(
    writtenVertices(0).map((v) => v.color),
    [1, LINEAR_80, 0],
  );
  expectNear(
    writtenVertices(2).map((v) => v.color),
    [LINEAR_80, LINEAR_80, LINEAR_80],
  );
});

test("a box and a slab of one finish path and glow share one material, and no static object has its own", () => {
  const first = staticScene.document.materials?.length ?? 0;
  const appended = (level.document.materials ?? []).slice(first);
  expect(appended.map((material) => material.name)).toEqual([
    "finish/litter/sheet",
    "finish/timber/crate",
    "finish/luminaire/strip",
    "finish/housing/machine/glow/cyan",
    "finish/luminaire/strip/glow/cyan",
    "finish/housing/plate/glow/cyan",
  ]);
  expect(appended[0]).toEqual({
    name: "finish/litter/sheet",
    extras: { finish: "litter/sheet" },
    pbrMetallicRoughness: {
      baseColorFactor: [1, 1, 1, 1],
      metallicFactor: 0.6,
      roughnessFactor: 0.6,
    },
  });
  const boxes = STATICS.map((_, at) => staticPrimitive(at).material);
  const slabs = (propAt: number) =>
    objectPrimitives(level.document, 1 + SEALS.length + STATICS.length + propAt).map(
      (primitive) => primitive.material,
    );
  expect(boxes).toEqual([first, first + 1, first + 3]);
  expect([slabs(0), slabs(1)[1], slabs(2)[0]]).toEqual([
    [first + 1, first + 1],
    first + 3,
    first + 3,
  ]);
});

test("a static object naming a finish path without a body is a programming error", () => {
  const sheet = entryAt(STATICS, 0);
  const paper: StaticBox = { ...sheet, paint: { ...sheet.paint, finish: "litter/paper" } };
  expect(() => assembleLevelScene(staticGlb, [], LOOKS, [paper])).toThrow(
    'no finish path named "litter/paper"',
  );
});

test("a level scene with static objects keeps the file's form and counts 12 triangles per static object", () => {
  expectOneBufferContainer(glb, level.document);
  expectNoRequiredExtension(level.document);
  expectReaderSubset(level);
  expectOwnAlignedViews(level.document, staticScene.document.accessors?.length ?? 0);
  const slabs = PROPS.flatMap((prop) => prop.slabs);
  const slabTriangles = slabs.reduce((sum, slab) => sum + slab.indices.length / 3, 0);
  expect(inspectGlb(glb)).toEqual({
    triangles: BASE_TRIANGLES + 12 * SEALS.length + 12 * STATICS.length + slabTriangles,
    primitivesWithoutMaterial: [],
    images: 11,
  });
});
