/**
 * assembly: the static scene (the scaled base stage with its look, then the seals) and the
 * level scene (the static scene, then one static object per placed box, then one destructible
 * object per prop), written as GLB bytes.
 */
export { assembleLevelScene } from "./level-scene.js";
export { assembleStaticScene } from "./static-scene.js";
export type {
  BaseLook,
  BaseNameError,
  BoxPaint,
  PlacedBox,
  PropMeshes,
  SealBox,
  SlabLooks,
  SlabMesh,
  StaticBox,
  StaticScene,
} from "./inputs.js";
