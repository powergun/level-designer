import type { ViewFailure } from "@level-designer/level-view";
import { LEVEL_FILES } from "../protocol/index.js";
import type { Drawing } from "../run/index.js";
import type { PageCanvas, PageView, ViewStarter } from "../surroundings/index.js";
import type { LevelFiles } from "./files.js";
import { done, failed, type StepOutcome, type StepReport } from "./steps.js";

/** The label of a renderer failure, from its kind; level-view's message carries no label. */
function failureLabel(failure: ViewFailure): string {
  return failure.kind === "device-lost" ? "GPU device lost" : "GPU error";
}

/** The clear colour choice of the address query: `?leak=1` swaps in the loud colour. */
export function clearColorOf(search: string): "leak" | "game" {
  return new URLSearchParams(search).get("leak") === "1" ? "leak" : "game";
}

/**
 * Start the level view on the level files. A refusal names the WebGPU requirement; a GLB that
 * does not load names its file; any other start failure shows the renderer's error text. After
 * the start, a lost device or a GPU error raises the alarm and stops the drawing; once the page
 * runs, the status strip says so too, while a boot step still running keeps its name there.
 */
export async function startView(
  start: ViewStarter,
  files: LevelFiles,
  clearColor: "leak" | "game",
  report: StepReport,
  drawing: Drawing,
  canvas: PageCanvas & HTMLCanvasElement,
): Promise<StepOutcome<PageView>> {
  const { display, log } = report;
  log.info(`level view: clear colour ${clearColor}`);
  const outcome = await start({
    canvas,
    glb: files.glb,
    lighting: files.level.lighting,
    interior: files.prepared.metrics.interior,
    clearColor,
    onFailure: (failure) => {
      drawing.stopped = true;
      const label = failureLabel(failure);
      log.alarmed("drawing", `${label}: ${failure.message}; drawing stopped`);
      if (drawing.running) display.status(`drawing stopped: ${label}; see the banner`, "error");
    },
  });
  if (outcome.kind === "refused") return failed(outcome.error.message);
  if (outcome.kind === "failed" && outcome.step === "glb") {
    return failed(`level file ${LEVEL_FILES.glb} failed: ${outcome.error.message}`);
  }
  if (outcome.kind === "failed") return failed(`level view failed: ${outcome.error.message}`);
  const { tier, msaaSamples, reason, gpu } = outcome.quality;
  log.info(`level view: quality ${tier}, msaa ${msaaSamples}, ${reason}, gpu ${gpu}`);
  return done(outcome.view);
}
