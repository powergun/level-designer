/**
 * The page program: it hands the real browser, `level-view` and sec-111's physics to `bootPage`
 * and decides nothing itself.
 */
import { startLevelView } from "@level-designer/level-view";
import { createPhysicsWorld } from "@level-designer/sec111-gateway";
import { bootPage } from "../src/index.js";

void bootPage({
  document,
  window,
  clock: () => Date.now(),
  timers: window,
  fetch: (path, init) => fetch(path, init),
  gpu: navigator.gpu,
  startView: startLevelView,
  startPhysics: createPhysicsWorld,
  console,
});
