import { describe, expect, test } from "bun:test";
import type { Finish, FinishTable, Layer, Recipe } from "@level-designer/level-format";
import {
  DoubleSide,
  FrontSide,
  type Material,
  Mesh,
  MeshStandardMaterial,
  MeshStandardNodeMaterial,
  Object3D,
  Texture,
} from "three/webgpu";
import { loadLevelGlb } from "./glb.js";
import { applyMeshRules } from "./meshes.js";

/** One triangle's positions, a float accessor per vertex attribute, and its indices. */
const TRIANGLE = {
  POSITION: [0, 0, 0, 1, 0, 0, 0, 1, 0],
  COLOR_0: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
  TEXCOORD_0: [0, 0, 1, 0, 0, 1],
  TEXCOORD_1: [2, 1.2, 2, 1.2, 2, 1.2],
  _SLAB: [0, 7, 0.3, 0, 0, 7, 0.3, 0, 0, 7, 0.3, 0],
  indices: [0, 1, 2],
};

/** The vertex attributes of a painted primitive, with their glTF types. */
const PAINTED = [
  ["COLOR_0", "VEC3"],
  ["TEXCOORD_0", "VEC2"],
  ["TEXCOORD_1", "VEC2"],
  ["_SLAB", "VEC4"],
] as const;

/** The BIN chunk and one accessor per attribute: POSITION first, the indices last. */
function triangleBuffers(): { readonly bin: Uint8Array; readonly gltf: object } {
  const arrays: Float32Array[] = [new Float32Array(TRIANGLE.POSITION)];
  const accessors: object[] = [
    { bufferView: 0, componentType: 5126, count: 3, type: "VEC3", min: [0, 0, 0], max: [1, 1, 0] },
  ];
  for (const [name, type] of PAINTED) {
    accessors.push({ bufferView: arrays.length, componentType: 5126, count: 3, type });
    arrays.push(new Float32Array(TRIANGLE[name]));
  }
  const parts = [...arrays, new Uint32Array(TRIANGLE.indices)];
  accessors.push({ bufferView: arrays.length, componentType: 5125, count: 3, type: "SCALAR" });
  const bin = new Uint8Array(parts.reduce((sum, part) => sum + part.byteLength, 0));
  const bufferViews: object[] = [];
  let offset = 0;
  for (const part of parts) {
    bin.set(new Uint8Array(part.buffer), offset);
    bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: part.byteLength });
    offset += part.byteLength;
  }
  return { bin, gltf: { accessors, bufferViews, buffers: [{ byteLength: bin.length }] } };
}

/** The accessor index of the indices, after POSITION and the painted attributes. */
const INDICES = PAINTED.length + 1;

/** A GLB container of a glTF JSON chunk and the triangle's BIN chunk. */
function glbOf(json: object): Uint8Array {
  const { bin, gltf } = triangleBuffers();
  const text = JSON.stringify({ asset: { version: "2.0" }, scene: 0, ...json, ...gltf });
  const chunk = new TextEncoder().encode(text.padEnd(Math.ceil(text.length / 4) * 4));
  const glb = new Uint8Array(12 + 8 + chunk.length + 8 + bin.length);
  const view = new DataView(glb.buffer);
  view.setUint32(0, 0x46546c67, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, glb.length, true);
  view.setUint32(12, chunk.length, true);
  view.setUint32(16, 0x4e4f534a, true);
  glb.set(chunk, 20);
  view.setUint32(20 + chunk.length, bin.length, true);
  view.setUint32(24 + chunk.length, 0x004e4942, true);
  glb.set(bin, 28 + chunk.length);
  return glb;
}

/** A primitive with POSITION alone, or with the painted attributes too. */
function primitive(material: number, painted: boolean): object {
  const attributes: Record<string, number> = { POSITION: 0 };
  if (painted) PAINTED.forEach(([name], index) => (attributes[name] = index + 1));
  return { primitives: [{ attributes, indices: INDICES, material }] };
}

/** A texture-free level: a parent node moved by +X 4 with a child mesh moved by +Y 2, and a root mesh. */
const PLAIN_LEVEL = {
  scenes: [{ nodes: [0, 2] }],
  nodes: [
    { name: "parent", translation: [4, 0, 0], children: [1] },
    { name: "parent/0", translation: [0, 2, 0], mesh: 0 },
    { name: "root/0", translation: [0, 0, -3], mesh: 1 },
  ],
  meshes: [primitive(0, false), primitive(1, false)],
  materials: [
    { name: "single", doubleSided: false },
    { name: "double", doubleSided: true },
  ],
};

/** The meshes of the painted level, in node order, each with its own mesh record. */
const PAINTED_MESHES = [
  "stage",
  "box",
  "slab-a",
  "slab-b",
  "lamp",
  "plate",
  "floor",
  "ramp",
  "tube",
  "hall-slab",
  "ceiling",
];

/**
 * A painted level: a stage mesh without a finish; a box and two slabs of a layered path; a
 * plain lamp with a glow; a slab with a glow on a path whose body has a shade; the stage meshes
 * of a hall finish, two on one material and one on its double-sided twin; a slab that names the
 * same hall path; and a stage mesh of a hall finish without a layer.
 */
const PAINTED_LEVEL = {
  scenes: [{ nodes: PAINTED_MESHES.map((_, node) => node) }],
  nodes: PAINTED_MESHES.map((name, mesh) => ({ name, mesh })),
  meshes: [
    primitive(0, false),
    primitive(1, true),
    primitive(1, true),
    primitive(1, true),
    primitive(2, true),
    primitive(3, true),
    primitive(4, false),
    primitive(4, false),
    primitive(5, false),
    primitive(6, true),
    primitive(7, false),
  ],
  materials: [
    { name: "stage" },
    {
      name: "finish/housing/machine",
      doubleSided: true,
      pbrMetallicRoughness: { baseColorFactor: [0.25, 0.5, 1, 1] },
      extras: { finish: "housing/machine" },
    },
    {
      name: "finish/luminaire/strip/glow/line",
      emissiveFactor: [1, 0.5, 0.25],
      extras: { finish: "luminaire/strip", glow: "line", glowStrength: 6 },
    },
    {
      name: "finish/housing/plate/glow/line",
      emissiveFactor: [1, 0.5, 0.25],
      extras: { finish: "housing/plate", glow: "line", glowStrength: 6 },
    },
    {
      name: "Material.003",
      pbrMetallicRoughness: { baseColorFactor: [0.5, 0.5, 0.5, 1], roughnessFactor: 0.8 },
      extras: { finish: "hall/front" },
    },
    {
      name: "Material.003",
      doubleSided: true,
      pbrMetallicRoughness: { baseColorFactor: [0.5, 0.5, 0.5, 1], roughnessFactor: 0.8 },
      extras: { finish: "hall/front" },
    },
    { name: "finish/hall/front", extras: { finish: "hall/front" } },
    { name: "Material.007", extras: { finish: "hall/bare" } },
  ],
};

/** The interior box of the painted level, as the prepared static level states it. */
const INTERIOR = { min: [-30, -2, -60], max: [30, 16, 60] } as const;

/** A plain body: what the GLB's fallback already draws at a shade of 1. */
const BODY = { shade: 1, metalness: 0.55, roughness: 0.7, lit: 1 };

/** A kick band at a face's base, a layer the fallback cannot draw. */
const KICK: Layer = {
  pattern: {
    kind: "rectangle",
    from: [{ metres: -1 }, { metres: 0 }],
    to: [{ metres: 1 }, { metres: 0.12 }],
  },
  on: "outside",
  wear: false,
  amount: 1,
  effects: { shade: 0.6 },
};

/** A finish with the given roles. */
function finishOf(roles: Record<string, Recipe>): Finish {
  return {
    cut: { family: "metal", color: "#5a5d61" },
    light: "#ffffff",
    roles: new Map(Object.entries(roles)),
  };
}

/** A hall finish with a layer, and one without. */
const HALL = finishOf({ front: { body: BODY, layers: [KICK] }, bare: { body: BODY, layers: [] } });

/**
 * The finish table of the painted level: a layered role, a shaded role, a plain lamp and the
 * hall's two roles.
 */
const FINISHES: FinishTable = new Map([
  [
    "housing",
    finishOf({
      machine: { body: BODY, layers: [KICK] },
      plate: { body: { ...BODY, shade: 0.8 }, layers: [] },
    }),
  ],
  ["luminaire", finishOf({ strip: { body: BODY, layers: [] } })],
  ["hall", HALL],
]);

/** The meshes of a scene by name. */
function meshesByName(root: Object3D): Map<string, Mesh> {
  const meshes = new Map<string, Mesh>();
  root.traverse((object) => {
    if (object instanceof Mesh) meshes.set(object.name, object);
  });
  return meshes;
}

/** A mesh's one material. */
function materialOf(meshes: ReadonlyMap<string, Mesh>, name: string): Material {
  const material = meshes.get(name)?.material;
  if (material === undefined || Array.isArray(material))
    throw new Error(`Expected one material on ${name}`);
  return material;
}

describe("a texture-free GLB built by hand", () => {
  test("loads with every mesh casting and receiving shadows with two-sided shadow faces", async () => {
    const meshes = meshesByName(await loadLevelGlb(glbOf(PLAIN_LEVEL), new Map(), INTERIOR));
    expect([...meshes.keys()]).toEqual(["parent0", "root0"]);
    for (const mesh of meshes.values()) {
      expect([mesh.castShadow, mesh.receiveShadow]).toEqual([true, true]);
      expect(mesh.material).toMatchObject({ shadowSide: DoubleSide });
    }
    expect(meshes.get("parent0")?.material).toMatchObject({ side: FrontSide });
    expect(meshes.get("root0")?.material).toMatchObject({ side: DoubleSide });
  });

  test("loads with frozen matrices at the nodes' world placement", async () => {
    const level = await loadLevelGlb(glbOf(PLAIN_LEVEL), new Map(), INTERIOR);
    const placed = meshesByName(level);
    level.traverse((object) => {
      expect([object.matrixAutoUpdate, object.matrixWorldAutoUpdate]).toEqual([false, false]);
    });
    level.position.set(100, 100, 100);
    level.updateMatrixWorld(true);
    const translations = [...placed.values()].map((mesh) =>
      mesh.matrixWorld.elements.slice(12, 15),
    );
    expect(translations).toEqual([
      [4, 2, 0],
      [0, 0, -3],
    ]);
  });
});

describe("a painted GLB built by hand", () => {
  test("a path with layers or a shade gets a twin, shared by its meshes", async () => {
    const meshes = meshesByName(await loadLevelGlb(glbOf(PAINTED_LEVEL), FINISHES, INTERIOR));
    const box = materialOf(meshes, "box");
    expect([materialOf(meshes, "slab-a"), materialOf(meshes, "slab-b")]).toEqual([box, box]);
    const [painted, plate] = [box, materialOf(meshes, "plate")].map((twin) => {
      if (!(twin instanceof MeshStandardNodeMaterial)) throw new Error("Expected a node twin");
      return twin;
    });
    expect(painted).not.toBe(plate);
    expect(painted).toMatchObject({ side: DoubleSide, shadowSide: DoubleSide });
    expect(painted?.color.toArray()).toEqual([0.25, 0.5, 1]);
    expect([painted?.emissiveNode, plate?.emissiveNode === null]).toEqual([null, false]);
  });

  test("a plain path at shade 1 and an unpainted material keep the GLB's material", async () => {
    const meshes = meshesByName(await loadLevelGlb(glbOf(PAINTED_LEVEL), FINISHES, INTERIOR));
    for (const name of ["stage", "lamp"]) {
      const material = materialOf(meshes, name);
      expect(material).toBeInstanceOf(MeshStandardMaterial);
      expect(material).not.toBeInstanceOf(MeshStandardNodeMaterial);
    }
    const lamp = materialOf(meshes, "lamp");
    expect(lamp instanceof MeshStandardMaterial ? lamp.emissive.toArray() : []).toEqual([
      1, 0.5, 0.25,
    ]);
  });

  test("a path the level's table lacks fails the load, naming the material and the path", async () => {
    const lacking: FinishTable = new Map([
      ["housing", finishOf({ machine: { body: BODY, layers: [] } })],
    ]);
    const load = loadLevelGlb(glbOf(PAINTED_LEVEL), lacking, INTERIOR);
    await expect(load).rejects.toThrow(
      'material "finish/luminaire/strip/glow/line" names the finish "luminaire/strip"',
    );
  });
});

describe("the stage meshes of a painted GLB built by hand", () => {
  test("a stage material of a hall finish draws through one wrap that keeps its factors", async () => {
    const meshes = meshesByName(await loadLevelGlb(glbOf(PAINTED_LEVEL), FINISHES, INTERIOR));
    const [floor, ramp, tube, slab] = ["floor", "ramp", "tube", "hall-slab"].map((name) =>
      materialOf(meshes, name),
    );
    expect(ramp).toBe(floor);
    expect(new Set([floor, tube, slab]).size).toBe(3);
    for (const wrap of [floor, tube]) {
      if (!(wrap instanceof MeshStandardNodeMaterial)) throw new Error("Expected a node wrap");
      expect([wrap.name, wrap.color.toArray(), wrap.roughness]).toEqual([
        "Material.003",
        [0.5, 0.5, 0.5],
        0.8,
      ]);
    }
    expect([floor?.side, tube?.side]).toEqual([FrontSide, DoubleSide]);
    expect(slab).toBeInstanceOf(MeshStandardNodeMaterial);
  });

  test("a stage material without a finish or of a hall finish without a layer keeps its own", async () => {
    const meshes = meshesByName(await loadLevelGlb(glbOf(PAINTED_LEVEL), FINISHES, INTERIOR));
    for (const name of ["stage", "ceiling"]) {
      expect(materialOf(meshes, name)).not.toBeInstanceOf(MeshStandardNodeMaterial);
    }
  });

  test("a stage path the level's table lacks fails the load, naming the material", async () => {
    const lacking: FinishTable = new Map([...FINISHES].filter(([finish]) => finish !== "hall"));
    const load = loadLevelGlb(glbOf(PAINTED_LEVEL), lacking, INTERIOR);
    await expect(load).rejects.toThrow('material "Material.003" names the finish "hall/front"');
  });
});

test("a texture put on a level material gets anisotropy 8", () => {
  const map = new Texture();
  const emissiveMap = new Texture();
  const root = new Object3D();
  root.add(new Mesh(undefined, new MeshStandardMaterial({ map, emissiveMap })));
  applyMeshRules(root);
  expect([map.anisotropy, emissiveMap.anisotropy]).toEqual([8, 8]);
});
