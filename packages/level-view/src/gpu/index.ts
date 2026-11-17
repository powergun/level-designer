/**
 * gpu: the renderer boundary. It starts the library's renderer on WebGPU only, refuses a WebGL
 * fallback with the component's own typed error, and routes a lost device and a GPU error to
 * the caller's failure callback.
 */
export type { FailureCallback, ViewFailure } from "./failure.js";
export { openRenderer } from "./open.js";
export { WEBGPU_REQUIREMENT } from "./webgpu-required-error.js";
export type { WebGpuRequiredError } from "./webgpu-required-error.js";
