import { describe, expect, test } from "bun:test";
import { DoubleSide, FrontSide, Mesh, MeshStandardMaterial, Object3D, Texture } from "three/webgpu";
import { loadLevelGlb } from "./glb.js";
import { applyMeshRules } from "./meshes.js";

/** One triangle's positions and indices, shared by both meshes of the fixture. */
const TRIANGLE = { positions: [0, 0, 0, 1, 0, 0, 0, 1, 0], indices: [0, 1, 2] };

/** A glTF JSON chunk: a parent node moved by +X 4 with a child mesh moved by +Y 2, and a root mesh. */
function gltfJson(binLength: number): object {
  return {
    asset: { version: "2.0" },
    scene: 0,
    scenes: [{ nodes: [0, 2] }],
    nodes: [
      { name: "parent", translation: [4, 0, 0], children: [1] },
      { name: "parent/0", translation: [0, 2, 0], mesh: 0 },
      { name: "root/0", translation: [0, 0, -3], mesh: 1 },
    ],
    meshes: [0, 1].map((material) => ({
      primitives: [{ attributes: { POSITION: 0 }, indices: 1, material }],
    })),
    materials: [
      { name: "single", doubleSided: false },
      { name: "double", doubleSided: true },
    ],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: 3,
        type: "VEC3",
        min: [0, 0, 0],
        max: [1, 1, 0],
      },
      { bufferView: 1, componentType: 5125, count: 3, type: "SCALAR" },
    ],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: 36 },
      { buffer: 0, byteOffset: 36, byteLength: 12 },
    ],
    buffers: [{ byteLength: binLength }],
  };
}

/** A texture-free GLB container: header, padded JSON chunk, BIN chunk. */
function fixtureGlb(): Uint8Array {
  const positions = new Float32Array(TRIANGLE.positions);
  const indices = new Uint32Array(TRIANGLE.indices);
  const bin = new Uint8Array(positions.byteLength + indices.byteLength);
  bin.set(new Uint8Array(positions.buffer), 0);
  bin.set(new Uint8Array(indices.buffer), positions.byteLength);
  const text = JSON.stringify(gltfJson(bin.length));
  const json = new TextEncoder().encode(text.padEnd(Math.ceil(text.length / 4) * 4));
  const glb = new Uint8Array(12 + 8 + json.length + 8 + bin.length);
  const view = new DataView(glb.buffer);
  view.setUint32(0, 0x46546c67, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, glb.length, true);
  view.setUint32(12, json.length, true);
  view.setUint32(16, 0x4e4f534a, true);
  glb.set(json, 20);
  view.setUint32(20 + json.length, bin.length, true);
  view.setUint32(24 + json.length, 0x004e4942, true);
  glb.set(bin, 28 + json.length);
  return glb;
}

/** The meshes of a scene by name. */
function meshesByName(root: Object3D): Map<string, Mesh> {
  const meshes = new Map<string, Mesh>();
  root.traverse((object) => {
    if (object instanceof Mesh) meshes.set(object.name, object);
  });
  return meshes;
}

describe("a texture-free GLB built by hand", () => {
  test("loads with every mesh casting and receiving shadows with two-sided shadow faces", async () => {
    const meshes = meshesByName(await loadLevelGlb(fixtureGlb()));
    expect([...meshes.keys()]).toEqual(["parent0", "root0"]);
    for (const mesh of meshes.values()) {
      expect([mesh.castShadow, mesh.receiveShadow]).toEqual([true, true]);
      expect(mesh.material).toMatchObject({ shadowSide: DoubleSide });
    }
    expect(meshes.get("parent0")?.material).toMatchObject({ side: FrontSide });
    expect(meshes.get("root0")?.material).toMatchObject({ side: DoubleSide });
  });

  test("loads with frozen matrices at the nodes' world placement", async () => {
    const level = await loadLevelGlb(fixtureGlb());
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

test("a texture put on a level material gets anisotropy 8", () => {
  const map = new Texture();
  const emissiveMap = new Texture();
  const root = new Object3D();
  root.add(new Mesh(undefined, new MeshStandardMaterial({ map, emissiveMap })));
  applyMeshRules(root);
  expect([map.anisotropy, emissiveMap.anisotropy]).toEqual([8, 8]);
});
