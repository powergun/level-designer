/** The refusal of a start without WebGPU: no WebGPU API, no usable adapter, or a WebGL fallback. */
export class WebGpuRequiredError extends Error {
  override readonly name = "WebGpuRequiredError";
}

/** The requirement the page shows wherever it finds no WebGPU; a refusal adds its detail. */
export const WEBGPU_REQUIREMENT: string =
  "The QA view needs WebGPU: a current desktop Chrome with hardware acceleration, " +
  "on http://127.0.0.1";

/** Build the refusal for one start, naming the requirement and what this start found. */
export function webGpuRequired(detail: string, cause?: unknown): WebGpuRequiredError {
  return new WebGpuRequiredError(`${WEBGPU_REQUIREMENT} (${detail})`, { cause });
}
