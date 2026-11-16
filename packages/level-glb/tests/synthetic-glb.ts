import type { GltfDocument } from "../src/container/index.js";
import { writeGlb } from "../src/container/index.js";

/** The base colour of the synthetic base's material. */
export const SYNTHETIC_COLOR = [0.5, 0.25, 1] as const;

/**
 * A hand-built base stage: the root `room` over the node `floor_0`, which moves the mesh
 * `floor` by +10 m in x. `floor` is one triangle, (0, 0, 0), (1, 0, 0), (0, 1, 0), with
 * unsigned short indices; it takes a material only when `withMaterial` is set.
 */
export function syntheticBase(withMaterial: boolean): Uint8Array {
  const positions = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
  const indices = new Uint16Array([0, 1, 2]);
  const bin = new Uint8Array(positions.byteLength + indices.byteLength);
  bin.set(new Uint8Array(positions.buffer), 0);
  bin.set(new Uint8Array(indices.buffer), positions.byteLength);
  const primitive = { attributes: { POSITION: 0 }, indices: 1 };
  const document: GltfDocument = {
    asset: { version: "2.0" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [
      { name: "room", children: [1] },
      { name: "floor_0", mesh: 0, matrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 10, 0, 0, 1] },
    ],
    meshes: [
      { name: "floor", primitives: [withMaterial ? { ...primitive, material: 0 } : primitive] },
    ],
    materials: [
      { name: "grey", pbrMetallicRoughness: { baseColorFactor: [...SYNTHETIC_COLOR, 1] } },
    ],
    accessors: [
      { bufferView: 0, componentType: 5126, count: 3, type: "VEC3" },
      { bufferView: 1, componentType: 5123, count: 3, type: "SCALAR" },
    ],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: positions.byteLength },
      { buffer: 0, byteOffset: positions.byteLength, byteLength: indices.byteLength },
    ],
    buffers: [{ byteLength: bin.byteLength }],
  };
  return writeGlb(document, bin);
}
