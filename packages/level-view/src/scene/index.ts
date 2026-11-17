/**
 * scene: the lighting mapping rules and the generic mesh rules as plain three.js scene
 * construction: the lights, the environment, the clear colour, the loaded GLB, the camera and
 * the look. Only the environment bake needs a renderer.
 */
export { createCamera, poseCamera } from "./camera.js";
export type { ViewPose } from "./camera.js";
export { dressScene } from "./dress.js";
export type { ClearColorChoice } from "./dress.js";
export { bakeEnvironment } from "./environment.js";
export { loadLevelGlb } from "./glb.js";
export type { InteriorBox } from "./lights.js";
export { levelLook } from "./look.js";
