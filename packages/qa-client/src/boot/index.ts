/**
 * boot: the boot steps before the page runs, each logged at its start and its outcome and named
 * in the status strip: the session facts, the WebGPU probe, the level files, the level view and
 * the walk world.
 */
export { readLevelFiles } from "./files.js";
export { probeGpu, webGpuMissing } from "./gpu.js";
export { readSession } from "./session.js";
export { done, failed, runStep } from "./steps.js";
export type { StepReport } from "./steps.js";
export { clearColorOf, startView } from "./view.js";
export { startWalk } from "./walk.js";
