import { describe, expect, test } from "bun:test";
import { runStart, type StartSteps } from "./run-start.js";

/** The renderer stand-in: a context whose release is recorded, or rejects when told. */
interface FakeContext {
  readonly renderer: { dispose(): Promise<void> };
}

/** The open step's refusal: the gpu unit's typed error, by its shape. */
const REFUSAL = Object.assign(new Error("needs WebGPU"), { name: "WebGpuRequiredError" as const });

/** How each fake step behaves; a step given a thrown value throws it. */
interface Script {
  readonly refuse?: boolean;
  readonly openThrows?: unknown;
  readonly loadThrows?: unknown;
  readonly presentThrows?: unknown;
  readonly warmThrows?: unknown;
  readonly disposeRejects?: Error;
}

/** Throw the scripted value, whatever it is. */
function fail(thrown: unknown): never {
  throw thrown;
}

/** Fake start steps that log each step and effect in the order it happens. */
function scripted(script: Script) {
  const log: string[] = [];
  const context: FakeContext = {
    renderer: {
      dispose: () => {
        log.push("dispose");
        return script.disposeRejects ? Promise.reject(script.disposeRejects) : Promise.resolve();
      },
    },
  };
  const steps: StartSteps<FakeContext, "level", { view: "view" }> = {
    open: () => {
      log.push("open");
      if (script.openThrows !== undefined) fail(script.openThrows);
      if (script.refuse === true) return Promise.resolve({ kind: "refused", error: REFUSAL });
      return Promise.resolve({ kind: "opened", context });
    },
    load: () => {
      log.push("load");
      if (script.loadThrows !== undefined) fail(script.loadThrows);
      return Promise.resolve("level");
    },
    present: (opened, level) => {
      log.push(`present ${opened === context} ${level}`);
      if (script.presentThrows !== undefined) fail(script.presentThrows);
      return {
        ready: { view: "view" },
        detach: () => log.push("detach"),
        warm: () => {
          log.push("warm");
          return script.warmThrows === undefined
            ? Promise.resolve()
            : Promise.reject(script.warmThrows);
        },
      };
    },
  };
  return { steps, log };
}

test("a start whose steps all succeed is started with what the present step hands out", async () => {
  const { steps, log } = scripted({});
  expect(await runStart(steps)).toEqual({ kind: "started", view: "view" });
  expect(log).toEqual(["open", "load", "present true level", "warm"]);
});

test("a refusal passes through, and nothing is loaded", async () => {
  const { steps, log } = scripted({ refuse: true });
  const outcome = await runStart(steps);
  expect(outcome.kind).toBe("refused");
  expect(outcome.kind === "refused" ? outcome.error.message : "").toBe("needs WebGPU");
  expect(log).toEqual(["open"]);
});

describe("a failed step", () => {
  test("in the open fails the renderer step", async () => {
    const { steps, log } = scripted({ openThrows: new Error("no adapter") });
    expect(await runStart(steps)).toEqual({
      kind: "failed",
      step: "renderer",
      error: new Error("no adapter"),
    });
    expect(log).toEqual(["open"]);
  });

  test("in the load fails the glb step, releases the renderer once and presents nothing", async () => {
    const { steps, log } = scripted({ loadThrows: new SyntaxError("not a GLB") });
    const outcome = await runStart(steps);
    expect(outcome).toMatchObject({ kind: "failed", step: "glb" });
    expect(outcome.kind === "failed" ? outcome.error : null).toBeInstanceOf(SyntaxError);
    expect(log).toEqual(["open", "load", "dispose"]);
  });

  test("in the present fails the renderer step and releases the renderer once", async () => {
    const { steps, log } = scripted({ presentThrows: new Error("pipeline") });
    expect(await runStart(steps)).toMatchObject({ kind: "failed", step: "renderer" });
    expect(log).toEqual(["open", "load", "present true level", "dispose"]);
  });

  test("in the warm-up fails the renderer step, detaches the resize and releases once", async () => {
    const { steps, log } = scripted({ warmThrows: new Error("compile") });
    expect(await runStart(steps)).toMatchObject({ kind: "failed", step: "renderer" });
    expect(log).toEqual(["open", "load", "present true level", "warm", "detach", "dispose"]);
  });
});

test("a release that rejects still resolves failed, naming both failures", async () => {
  const { steps } = scripted({
    loadThrows: new Error("truncated GLB"),
    disposeRejects: new Error("device gone"),
  });
  const outcome = await runStart(steps);
  expect(outcome).toMatchObject({ kind: "failed", step: "glb" });
  const message = outcome.kind === "failed" ? outcome.error.message : "";
  expect(message).toContain("truncated GLB");
  expect(message).toContain("device gone");
});

test("a thrown value that is not an Error becomes an Error with its text", async () => {
  const { steps } = scripted({ presentThrows: "shader text" });
  const outcome = await runStart(steps);
  expect(outcome.kind === "failed" ? outcome.error : null).toEqual(new Error("shader text"));
});
