/**
 * level-glb: the GLB contract of the level designer. It assembles the static and level scenes
 * as one-buffer GLB bytes, inspects a GLB and reads its world-space triangles; see
 * @packages/level-glb/docs/KNOWLEDGE.md.
 */
export { assembleLevelScene, assembleStaticScene } from "./assembly/index.js";
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
} from "./assembly/index.js";
export { inspectGlb, readWorldTriangles } from "./inspection/index.js";
export type { GlbInspection, WorldTriangles } from "./inspection/index.js";
