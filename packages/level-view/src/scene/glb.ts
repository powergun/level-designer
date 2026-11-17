import type { Group } from "three/webgpu";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { applyMeshRules } from "./meshes.js";

/** Parse the level GLB bytes into a scene with the mesh rules applied. */
export async function loadLevelGlb(bytes: Uint8Array): Promise<Group> {
  const gltf = await new GLTFLoader().parseAsync(bytes.slice().buffer, "");
  applyMeshRules(gltf.scene);
  return gltf.scene;
}
