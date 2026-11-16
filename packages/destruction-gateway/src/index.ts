/**
 * destruction-gateway, runtime half: re-exports destruction lib's slab model, mesher, collision
 * scene, transforms, damage budget and Rapier backend straight from the sibling's sources.
 * TypeScript reads `types/index.d.ts` instead; see @packages/destruction-gateway/docs/KNOWLEDGE.md.
 */
export {
  createChunkGeometry,
  createDamageBudget,
  snapshotRetainedCuboids,
  WallModel,
} from "../../../../destruction-poc/packages/destruction-core/src/index.js";
export {
  CollisionScene,
  createPointContact,
  rotateVector,
  toLocalPoint,
  toWorldPoint,
} from "../../../../destruction-poc/packages/destruction-collision/src/index.js";
export { RapierBackend } from "../../../../destruction-poc/packages/destruction-physics/src/index.js";
