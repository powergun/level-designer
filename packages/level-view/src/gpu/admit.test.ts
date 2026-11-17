import { describe, expect, test } from "bun:test";
import { admitRenderer, type StartedRenderer } from "./admit.js";
import type { ViewFailure } from "./failure.js";
import { WEBGPU_REQUIREMENT, WebGpuRequiredError } from "./webgpu-required-error.js";

/** A device loss as the WebGPU backend reports it. */
const LOSS = {
  api: "WebGPU",
  message: "GPU process crashed",
  reason: "unknown",
  originalEvent: null,
} as const;

/**
 * A started renderer as the library reports it, recording whether it was released and every
 * call of three's own device-lost handler, which marks the renderer lost.
 */
function started(backend: StartedRenderer["backend"]) {
  const record = { disposed: 0, threeLosses: [] as unknown[] };
  const renderer: StartedRenderer["renderer"] = {
    onDeviceLost: (info) => {
      record.threeLosses.push(info);
    },
    onError: () => {},
    dispose: () => {
      record.disposed += 1;
      return Promise.resolve();
    },
  };
  return { record, started: { backend, renderer } };
}

test("a renderer that fell back to WebGL is released and refused with the typed error", async () => {
  const { record, started: fallback } = started("webgl2");
  const failures: ViewFailure[] = [];
  const refusal = await admitRenderer(fallback, (failure) => failures.push(failure));
  expect(refusal).toBeInstanceOf(WebGpuRequiredError);
  expect(refusal?.message.startsWith(`${WEBGPU_REQUIREMENT} (`)).toBe(true);
  expect(refusal?.message).toContain("webgl2");
  expect(record.disposed).toBe(1);
  expect(failures).toEqual([]);
});

describe("an admitted WebGPU renderer", () => {
  test("is kept", async () => {
    const { record, started: gpu } = started("webgpu");
    expect(await admitRenderer(gpu, () => {})).toBeNull();
    expect(record.disposed).toBe(0);
  });

  test("reports a fired device-lost hook to the failure callback once, after three's own", async () => {
    const { record, started: gpu } = started("webgpu");
    const failures: ViewFailure[] = [];
    await admitRenderer(gpu, (failure) => {
      expect(record.threeLosses).toEqual([LOSS]);
      failures.push(failure);
    });
    gpu.renderer.onDeviceLost(LOSS);
    expect(record.threeLosses).toEqual([LOSS]);
    expect(failures).toHaveLength(1);
    expect(failures[0]?.kind).toBe("device-lost");
    expect(failures[0]?.message).toBe("GPU process crashed (unknown)");
  });

  test("reports a fired error hook, in the backend's object shape, to the failure callback once", async () => {
    const { started: gpu } = started("webgpu");
    const failures: ViewFailure[] = [];
    await admitRenderer(gpu, (failure) => failures.push(failure));
    const info = { api: "WebGPU", type: "GPUValidationError", message: "bad bind group" };
    Reflect.apply(gpu.renderer.onError, gpu.renderer, [{ ...info, originalEvent: null }]);
    expect(failures).toHaveLength(1);
    expect(failures[0]?.kind).toBe("gpu-error");
    expect(failures[0]?.message).toBe("GPUValidationError: bad bind group");
  });
});
