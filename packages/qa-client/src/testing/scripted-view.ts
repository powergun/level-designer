import type { LevelViewInput, ViewFailure, ViewPose } from "@level-designer/level-view";
import type { PageView, ViewStart } from "../surroundings/index.js";

/**
 * How the scripted view answers a start: it starts, refuses or fails at one step, or holds the
 * start open until a test releases it, as a start still compiling does.
 */
export type ViewScript =
  | { readonly kind: "start" }
  | { readonly kind: "hold" }
  | { readonly kind: "refuse"; readonly message: string }
  | { readonly kind: "fail"; readonly step: "glb" | "renderer"; readonly message: string };

/** One drawn frame: the pose and the page's time in seconds. */
export interface ScriptedFrame {
  readonly pose: ViewPose;
  readonly time: number;
}

/** The frame rate the scripted view reports. */
const SCRIPTED_FRAME_RATE = 60;

/**
 * The scripted view: it answers the start as scripted, records each start input and every
 * frame, and fires a lost device or a GPU error into the page's failure callback on demand.
 */
export class ScriptedView implements PageView {
  readonly frameRate: number = SCRIPTED_FRAME_RATE;
  readonly inputs: LevelViewInput[] = [];
  readonly frames: ScriptedFrame[] = [];
  private broken: Error | null = null;
  private held: ((script: ViewScript) => void) | null = null;

  /** A view that answers every start by `script`. */
  constructor(private readonly script: ViewScript) {}

  /** The view starter the page calls. */
  readonly start: (input: LevelViewInput) => Promise<ViewStart> = (input) => {
    this.inputs.push(input);
    if (this.script.kind !== "hold") return Promise.resolve(this.outcome(this.script));
    return new Promise((resolve) => {
      this.held = (script) => resolve(this.outcome(script));
    });
  };

  /** Let a held start resolve by `script`, as started by default. */
  release(script: ViewScript = { kind: "start" }): void {
    if (this.held === null) throw new Error("no start is held");
    this.held(script);
  }

  /** Record one frame. */
  frame(pose: ViewPose, time: number): void {
    if (this.broken !== null) throw this.broken;
    this.frames.push({ pose, time });
  }

  /** Make every later frame throw `error`, as a render or physics step that breaks does. */
  breakFrames(error: Error): void {
    this.broken = error;
  }

  /** Fire a renderer failure into the failure callback of the last start. */
  fail(failure: ViewFailure): void {
    const input = this.inputs.at(-1);
    if (input === undefined) throw new Error("the scripted view was never started");
    input.onFailure(failure);
  }

  /** The start outcome of `script`; a held script answers as started. */
  private outcome(script: ViewScript): ViewStart {
    if (script.kind === "refuse") {
      const error = Object.assign(new Error(script.message), {
        name: "WebGpuRequiredError",
      } as const);
      return { kind: "refused", error };
    }
    if (script.kind === "fail") {
      return { kind: "failed", step: script.step, error: new Error(script.message) };
    }
    const quality = { tier: "high", msaaSamples: 4, reason: "scripted", gpu: "scripted" } as const;
    return { kind: "started", view: this, quality };
  }
}
