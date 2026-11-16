import { beforeAll, expect, test } from "bun:test";
import { readBaseStage } from "@level-designer/sec111-gateway/stage";
import type { GlbContainer, GltfPrimitive } from "../src/container/index.js";
import { readGlb } from "../src/container/index.js";
import { assembleLevelScene, assembleStaticScene, inspectGlb } from "@level-designer/level-glb";
import {
  expectIndexedMaterialTriangles,
  expectNoRequiredExtension,
  expectObjectRoots,
  expectOneBufferContainer,
  expectReaderSubset,
  entryAt,
  expectSameJson,
  objectPrimitives,
  rootsOf,
} from "./contract.js";
import { BASE_NODES, BASE_TRIANGLES, LOOK, LOOKS, PROPS, SEALS } from "./fixtures.js";

// Owner: level-glb's level scene assembly, appended to the static scene of the real base stage.
let staticScene: GlbContainer;
let glb: Uint8Array;
let level: GlbContainer;

beforeAll(async () => {
  const built = assembleStaticScene(await readBaseStage(), LOOK, SEALS);
  if (!built.ok) throw new Error("the fixture look names only real base names");
  staticScene = readGlb(built.glb);
  glb = assembleLevelScene(built.glb, PROPS, LOOKS);
  level = readGlb(glb);
});

/** The primitives of a prop's mesh nodes, in slab order. */
function slabPrimitives(propAt: number): readonly GltfPrimitive[] {
  return objectPrimitives(level.document, 1 + SEALS.length + propAt);
}

/** The material index of each of a prop's slab primitives, in slab order. */
function slabMaterials(propAt: number): readonly (number | undefined)[] {
  return slabPrimitives(propAt).map((primitive) => primitive.material);
}

test("the level scene is one glTF binary with one buffer that requires no extension", () => {
  expectOneBufferContainer(glb, level.document);
  expectNoRequiredExtension(level.document);
  expect(level.document.extensionsUsed).toEqual(["KHR_materials_emissive_strength"]);
  expectReaderSubset(level);
});

test("the level scene keeps the static scene's nodes, materials, accessors and bytes verbatim", () => {
  const kept = staticScene.document;
  expectSameJson(level.document.nodes.slice(0, kept.nodes.length), kept.nodes);
  const materials = kept.materials ?? [];
  expectSameJson(level.document.materials?.slice(0, materials.length), materials);
  const accessors = kept.accessors ?? [];
  expectSameJson(level.document.accessors?.slice(0, accessors.length), accessors);
  const prefix = level.bin.subarray(0, staticScene.bin.byteLength);
  expect(Buffer.compare(prefix, staticScene.bin)).toBe(0);
  const roles = level.document.nodes.slice(0, BASE_NODES).filter((node) => node.extras?.role);
  expect(roles).toEqual([]);
});

test("the level scene keeps `stage` first, then one seal object per seal, then one object per prop", () => {
  expect(entryAt(level.document.nodes, rootsOf(level.document)[0]).name).toBe("stage");
  const seals = SEALS.map((seal) => ({ id: seal.id, extras: { role: "seal" }, meshes: 1 }));
  const props = PROPS.map((prop) => ({
    id: prop.id,
    extras: { role: "destructible", prop: prop.id },
    meshes: prop.slabs.length,
  }));
  expectObjectRoots(level.document, [...seals, ...props]);
});

test("the level scene stores every primitive as an indexed triangle list with a position and a material", () => {
  expectIndexedMaterialTriangles(level.document);
});

test("the level scene stores a slab with normals and linear float colours and no texture coordinate", () => {
  const accessors = level.document.accessors ?? [];
  for (const primitive of PROPS.flatMap((_, at) => slabPrimitives(at))) {
    const semantics = Object.keys(primitive.attributes).toSorted();
    expect(semantics).toEqual(["COLOR_0", "NORMAL", "POSITION"]);
    const color = entryAt(accessors, primitive.attributes.COLOR_0);
    expect([color.componentType, color.type]).toEqual([5126, "VEC3"]);
  }
});

test("the level scene appends one material per finish used without a glow, then one per pair of finish and glow", () => {
  const materials = level.document.materials ?? [];
  const first = staticScene.document.materials?.length ?? 0;
  const appended = materials.slice(first);
  expect(appended.map((material) => material.name)).toEqual([
    "finish/wood",
    "finish/metal",
    "finish/metal/glow/cyan",
    "finish/brick/glow/cyan",
  ]);
  // Brick appears only with a glow, so it has no plain material; every appended one is used.
  const referenced = new Set(PROPS.flatMap((_, at) => slabMaterials(at)));
  expect(appended.map((_, k) => referenced.has(first + k))).toEqual(appended.map(() => true));
  expect(appended[2]).toEqual({
    name: "finish/metal/glow/cyan",
    pbrMetallicRoughness: {
      baseColorFactor: [1, 1, 1, 1],
      metallicFactor: 0.9,
      roughnessFactor: 0.3,
    },
    emissiveFactor: [0, 0.8, 1],
    extensions: { KHR_materials_emissive_strength: { emissiveStrength: 40 } },
  });
  const used = [slabMaterials(0), slabMaterials(1), slabMaterials(2)];
  expect(used).toEqual([[first, first], [first + 2, first + 1], [first + 3]]);
});

test("inspection of the level scene counts the static scene's triangles plus every slab's", () => {
  const slabs = PROPS.flatMap((prop) => prop.slabs);
  const slabTriangles = slabs.reduce((sum, slab) => sum + slab.indices.length / 3, 0);
  expect(inspectGlb(glb)).toEqual({
    triangles: BASE_TRIANGLES + 12 * SEALS.length + slabTriangles,
    primitivesWithoutMaterial: [],
    images: 11,
  });
});
