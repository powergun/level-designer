import type { RendererContext } from "@level-designer/render-gateway";
import type { WebGPURenderer } from "three/webgpu";
import { describeGpuError, type FailureCallback } from "./failure.js";
import { webGpuRequired, type WebGpuRequiredError } from "./webgpu-required-error.js";

/** The part of a started renderer that the admission reads and sets. */
export interface StartedRenderer {
  readonly backend: RendererContext["backend"];
  readonly renderer: Pick<WebGPURenderer, "onDeviceLost" | "onError" | "dispose">;
}

/**
 * Admit a started renderer: a WebGL fallback is released and refused; a WebGPU renderer gets
 * both failure hooks, so a lost device or a GPU error from here on reaches `onFailure`. The
 * device-lost hook runs three's own handler first, which marks the renderer lost.
 */
export async function admitRenderer(
  started: StartedRenderer,
  onFailure: FailureCallback,
): Promise<WebGpuRequiredError | null> {
  const { renderer } = started;
  if (started.backend !== "webgpu") {
    await renderer.dispose();
    return webGpuRequired(`the renderer fell back to ${started.backend}`);
  }
  const threeOnDeviceLost = renderer.onDeviceLost;
  renderer.onDeviceLost = (info): void => {
    threeOnDeviceLost.call(renderer, info);
    const reason = info.reason === null ? "" : ` (${info.reason})`;
    onFailure({ kind: "device-lost", message: `${info.message}${reason}` });
  };
  renderer.onError = (info: unknown): void => {
    onFailure({ kind: "gpu-error", message: describeGpuError(info) });
  };
  return null;
}
