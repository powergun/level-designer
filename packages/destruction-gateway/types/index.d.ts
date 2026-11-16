/**
 * destruction-gateway, type half: the names of `src/index.ts`, typed by the declarations that
 * `emit.ts` generates from destruction lib with its own compiler settings.
 */
export {
  createChunkGeometry,
  createDamageBudget,
  snapshotRetainedCuboids,
  WallModel,
} from "../generated/destruction-core/src/index.js";
export type { MaterialId, MeshData } from "../generated/destruction-core/src/index.js";
export {
  CollisionScene,
  createPointContact,
  rotateVector,
  toLocalPoint,
  toWorldPoint,
} from "../generated/destruction-collision/src/index.js";
export type { RigidTransform } from "../generated/destruction-collision/src/index.js";
export { RapierBackend } from "../generated/destruction-physics/src/index.js";
