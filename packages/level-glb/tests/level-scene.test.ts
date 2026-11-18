import { beforeAll, expect, test } from "bun:test";
import { readBaseStage } from "@level-designer/sec111-gateway/stage";
import type { GlbContainer, GltfPrimitive } from "../src/container/index.js";
import { readGlb } from "../src/container/index.js";
import type { PropMeshes, SlabMesh } from "@level-designer/level-glb";
import { assembleLevelScene, assembleStaticScene, inspectGlb } from "@level-designer/level-glb";
import { accessorValues } from "./bin-data.js";
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
import { BASE_NODES, BASE_TRIANGLES, LOOK, LOOKS, PROPS, SEALS } from "./fixtures.js";

// Owner: level-glb's level scene assembly, appended to the static scene of the real base stage.
let staticGlb: Uint8Array;
let staticScene: GlbContainer;
let glb: Uint8Array;
let level: GlbContainer;

beforeAll(async () => {
  const built = assembleStaticScene(await readBaseStage(), LOOK, SEALS);
  if (!built.ok) throw new Error("the fixture look names only real base names");
  staticGlb = built.glb;
  staticScene = readGlb(built.glb);
  glb = assembleLevelScene(built.glb, PROPS, LOOKS);
  level = readGlb(glb);
});

/**
 * A slab primitive's attributes as the contract states them: each semantic, its FLOAT
 * accessor type and the slab mesh field it stores.
 */
const SLAB_ATTRIBUTES = [
  ["COLOR_0", "VEC3", "colors"],
  ["NORMAL", "VEC3", "normals"],
  ["POSITION", "VEC3", "positions"],
  ["TEXCOORD_0", "VEC2", "pattern"],
  ["TEXCOORD_1", "VEC2", "faceSize"],
  ["_SLAB", "VEC4", "slab"],
] as const satisfies readonly (readonly [string, string, keyof SlabMesh])[];

/** The primitives of a prop's mesh nodes, in slab order. */
function slabPrimitives(propAt: number): readonly GltfPrimitive[] {
  return objectPrimitives(level.document, 1 + SEALS.length + propAt);
}

/** The material index of each of a prop's slab primitives, in slab order. */
function slabMaterials(propAt: number): readonly (number | undefined)[] {
  return slabPrimitives(propAt).map((primitive) => primitive.material);
}

/** The materials the level scene appends to the static scene's. */
function appendedMaterials() {
  const first = staticScene.document.materials?.length ?? 0;
  return { first, appended: (level.document.materials ?? []).slice(first) };
}

/** The fallback of `path` with the glow `cyan` (strength 40), emitting at `strength`. */
function glowing(path: string, metalness: number, roughness: number, strength: number) {
  return {
    name: `finish/${path}/glow/cyan`,
    extras: { finish: path, glow: "cyan", glowStrength: 40 },
    pbrMetallicRoughness: {
      baseColorFactor: [1, 1, 1, 1],
      metallicFactor: metalness,
      roughnessFactor: roughness,
    },
    emissiveFactor: [0, 0.8, 1],
    extensions: { KHR_materials_emissive_strength: { emissiveStrength: strength } },
  };
}

/** One prop `x` holding the one slab. */
function withSlab(slab: SlabMesh): readonly PropMeshes[] {
  return [{ id: "x", slabs: [slab] }];
}

/** Evidence: one slab primitive stores its mesh's every vertex array and index as given. */
function expectStoredSlab(primitive: GltfPrimitive, slab: SlabMesh): void {
  const semantics = Object.keys(primitive.attributes).toSorted();
  expect(semantics).toEqual(SLAB_ATTRIBUTES.map(([semantic]) => semantic));
  for (const [semantic, type, field] of SLAB_ATTRIBUTES) {
    const index = primitive.attributes[semantic];
    const accessor = entryAt(level.document.accessors, index);
    expect([semantic, accessor.componentType, accessor.type]).toEqual([semantic, 5126, type]);
    expect(accessorValues(level, index ?? -1)).toEqual([...slab[field]]);
  }
  const indices = entryAt(level.document.accessors, primitive.indices);
  expect([indices.componentType, indices.type]).toEqual([5125, "SCALAR"]);
  expect(accessorValues(level, primitive.indices ?? -1)).toEqual([...slab.indices]);
  // Every fixture slab is the unit square at its own z, so its bounds are known by hand.
  const z = slab.positions[2] ?? Number.NaN;
  const position = entryAt(level.document.accessors, primitive.attributes.POSITION);
  expect([position.min, position.max]).toEqual([
    [0, 0, z],
    [1, 1, z],
  ]);
}

test("the level scene is one glTF binary with one buffer that requires no extension", () => {
  expectOneBufferContainer(glb, level.document);
  expectNoRequiredExtension(level.document);
  expect(level.document.extensionsUsed).toEqual(["KHR_materials_emissive_strength"]);
  expectReaderSubset(level);
  expectOwnAlignedViews(level.document, staticScene.document.accessors?.length ?? 0);
});

test("the level scene keeps the static scene's nodes, materials, accessors, images and bytes verbatim", () => {
  const kept = staticScene.document;
  expectSameJson(level.document.nodes.slice(0, kept.nodes.length), kept.nodes);
  const materials = kept.materials ?? [];
  expectSameJson(level.document.materials?.slice(0, materials.length), materials);
  const accessors = kept.accessors ?? [];
  expectSameJson(level.document.accessors?.slice(0, accessors.length), accessors);
  expectSameJson(level.document.images, kept.images);
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

test("the level scene stores a slab's vertices, colour, pattern coordinates, face size and constants as given", () => {
  PROPS.forEach((prop, at) => {
    const primitives = slabPrimitives(at);
    expect(primitives).toHaveLength(prop.slabs.length);
    primitives.forEach((primitive, k) => expectStoredSlab(primitive, entryAt(prop.slabs, k)));
  });
});

test("the level scene appends one material per finish path used without a glow, then one per pair of path and glow", () => {
  const { first, appended } = appendedMaterials();
  expect(appended.map((material) => material.name)).toEqual([
    "finish/timber/crate",
    "finish/luminaire/strip",
    "finish/luminaire/strip/glow/cyan",
    "finish/housing/machine/glow/cyan",
    "finish/housing/plate/glow/cyan",
  ]);
  // The housing appears only with a glow, so it has no plain material; every appended one is used.
  const referenced = new Set(PROPS.flatMap((_, at) => slabMaterials(at)));
  expect(appended.map((_, k) => referenced.has(first + k))).toEqual(appended.map(() => true));
  // Two props share the glowing housing's material.
  const used = [slabMaterials(0), slabMaterials(1), slabMaterials(2)];
  expect(used).toEqual([
    [first, first],
    [first + 2, first + 3, first + 1],
    [first + 3, first + 4],
  ]);
});

test("a path's fallback without a glow is white with its body's metalness and roughness, and no emission even when lit", () => {
  const { appended } = appendedMaterials();
  expect(appended.slice(0, 2)).toEqual([
    {
      name: "finish/timber/crate",
      extras: { finish: "timber/crate" },
      pbrMetallicRoughness: {
        baseColorFactor: [1, 1, 1, 1],
        metallicFactor: 0,
        roughnessFactor: 0.8,
      },
    },
    {
      name: "finish/luminaire/strip",
      extras: { finish: "luminaire/strip" },
      pbrMetallicRoughness: {
        baseColorFactor: [1, 1, 1, 1],
        metallicFactor: 0,
        roughnessFactor: 0.4,
      },
    },
  ]);
});

test("a glowing fallback carries its path, glow and unscaled strength and emits at the strength times the body's lit", () => {
  const { appended } = appendedMaterials();
  // A lit body emits at the glow's strength, as in the first pass; lit 0 and one half scale it.
  expect(appended.slice(2)).toEqual([
    glowing("luminaire/strip", 0, 0.4, 40),
    glowing("housing/machine", 0.9, 0.3, 0),
    glowing("housing/plate", 0.5, 0.5, 20),
  ]);
});

test("a slab naming a finish path without a body or an unknown glow is a programming error", () => {
  const slab = entryAt(PROPS[0]?.slabs, 0);
  expect(() =>
    assembleLevelScene(staticGlb, withSlab({ ...slab, finish: "timber/lid" }), LOOKS),
  ).toThrow('no finish path named "timber/lid"');
  expect(() => assembleLevelScene(staticGlb, withSlab({ ...slab, glow: "amber" }), LOOKS)).toThrow(
    'no glow named "amber"',
  );
});

test("inspection of the level scene counts the static scene's triangles plus every slab's, and the base images only", () => {
  const slabs = PROPS.flatMap((prop) => prop.slabs);
  const slabTriangles = slabs.reduce((sum, slab) => sum + slab.indices.length / 3, 0);
  expect(inspectGlb(glb)).toEqual({
    triangles: BASE_TRIANGLES + 12 * SEALS.length + slabTriangles,
    primitivesWithoutMaterial: [],
    images: 11,
  });
});
