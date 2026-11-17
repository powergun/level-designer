import type { WebGpuRequiredError } from "./gpu/index.js";

/** An opened renderer that a failed start releases. */
export interface Releasable {
  readonly renderer: { dispose(): Promise<void> };
}

/** The presented level: what a start hands out, the resize detach and the warm-up still to run. */
export interface Presented<Ready> {
  readonly ready: Ready;
  /** Remove the window resize listener the present step attached. */
  detach(): void;
  /** Compile against the complete light set and render the warm-up frames. */
  warm(): Promise<void>;
}

/** The three steps of a start: open and admit the renderer, load the GLB, present the level. */
export interface StartSteps<Opened extends Releasable, Level, Ready> {
  open(): Promise<
    | { readonly kind: "opened"; readonly context: Opened }
    | { readonly kind: "refused"; readonly error: WebGpuRequiredError }
  >;
  load(): Promise<Level>;
  present(context: Opened, level: Level): Presented<Ready>;
}

/** The outcome of a start; `Ready` is what a started view hands out. */
export type StartOutcome<Ready> =
  | ({ readonly kind: "started" } & Ready)
  | { readonly kind: "refused"; readonly error: WebGpuRequiredError }
  | { readonly kind: "failed"; readonly step: "glb" | "renderer"; readonly error: Error };

/** The failure of one start step. */
type Failed = Extract<StartOutcome<never>, { kind: "failed" }>;

/** The thrown value as an `Error`, keeping an `Error` as it is. */
function asError(thrown: unknown): Error {
  return thrown instanceof Error ? thrown : new Error(String(thrown));
}

/**
 * Release the renderer of a failed start. A release that fails too joins the step's failure
 * in one error, so the start still resolves and reports both.
 */
async function failReleasing(
  context: Releasable,
  step: Failed["step"],
  thrown: unknown,
): Promise<Failed> {
  const error = asError(thrown);
  try {
    await context.renderer.dispose();
    return { kind: "failed", step, error };
  } catch (released) {
    const message = `${error.message}; releasing the renderer failed too: ${asError(released).message}`;
    return { kind: "failed", step, error: new Error(message, { cause: error }) };
  }
}

/** Present the loaded level and warm it up; a warm-up failure detaches the resize first. */
async function presentAndWarm<Opened extends Releasable, Level, Ready>(
  steps: StartSteps<Opened, Level, Ready>,
  context: Opened,
  level: Level,
): Promise<StartOutcome<Ready>> {
  let presented: Presented<Ready>;
  try {
    presented = steps.present(context, level);
  } catch (thrown) {
    return failReleasing(context, "renderer", thrown);
  }
  try {
    await presented.warm();
  } catch (thrown) {
    presented.detach();
    return failReleasing(context, "renderer", thrown);
  }
  return { kind: "started", ...presented.ready };
}

/**
 * Run a start's steps in order and decide its outcome: a refusal passes through, a throw in
 * the GLB load fails step `glb`, any other throw fails step `renderer`, and every failure after
 * the open releases the renderer. The promise never rejects.
 */
export async function runStart<Opened extends Releasable, Level, Ready>(
  steps: StartSteps<Opened, Level, Ready>,
): Promise<StartOutcome<Ready>> {
  let context: Opened;
  try {
    const opened = await steps.open();
    if (opened.kind === "refused") return opened;
    context = opened.context;
  } catch (thrown) {
    return { kind: "failed", step: "renderer", error: asError(thrown) };
  }
  let level: Level;
  try {
    level = await steps.load();
  } catch (thrown) {
    return failReleasing(context, "glb", thrown);
  }
  return presentAndWarm(steps, context, level);
}
