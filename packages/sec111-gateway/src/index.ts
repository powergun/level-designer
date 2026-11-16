/**
 * sec111-gateway, main entry: the browser-safe bridge to sec-111. It re-exports the prepared
 * level contract and the physics world straight from sec-111's sources, and owns the game
 * values the QA app copies; see @packages/sec111-gateway/docs/KNOWLEDGE.md.
 */
export {
  BODY_BOX_LIMIT,
  decodePreparedLevel,
  floorHeightAt,
  PLAYER_BODY,
} from "../../../../sec-111/engine/level-data/src/index.js";
export type { PreparedLevel } from "../../../../sec-111/engine/level-data/src/index.js";
export { GAME_VALUES } from "./game-values.js";
export { createPhysicsWorld } from "../../../../sec-111/engine/physics/src/index.js";
export type {
  BlockerSet,
  CapsuleBody,
  PhysicsWorld,
} from "../../../../sec-111/engine/physics/src/index.js";
