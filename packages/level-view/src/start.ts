import type { FinishTable } from "@level-designer/level-format";
import { type FailureCallback, openRenderer } from "./gpu/index.js";
import { type PresentFacts, presentLevel, type ReadyView } from "./present.js";
import { runStart, type StartOutcome } from "./run-start.js";
import { loadLevelGlb } from "./scene/index.js";

/** What the start draws and where it reports a renderer failure. */
export interface LevelViewInput extends PresentFacts {
  readonly canvas: HTMLCanvasElement;
  /** The level GLB's bytes. */
  readonly glb: Uint8Array;
  /** The level's finish table, from which the painted twins draw. */
  readonly finishes: FinishTable;
  /** Receives a lost device or a GPU error, from the renderer's admission on. */
  readonly onFailure: FailureCallback;
}

/**
 * The outcome of a start: started with the view and the quality; refused without WebGPU; or
 * failed at the GLB parse or at a later renderer step.
 */
export type LevelViewStart = StartOutcome<ReadyView>;

/**
 * Start the view on WebGPU: open and admit the renderer, load the GLB with the mesh rules,
 * then present the level and warm it up. The promise never rejects.
 */
export function startLevelView(input: LevelViewInput): Promise<LevelViewStart> {
  return runStart({
    open: () => openRenderer(input.canvas, input.onFailure),
    load: () => loadLevelGlb(input.glb, input.finishes, input.interior),
    present: (context, level) => presentLevel(context, level, input),
  });
}
