/**
 * level-view: draws a level pair through the rendering-poc pipeline with the game's look and
 * the level's lighting. Its start takes the canvas, the GLB bytes, the lighting, the interior
 * box, the clear colour choice and a failure callback; see @packages/level-view/docs/KNOWLEDGE.md.
 */
export { WEBGPU_REQUIREMENT } from "./gpu/index.js";
export type { ViewFailure } from "./gpu/index.js";
export type { RenderQuality } from "./present.js";
export type { ViewPose } from "./scene/index.js";
export { startLevelView } from "./start.js";
export type { LevelViewInput, LevelViewStart } from "./start.js";
