import {
  createRenderer,
  NoGraphicsError,
  type RendererContext,
} from "@level-designer/render-gateway";
import { GAME_VALUES } from "@level-designer/sec111-gateway";
import { admitRenderer } from "./admit.js";
import type { FailureCallback } from "./failure.js";
import { webGpuRequired, type WebGpuRequiredError } from "./webgpu-required-error.js";

/** An opened renderer on WebGPU with its hooks set, or the refusal of this start. */
export type OpenedRenderer =
  | { readonly kind: "opened"; readonly context: RendererContext }
  | { readonly kind: "refused"; readonly error: WebGpuRequiredError };

/**
 * Start the library's renderer on the canvas at the window's size, with the game's pixel-ratio
 * cap, and admit it. A browser without any graphics backend is refused like a WebGL fallback.
 */
export async function openRenderer(
  canvas: HTMLCanvasElement,
  onFailure: FailureCallback,
): Promise<OpenedRenderer> {
  const viewport = {
    width: Math.max(1, window.innerWidth),
    height: Math.max(1, window.innerHeight),
    pixelRatio: window.devicePixelRatio || 1,
  };
  let context: RendererContext;
  try {
    context = await createRenderer(canvas, {
      forceWebGL: false,
      trackTimestamp: false,
      pixelRatioCap: GAME_VALUES.page.pixelRatioCap,
      viewport,
    });
  } catch (error) {
    if (!(error instanceof NoGraphicsError)) throw error;
    return { kind: "refused", error: webGpuRequired("no graphics backend", error) };
  }
  const refusal = await admitRenderer(context, onFailure);
  return refusal === null ? { kind: "opened", context } : { kind: "refused", error: refusal };
}
