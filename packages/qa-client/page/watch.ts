/**
 * The boot watch's page script, bundled apart from the page program: it hands the real browser
 * to `watchBoot` and decides nothing itself.
 */
import { watchBoot } from "../src/watch/index.js";

watchBoot({
  document,
  window,
  clock: () => Date.now(),
  timers: window,
  fetch: (path, init) => fetch(path, init),
});
