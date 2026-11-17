/**
 * qa-server: the loopback server of the QA app. It builds the committed description once,
 * serves the page of qa-client and the level, appends marks to the marks file and writes one
 * run log per run; see @tools/qa-server/docs/KNOWLEDGE.md.
 */
export { run } from "./run.js";
export { qaClientPageFile } from "./start/index.js";
export type { Pipeline } from "./start/index.js";
export type { ExitStatus, Surroundings } from "./surroundings.js";
