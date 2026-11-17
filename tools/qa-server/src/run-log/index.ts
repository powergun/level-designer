/**
 * run-log: the run log of one server run, one timestamped line per event from the start facts
 * to the last line, and the local time format that the run log and the marks share.
 */
export { localTime } from "./local-time.js";
export { openRunLog, RunLog } from "./run-log.js";
export type { LineSource, LogLevel } from "./run-log.js";
