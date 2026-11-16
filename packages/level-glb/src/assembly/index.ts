/**
 * assembly: the static scene (the scaled base stage with its look, then the seals) and the
 * level scene (the static scene, then one destructible object per prop), written as GLB bytes.
 */
export { assembleLevelScene } from "./level-scene.js";
export { assembleStaticScene } from "./static-scene.js";
export type {
  BaseLook,
  BaseNameError,
  PropMeshes,
  SealBox,
  SlabLooks,
  SlabMesh,
  StaticScene,
} from "./inputs.js";
