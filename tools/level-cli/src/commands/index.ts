/**
 * commands: the four commands of the tool over an injected pipeline: what each reads, prints
 * and writes under the work directory, and the exit status it ends with.
 */
export { build, kinds, snapshot, validate } from "./commands.js";
export type { ExitStatus, Pipeline, Streams } from "./pipeline.js";
