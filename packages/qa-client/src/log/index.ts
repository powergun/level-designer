/**
 * log: the page side of the run log: page lines in batches under the booted run, the copy of
 * console errors and warnings, and the alarm for console errors, uncaught errors, rejections
 * and log failures.
 */
export { describe, PageLog, UNLOGGED } from "./page-log.js";
export type { AlarmKind } from "./page-log.js";
export { copyConsole, watchUncaught } from "./watchers.js";
