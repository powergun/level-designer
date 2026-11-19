import { expect, test } from "bun:test";
import { readBaseStage } from "@level-designer/sec111-gateway/stage";
import type { GltfMaterial, GltfPrimitive } from "../src/container/index.js";
import type { BoxPaint, PropMeshes, SealBox } from "@level-designer/level-glb";
import { readGlb, writeGlb } from "../src/container/index.js";
import { assembleLevelScene, assembleStaticScene, inspectGlb } from "@level-designer/level-glb";
import {
  entryAt,
  expectIndexedMaterialTriangles,
  expectNoRequiredExtension,
  expectObjectRoots,
  expectOneBufferContainer,
  expectOwnAlignedViews,
  expectReaderSubset,
  objectPrimitives,
} from "./contract.js";
import { BASE_TRIANGLES, LOOK, LOOKS, PAINTED_SEALS, PROPS, SEALS, STATICS } from "./fixtures.js";
import type { ExpectedFace, Triple } from "./written-box.js";
import {
  expectFaceFrames,
  expectNear,
  expectOutwardBox,
  expectPaintedBox,
  writtenVertices,
} from "./written-box.js";
import { syntheticBase } from "./synthetic-glb.js";

// Owner: level-glb's static scene assembly of painted seals, and the level scene's reuse of
// their materials.
const stage = await readBaseStage();
const built = assembleStaticScene(stage, LOOK, PAINTED_SEALS, LOOKS);
if (!built.ok) throw new Error("the fixture look names only real base names");
const scene = readGlb(built.glb);

/** A plain crate slab, repainted on `path` without a glow. */
function plainSlab(path: string): PropMeshes["slabs"][number] {
  return { ...entryAt(entryAt(PROPS, 0).slabs, 0), finish: path };
}

/** A prop of plain slabs on the shutter's path and on the sill's hall path, after `PROPS`. */
const EDGE: PropMeshes = {
  id: "edge-a",
  slabs: [plainSlab("housing/machine"), plainSlab("floor/front")],
};

const levelGlb = assembleLevelScene(built.glb, [...PROPS, EDGE], LOOKS, STATICS);
const level = readGlb(levelGlb);

/** The linear value of the sRGB channel 0x80. */
const LINEAR_80 = 0.2158605;

/** The corners of `gate` (min (-2, 0, 59.7), max (2, 3, 60)) by their sides along X, Y, Z. */
const GATE_CORNERS: Readonly<Record<string, Triple>> = {
  "+-+": [2, 0, 60],
  "+++": [2, 3, 60],
  "+--": [2, 0, 59.7],
  "++-": [2, 3, 59.7],
  "--+": [-2, 0, 60],
  "-++": [-2, 3, 60],
  "---": [-2, 0, 59.7],
  "-+-": [-2, 3, 59.7],
};

/** The box's frame rule on `gate`'s faces, on the level's axes: +Z, -Z, +X, -X, upper, lower. */
const GATE_FRAMES: readonly ExpectedFace[] = [
  {
    normal: [0, 0, 1],
    size: [4, 3],
    faceClass: 0,
    corners: [
      ["+-+", 2, 0],
      ["+++", 2, 3],
      ["--+", -2, 0],
      ["-++", -2, 3],
    ],
  },
  {
    normal: [0, 0, -1],
    size: [4, 3],
    faceClass: 0,
    corners: [
      ["+--", -2, 0],
      ["++-", -2, 3],
      ["---", 2, 0],
      ["-+-", 2, 3],
    ],
  },
  {
    normal: [1, 0, 0],
    size: [0.3, 3],
    faceClass: 0,
    corners: [
      ["+-+", -0.15, 0],
      ["+++", -0.15, 3],
      ["+--", 0.15, 0],
      ["++-", 0.15, 3],
    ],
  },
  {
    normal: [-1, 0, 0],
    size: [0.3, 3],
    faceClass: 0,
    corners: [
      ["--+", 0.15, 0],
      ["-++", 0.15, 3],
      ["---", -0.15, 0],
      ["-+-", -0.15, 3],
    ],
  },
  {
    normal: [0, 1, 0],
    size: [4, 0.3],
    faceClass: 2,
    corners: [
      ["+++", 2, 0.3],
      ["++-", 2, 0],
      ["-++", -2, 0.3],
      ["-+-", -2, 0],
    ],
  },
  {
    normal: [0, -1, 0],
    size: [4, 0.3],
    faceClass: 3,
    corners: [
      ["+-+", 2, 0.3],
      ["+--", 2, 0],
      ["--+", -2, 0.3],
      ["---", -2, 0],
    ],
  },
];

/** The one primitive of the seal at `at` in `PAINTED_SEALS`, in the static scene. */
function sealPrimitive(at: number): GltfPrimitive {
  const primitives = objectPrimitives(scene.document, 1 + at);
  expect(primitives).toHaveLength(1);
  return entryAt(primitives, 0);
}

/** The material of a primitive of the level scene. */
function levelMaterial(primitive: GltfPrimitive): GltfMaterial {
  return entryAt(level.document.materials, primitive.material);
}

test("painted seals stand among the seal roots in input order, each a `seal` object with one mesh node", () => {
  const seals = PAINTED_SEALS.map((seal) => ({ id: seal.id, extras: { role: "seal" }, meshes: 1 }));
  expectObjectRoots(scene.document, seals);
});

test("a painted seal's box keeps the seal's exact corners, 24 vertices and 12 triangles wound outward", () => {
  const primitive = sealPrimitive(0);
  const position = entryAt(scene.document.accessors, primitive.attributes.POSITION);
  expect(position.min).toEqual([-2, 0, Math.fround(59.7)]);
  expect(position.max).toEqual([2, 3, 60]);
  // Every stored position is one of the seal's own corners, bit for bit.
  const exact = new Set(Object.values(GATE_CORNERS).map((c) => c.map(Math.fround).join()));
  const positions = writtenVertices(scene, primitive).map((vertex) => vertex.position.join());
  expect(positions.filter((p) => !exact.has(p))).toEqual([]);
  expectOutwardBox(scene, primitive, Object.values(GATE_CORNERS));
});

test("each of a painted seal's six faces carries its hand-computed frame on the level's axes", () => {
  expectFaceFrames(writtenVertices(scene, sealPrimitive(0)), GATE_CORNERS, GATE_FRAMES);
  // The shutter is longer along Z: its X faces measure 5 m wide, its Z faces 0.3 m.
  const sizes = writtenVertices(scene, sealPrimitive(2)).map((v) => [...v.normal, ...v.faceSize]);
  const shutterFaces = [
    [0, 0, 1, 0.3, 2],
    [0, 0, -1, 0.3, 2],
    [1, 0, 0, 5, 2],
    [-1, 0, 0, 5, 2],
    [0, 1, 0, 0.3, 5],
    [0, -1, 0, 0.3, 5],
  ];
  for (const face of shutterFaces) {
    const normal = face.slice(0, 3);
    const onFace = sizes.filter((entry) => normal.every((value, k) => value === entry[k]));
    expect(onFace).toHaveLength(4);
    expectNear(
      onFace.map((entry) => entry.slice(3)),
      face.slice(3),
    );
  }
});

test("a painted seal carries NORMAL, its linear tint, the pattern data and its constants per vertex", () => {
  PAINTED_SEALS.forEach((seal, at) => {
    if (seal.paint === undefined) return;
    const { number, seed, wear } = seal.paint;
    expectPaintedBox(scene, sealPrimitive(at), [number, seed, wear]);
  });
  // #ff8000 and #808080 in linear RGB: 0x80 decodes to 0.2158605.
  expectNear(
    writtenVertices(scene, sealPrimitive(0)).map((v) => v.color),
    [1, LINEAR_80, 0],
  );
  expectNear(
    writtenVertices(scene, sealPrimitive(2)).map((v) => v.color),
    [LINEAR_80, LINEAR_80, LINEAR_80],
  );
});

test("a seal without a finish keeps its own flat material and carries no paint data", () => {
  const primitive = sealPrimitive(1);
  expect(Object.keys(primitive.attributes).toSorted()).toEqual(["NORMAL", "POSITION"]);
  const material = entryAt(scene.document.materials, primitive.material);
  expect(material.name).toBe("seal/window-a");
  expect(material.extras).toBeUndefined();
  expect(material.pbrMetallicRoughness?.metallicFactor).toBe(0);
  expect(material.pbrMetallicRoughness?.roughnessFactor).toBe(0.5);
  expectNear([material.pbrMetallicRoughness?.baseColorFactor ?? []], [1, LINEAR_80, 0, 1]);
});

test("painted seals draw with the shared finish materials, after the flat seals' own", () => {
  const materials = scene.document.materials ?? [];
  // The base materials and their twins: the materials of a static scene without seals.
  const bare = assembleStaticScene(stage, LOOK, [], LOOKS);
  const first = bare.ok ? (readGlb(bare.glb).document.materials?.length ?? 0) : -1;
  expect(materials.slice(first).map((material) => material.name)).toEqual([
    "seal/window-a",
    "finish/floor/front",
    "finish/cladding/gate/glow/cyan",
    "finish/housing/machine/glow/cyan",
  ]);
  expect(PAINTED_SEALS.map((_, at) => sealPrimitive(at).material)).toEqual([
    first + 2,
    first,
    first + 3,
    first + 1,
  ]);
  expect(materials[first + 2]).toEqual({
    name: "finish/cladding/gate/glow/cyan",
    extras: { finish: "cladding/gate", glow: "cyan", glowStrength: 40 },
    pbrMetallicRoughness: {
      baseColorFactor: [1, 1, 1, 1],
      metallicFactor: 0.7,
      roughnessFactor: 0.4,
    },
    emissiveFactor: [0, 0.8, 1],
    extensions: { KHR_materials_emissive_strength: { emissiveStrength: 20 } },
  });
  const shutter = materials[first + 3]?.extensions?.KHR_materials_emissive_strength;
  expect(shutter).toEqual({ emissiveStrength: 0 });
});

test("a painted seal naming a finish path without a body, or a missing glow, is a programming error", () => {
  const gate = entryAt(PAINTED_SEALS, 0);
  if (gate.paint === undefined) throw new Error("the gate is painted");
  const { paint } = gate;
  const repaint = (change: Partial<BoxPaint>): SealBox[] => [
    { ...gate, paint: { ...paint, ...change } },
  ];
  expect(() =>
    assembleStaticScene(stage, LOOK, repaint({ finish: "cladding/door" }), LOOKS),
  ).toThrow('no finish path named "cladding/door"');
  expect(() => assembleStaticScene(stage, LOOK, repaint({ glow: "amber" }), LOOKS)).toThrow(
    'no glow named "amber"',
  );
});

test("a seal, a static object and a slab of one path and glow share one material", () => {
  const seal = (at: number): GltfPrimitive => entryAt(objectPrimitives(level.document, 1 + at), 0);
  const roots = 1 + PAINTED_SEALS.length;
  const object = (at: number): GltfPrimitive =>
    entryAt(objectPrimitives(level.document, roots + at), 0);
  const slabs = (at: number) => objectPrimitives(level.document, roots + STATICS.length + at);
  const shared = seal(2).material;
  // tag-c, lamp-a's housing slab and sign-a's housing slab are on the housing's path and glow.
  expect([object(2).material, slabs(1)[1]?.material, slabs(2)[0]?.material]).toEqual([
    shared,
    shared,
    shared,
  ]);
  const pairs = (level.document.materials ?? []).filter(
    (material) => material.extras?.finish === "housing/machine" && material.extras.glow === "cyan",
  );
  expect(pairs).toHaveLength(1);
  // The same path without a glow is a second, plain material.
  const plain = entryAt(slabs(PROPS.length), 0);
  expect(plain.material).not.toBe(shared);
  expect(levelMaterial(plain).extras).toEqual({ finish: "housing/machine" });
  // A slab on the sill's path takes the sill's finish material, never the stage material.
  const hall = entryAt(slabs(PROPS.length), 1);
  expect(hall.material).toBe(seal(3).material);
  expect(levelMaterial(hall).name).toBe("finish/floor/front");
});

/**
 * The synthetic base re-rooted at its mesh node, so the first child of the root `stage` draws
 * the base material `grey`, which carries the hall path `floor/front`.
 */
function meshRootedScene(): Uint8Array {
  const { document, bin } = readGlb(syntheticBase(true));
  const base = writeGlb({ ...document, scenes: [{ nodes: [1] }] }, bin);
  const look = {
    scale: 1,
    materials: new Map([["grey", { finish: "floor/front" }]]),
    doubleSided: [],
  };
  const flat = assembleStaticScene(base, look, SEALS, LOOKS);
  if (!flat.ok) throw new Error("the synthetic base holds the material grey");
  return flat.glb;
}

test("a slab on a stage material's hall path takes a new finish material when no seal names the path", () => {
  const flat = meshRootedScene();
  const held = readGlb(flat).document.materials?.length ?? 0;
  const edged = readGlb(assembleLevelScene(flat, [EDGE], LOOKS, []));
  const hall = entryAt(objectPrimitives(edged.document, 1 + SEALS.length), 1);
  expect(hall.material).toBeGreaterThanOrEqual(held);
  expect(entryAt(edged.document.materials, hall.material).name).toBe("finish/floor/front");
});

test("the level scene appends only the finish materials the static scene lacks", () => {
  const appended = (level.document.materials ?? []).slice(scene.document.materials?.length ?? 0);
  expect(appended.map((material) => material.name)).toEqual([
    "finish/litter/sheet",
    "finish/timber/crate",
    "finish/luminaire/strip",
    "finish/housing/machine",
    "finish/luminaire/strip/glow/cyan",
    "finish/housing/plate/glow/cyan",
  ]);
});

test("a static scene with painted seals keeps the file's form and counts 12 triangles per seal", () => {
  expectOneBufferContainer(built.glb, scene.document);
  expectNoRequiredExtension(scene.document);
  expectReaderSubset(scene);
  expectIndexedMaterialTriangles(scene.document);
  expectOwnAlignedViews(scene.document, readGlb(stage).document.accessors?.length ?? 0);
  expect(inspectGlb(built.glb)).toEqual({
    triangles: BASE_TRIANGLES + 12 * PAINTED_SEALS.length,
    primitivesWithoutMaterial: [],
    images: 11,
  });
  expectReaderSubset(level);
  expectIndexedMaterialTriangles(level.document);
});
