import { WEBGPU_REQUIREMENT } from "@level-designer/level-view";
import type { GpuLike } from "../surroundings/index.js";
import { messageOf } from "../transport/index.js";

/** What the WebGPU probe found: an adapter by its name, or why there is none. */
export type GpuProbe =
  | { readonly kind: "available"; readonly adapter: string }
  | { readonly kind: "missing"; readonly reason: string };

/**
 * The message of a browser without WebGPU: level-view's requirement sentence with what the probe
 * found, in the form of level-view's own refusal.
 */
export function webGpuMissing(reason: string): string {
  return `${WEBGPU_REQUIREMENT} (${reason})`;
}

/**
 * Probe the browser's WebGPU entry: absent, no adapter, a failed request, or an adapter with its
 * vendor, architecture, device and description for the run log.
 */
export async function probeGpu(gpu: GpuLike | undefined): Promise<GpuProbe> {
  if (gpu === undefined) return { kind: "missing", reason: "this browser has no navigator.gpu" };
  let adapter: Awaited<ReturnType<GpuLike["requestAdapter"]>>;
  try {
    adapter = await gpu.requestAdapter();
  } catch (thrown) {
    return { kind: "missing", reason: `the adapter request failed: ${messageOf(thrown)}` };
  }
  if (adapter === null) return { kind: "missing", reason: "the browser offers no WebGPU adapter" };
  if (adapter.info === undefined) {
    return { kind: "available", adapter: "an adapter that gives no description" };
  }
  const { vendor, architecture, device, description } = adapter.info;
  const name = [vendor, architecture, device, description]
    .filter((part) => part !== "")
    .join(" / ");
  return { kind: "available", adapter: name === "" ? "an unnamed adapter" : name };
}
