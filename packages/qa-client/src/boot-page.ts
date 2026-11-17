import {
  clearColorOf,
  done,
  failed,
  probeGpu,
  readLevelFiles,
  readSession,
  runStep,
  type StepReport,
  startView,
  startWalk,
  webGpuMissing,
} from "./boot/index.js";
import { Display } from "./display/index.js";
import { copyConsole, PageLog, watchUncaught } from "./log/index.js";
import { MarkFlow } from "./marks/index.js";
import { KeyState, Motion } from "./motion/index.js";
import { type Drawing, type RunState, startFrameLoop, wireInput } from "./run/index.js";
import { type PageSurroundings, readRegions, type Regions } from "./surroundings/index.js";

/** Mark the page started for the boot watch, then set up the log, the display and the watchers. */
function openPage(surroundings: PageSurroundings): { regions: Regions; report: StepReport } {
  const regions = readRegions(surroundings.document);
  regions.status.dataset.boot = "started";
  const log = new PageLog(surroundings, surroundings.clock, (kind, text) =>
    display.alarm(kind, text),
  );
  const display = new Display(regions, log);
  copyConsole(surroundings.console, log);
  watchUncaught(surroundings.window, log);
  const { window } = surroundings;
  log.info(`page: ${window.navigator.userAgent}`);
  log.info(`window: ${window.innerWidth} x ${window.innerHeight}${window.location.search}`);
  return { regions, report: { display, log } };
}

/**
 * Boot the QA page in its fixed order: session facts, WebGPU probe, level files, level view, walk
 * world, input, frame loop. A failed step shows its message and ends the boot; a failed walk
 * world turns walk off and keeps fly.
 */
export async function bootPage(surroundings: PageSurroundings): Promise<void> {
  const { regions, report } = openPage(surroundings);
  const { display, log } = report;
  const session = await runStep(report, "session facts", () => readSession(surroundings, report));
  if (session === null) return;
  const adapter = await runStep(report, "WebGPU probe", async () => {
    const probe = await probeGpu(surroundings.gpu);
    if (probe.kind === "missing") return failed<string>(webGpuMissing(probe.reason));
    log.info(`WebGPU adapter: ${probe.adapter}`);
    return done(probe.adapter);
  });
  if (adapter === null) return;
  const files = await runStep(report, "level files", () => readLevelFiles(surroundings));
  if (files === null) return;
  const drawing: Drawing = { running: false, stopped: false };
  const clearColor = clearColorOf(surroundings.window.location.search);
  const view = await runStep(report, "level view", () =>
    startView(surroundings.startView, files, clearColor, report, drawing, regions.canvas),
  );
  if (view === null) return;
  const walk = await runStep(report, "walk world", () =>
    startWalk(surroundings.startPhysics, files, log),
  );
  if (walk === null) return;
  const walkOff = walk.kind === "walk-off" ? walk.reason : null;
  const keys = new KeyState();
  const run: RunState = {
    surroundings,
    regions,
    display,
    log,
    view,
    keys,
    motion: new Motion(keys, files.prepared, walk.kind === "walk" ? walk.walker : null),
    marks: new MarkFlow(regions, { display, log, transport: surroundings, run: session.run }),
    drawing,
    level: session.build,
    walkOff,
    clearColor,
  };
  await runStep(report, "input", () => Promise.resolve(done(wireInput(run))));
  await runStep(report, "frame loop", () => Promise.resolve(done(startFrameLoop(run))));
  drawing.running = true;
  if (drawing.stopped) display.status("drawing stopped; see the banner", "error");
  else if (walkOff === null) display.status("ready: click the view to capture the mouse");
  else display.status(`walk is off: ${walkOff}; fly stays`, "error");
}
