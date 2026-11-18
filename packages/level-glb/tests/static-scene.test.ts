import { beforeAll, expect, test } from "bun:test";
import { readBaseStage } from "@level-designer/sec111-gateway/stage";
import type { GlbContainer } from "../src/container/index.js";
import type { SealBox } from "@level-designer/level-glb";
import { readGlb } from "../src/container/index.js";
import { assembleStaticScene, inspectGlb } from "@level-designer/level-glb";
import {
  expectIndexedMaterialTriangles,
  expectNoRequiredExtension,
  expectObjectRoots,
  expectOneBufferContainer,
  expectOwnAlignedViews,
  expectReaderSubset,
  entryAt,
  expectSameJson,
  objectPrimitives,
  rootsOf,
} from "./contract.js";
import { accessorValues } from "./bin-data.js";
import { BASE_NODES, BASE_SCALE, BASE_TRIANGLES, LOOK, SEALS } from "./fixtures.js";

/** The image, texture and sampler records; the last two pass through the assembly untyped. */
function imageRecords(document: object): unknown[] {
  return ["images", "textures", "samplers"].map((key) => Reflect.get(document, key));
}

/** A corner as its stored float32 values; position bounds are those of the stored data. */
function storedFloats(corner: readonly number[]): number[] {
  return corner.map(Math.fround);
}

/**
 * Whether a vertex's normal is a unit axis vector that points away from the box centre and
 * lies on the face it names: the vertex sits on that face's plane.
 */
function isOutwardFaceNormal(
  seal: SealBox,
  point: readonly number[],
  normal: readonly number[],
): boolean {
  const axis = normal.findIndex((component) => component !== 0);
  const sign = normal[axis] ?? 0;
  const unitAxis =
    Math.abs(sign) === 1 && normal.filter((component) => component !== 0).length === 1;
  const plane = Math.fround((sign > 0 ? seal.max : seal.min)[axis] ?? Number.NaN);
  const centre = ((seal.min[axis] ?? 0) + (seal.max[axis] ?? 0)) / 2;
  return unitAxis && point[axis] === plane && sign * ((point[axis] ?? 0) - centre) > 0;
}

/** The xyz triple of one vertex. */
function xyzAt(values: number[], vertex: number): number[] {
  return values.slice(vertex * 3, vertex * 3 + 3);
}

/** The vertex indices of a seal whose stored normal is not its face's outward unit normal. */
function inwardOrSkewNormals(seal: SealBox, positions: number[], normals: number[]): number[] {
  return Array.from({ length: normals.length / 3 }, (_, vertex) => vertex).filter(
    (vertex) => !isOutwardFaceNormal(seal, xyzAt(positions, vertex), xyzAt(normals, vertex)),
  );
}

// Owner: level-glb's static scene assembly, on the real base stage read through the gateway.
let stageBytes: Uint8Array;
let base: GlbContainer;
let glb: Uint8Array;
let scene: GlbContainer;

beforeAll(async () => {
  stageBytes = await readBaseStage();
  base = readGlb(stageBytes);
  const built = assembleStaticScene(stageBytes, LOOK, SEALS);
  if (!built.ok) throw new Error("the fixture look names only real base names");
  glb = built.glb;
  scene = readGlb(glb);
});

test("the static scene is one glTF binary with one JSON chunk, one BIN chunk and one buffer", () => {
  expectOneBufferContainer(glb, scene.document);
  expectNoRequiredExtension(scene.document);
  expectReaderSubset(scene);
  expectOwnAlignedViews(scene.document, base.document.accessors?.length ?? 0);
});

test("the static scene keeps the base nodes, accessors, buffer views, images, textures, samplers and buffer bytes verbatim", () => {
  const { document } = scene;
  // JSON text holds one spelling per value; the base stage's "-0" matrix entries read as 0.
  expect(base.document.nodes).toHaveLength(BASE_NODES);
  expectSameJson(document.nodes.slice(0, BASE_NODES), base.document.nodes);
  const accessors = base.document.accessors ?? [];
  expectSameJson(document.accessors?.slice(0, accessors.length), accessors);
  const views = base.document.bufferViews ?? [];
  expectSameJson(document.bufferViews?.slice(0, views.length), views);
  expectSameJson(imageRecords(document), imageRecords(base.document));
  const prefix = scene.bin.subarray(0, base.bin.byteLength);
  expect(Buffer.compare(prefix, base.bin)).toBe(0);
});

test("the static scene opens the scene with `stage`, the base roots scaled by base.scale", () => {
  const stage = entryAt(scene.document.nodes, rootsOf(scene.document)[0]);
  const s = BASE_SCALE;
  expect(stage).toEqual({
    name: "stage",
    matrix: [s, 0, 0, 0, 0, s, 0, 0, 0, 0, s, 0, 0, 0, 0, 1],
    children: [...rootsOf(base.document)],
  });
  const roles = scene.document.nodes.slice(0, BASE_NODES).filter((node) => node.extras?.role);
  expect(roles).toEqual([]);
});

test("the static scene appends one seal object per seal, in order, with one mesh node each", () => {
  const seals = SEALS.map((seal) => ({ id: seal.id, extras: { role: "seal" }, meshes: 1 }));
  expectObjectRoots(scene.document, seals);
});

test("the static scene stores every primitive as an indexed triangle list with a position and a material", () => {
  expectIndexedMaterialTriangles(scene.document);
});

test("the static scene stores a seal as a 12-triangle box in level coordinates with outward unit normals", () => {
  const { document } = scene;
  SEALS.forEach((seal, at) => {
    const [primitive] = objectPrimitives(document, 1 + at);
    expect(Object.keys(primitive?.attributes ?? {}).toSorted()).toEqual(["NORMAL", "POSITION"]);
    expect(entryAt(document.accessors, primitive?.indices).count).toBe(36);
    const position = entryAt(document.accessors, primitive?.attributes.POSITION);
    expect([position.min, position.max]).toEqual([storedFloats(seal.min), storedFloats(seal.max)]);
    const positions = accessorValues(scene, primitive?.attributes.POSITION ?? -1);
    const normals = accessorValues(scene, primitive?.attributes.NORMAL ?? -1);
    expect(normals).toHaveLength(24 * 3);
    expect(inwardOrSkewNormals(seal, positions, normals)).toEqual([]);
  });
});

test("in the static scene, base materials keep their indices, take their overrides and become single-sided", () => {
  const read = base.document.materials ?? [];
  const written = scene.document.materials ?? [];
  expect(read.map((material) => material.doubleSided)).toEqual(read.map(() => true));
  const singleSided = read.map((material) => ({ ...material, doubleSided: false }));
  const [tinted, emissive] = [4, 5].map((index) => written[index]);
  expect(tinted?.pbrMetallicRoughness).toEqual({
    ...read[4]?.pbrMetallicRoughness,
    baseColorFactor: [0.5, 0.5, 0.5, 1],
    metallicFactor: 0.2,
    roughnessFactor: 0.7,
  });
  expect([emissive?.emissiveFactor, emissive?.extensions]).toEqual([
    [1, 0.9, 0.8],
    { KHR_materials_emissive_strength: { emissiveStrength: 2 } },
  ]);
  const untouched = [0, 1, 2, 3, 6, 7, 8, 9, 10];
  expect(untouched.map((index) => written[index])).toEqual(
    untouched.map((index) => singleSided[index]),
  );
  expect([tinted?.name, emissive?.name, tinted?.doubleSided]).toEqual([
    "Material.003",
    "Material",
    false,
  ]);
});

test("in the static scene, a base material whose override names a finish carries it in its extras, its twin too", () => {
  const written = scene.document.materials ?? [];
  const twinOf = (name: string): number | undefined =>
    scene.document.meshes?.find((mesh) => mesh.name === name)?.primitives[0]?.material;
  const [tubeTwin, planeTwin] = [
    "factory_tube_01.001_Material.003_0",
    "Plane.001_Material.002_0",
  ].map((name) => written[twinOf(name) ?? -1]);
  expect([written[4]?.extras, tubeTwin?.extras]).toEqual([
    { finish: "floor/front" },
    { finish: "floor/front" },
  ]);
  // `Material` overrides without a finish; the others and the plane's twin have no override.
  const withoutFinish = [...written.slice(0, 4), ...written.slice(5, 11), planeTwin];
  expect(withoutFinish.map((material) => material?.extras)).toEqual(
    withoutFinish.map(() => undefined),
  );
});

test("in the static scene, a double-sided base mesh points to a double-sided twin of its material", () => {
  const written = scene.document.materials ?? [];
  const materialOf = (name: string): number | undefined =>
    scene.document.meshes?.find((mesh) => mesh.name === name)?.primitives[0]?.material;
  const twins = LOOK.doubleSided.map((name) => written[materialOf(name) ?? -1]);
  // Plane.001 used Material.002 (index 0), the tube Material.003 (index 4).
  expect(twins).toEqual([
    { ...written[0], doubleSided: true },
    { ...written[4], doubleSided: true },
  ]);
  const others = scene.document.meshes
    ?.slice(0, base.document.meshes?.length)
    .filter((mesh) => !LOOK.doubleSided.includes(mesh.name ?? ""));
  const readOthers = base.document.meshes?.filter(
    (mesh) => !LOOK.doubleSided.includes(mesh.name ?? ""),
  );
  expect(others).toEqual(readOthers);
});

test("the static scene appends the twins, then one flat material per seal", () => {
  const written = scene.document.materials ?? [];
  expect(written.map((material) => material.name).slice(11)).toEqual([
    "Material.002",
    "Material.003",
    "seal/end-wall",
    "seal/window-a",
  ]);
  const window = written[14]?.pbrMetallicRoughness;
  // #ff8000 in linear RGB: 0x80 decodes to 0.2158605.
  expect(window?.baseColorFactor?.[1]).toBeCloseTo(0.2158605, 6);
  expect(window).toEqual({
    baseColorFactor: [1, expect.any(Number), 0, 1],
    metallicFactor: 0,
    roughnessFactor: 0.5,
  });
  expect(written[14]?.doubleSided).toBeUndefined();
});

test("inspection counts 113,697 base triangles, and 12 per seal in the static scene", () => {
  const facts = { primitivesWithoutMaterial: [], images: 11 };
  expect(inspectGlb(stageBytes)).toEqual({ triangles: BASE_TRIANGLES, ...facts });
  expect(inspectGlb(glb)).toEqual({ triangles: BASE_TRIANGLES + 12 * SEALS.length, ...facts });
});

test("a base name the stage does not hold blocks the static scene with a `base` error and its path", () => {
  const look = {
    ...LOOK,
    materials: new Map([...LOOK.materials, ["Glass", {}], ["Material.099", {}]]),
    doubleSided: ["Plane.001_Material.002_0", "Material.003"],
  };
  expect(assembleStaticScene(stageBytes, look, SEALS)).toEqual({
    ok: false,
    errors: [
      {
        path: 'base.materials["Glass"]',
        message: 'base.materials["Glass"]: the base stage has no material named "Glass"',
      },
      {
        path: 'base.materials["Material.099"]',
        message:
          'base.materials["Material.099"]: the base stage has no material named "Material.099"',
      },
      {
        path: "base.doubleSided[1]",
        message: 'base.doubleSided[1]: the base stage has no mesh named "Material.003"',
      },
    ],
  });
});
