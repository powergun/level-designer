import { PAGE_FILES, readLogAnswer, readSessionAnswer, ROUTES } from "../protocol/index.js";
import {
  type ErrorEventLike,
  REGION_IDS,
  REGION_MIN_HEIGHT,
  statusRegion,
  type WatchSurroundings,
} from "../surroundings/index.js";
import { getJson, messageOf, postJson, unanswered } from "../transport/index.js";

/** How long the page program has to start, ms. */
const START_TIMEOUT_MS = 10_000;

/** Whether the page program has started: `bootPage` marks the status strip first. */
function started(surroundings: WatchSurroundings): boolean {
  return statusRegion(surroundings.document)?.dataset.boot === "started";
}

/** Write the reason into the status strip, or into the body when the strip is missing. */
function show(surroundings: WatchSurroundings, text: string): void {
  const status = statusRegion(surroundings.document);
  if (status !== null) {
    status.style.minHeight = REGION_MIN_HEIGHT;
    status.textContent = text;
  } else if (surroundings.document.body !== null) {
    surroundings.document.body.textContent = text;
  }
}

/** Post the reason under the session's run, which the watch asks for itself. */
async function post(surroundings: WatchSurroundings, reason: string): Promise<void> {
  const reply = await getJson(surroundings, ROUTES.session);
  const read = reply.kind === "answered" ? readSessionAnswer(reply.body) : null;
  if (read === null || !read.ok) {
    const why = reply.kind === "answered" ? "the session facts do not read" : unanswered(reply);
    show(surroundings, `${reason}; the run log is out of reach (${why})`);
    return;
  }
  const line = {
    time: surroundings.clock(),
    level: "error",
    text: `boot watch: ${reason}`,
  } as const;
  const sent = await postJson(surroundings, ROUTES.log, { run: read.value.run, lines: [line] });
  if (sent.kind !== "answered") {
    show(surroundings, `${reason}; the run log is out of reach (${unanswered(sent)})`);
    return;
  }
  const answer = readLogAnswer(sent.body);
  if (!answer.ok || answer.value.kind === "refused" || answer.value.logFailure !== null) {
    show(surroundings, `${reason}; the run log did not take the line`);
  }
}

/** The reason of an error event before the start: the program's script failed to load, or threw. */
function errorReason(event: ErrorEventLike): string {
  const target: unknown = event.target;
  const id = typeof target === "object" && target !== null ? Reflect.get(target, "id") : undefined;
  if (id === REGION_IDS.programScript) {
    return `the page program failed to load: ${PAGE_FILES.program.route}`;
  }
  const detail =
    event.error === null || event.error === undefined ? event.message : messageOf(event.error);
  return `the page program failed to start: ${detail}`;
}

/**
 * The boot watch, bundled apart from the page program so it runs without it. Until the program
 * marks the start, a failed script load, an uncaught error or rejection, or 10 s without a start
 * write the reason into the document and post it to the run log under the session's run. It
 * reports once.
 */
export function watchBoot(surroundings: WatchSurroundings): void {
  let reported = false;
  const report = (reason: string): void => {
    if (reported || started(surroundings)) return;
    reported = true;
    show(surroundings, reason);
    void post(surroundings, reason);
  };
  const { window, timers } = surroundings;
  window.addEventListener("error", (event) => report(errorReason(event)), true);
  window.addEventListener("unhandledrejection", (event) =>
    report(`the page program failed to start: ${messageOf(event.reason)}`),
  );
  timers.setTimeout(() => {
    report(`the page program did not start within ${START_TIMEOUT_MS / 1000} s`);
  }, START_TIMEOUT_MS);
}
