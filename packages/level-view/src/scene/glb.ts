import type { FinishTable } from "@level-designer/level-format";
import type { Group } from "three/webgpu";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { paintLevel } from "../paint/index.js";
import type { InteriorBox } from "./lights.js";
import { applyMeshRules } from "./meshes.js";

/**
 * Parse the level GLB bytes into a scene, paint each painted material from the level's finish
 * table on the interior box, then apply the mesh rules to every mesh, painted ones included.
 */
export async function loadLevelGlb(
  bytes: Uint8Array,
  finishes: FinishTable,
  interior: InteriorBox,
): Promise<Group> {
  const gltf = await new GLTFLoader().parseAsync(bytes.slice().buffer, "");
  const { min, max } = interior;
  const size = [max[0] - min[0], max[1] - min[1], max[2] - min[2]] as const;
  paintLevel(gltf.scene, finishes, { low: min, size });
  applyMeshRules(gltf.scene);
  return gltf.scene;
}
