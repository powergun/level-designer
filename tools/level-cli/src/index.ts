/**
 * level-cli: the command-line tool of the level designer, with its argument parsing, its file
 * writes under the work directory, its report text and its exit statuses; see
 * @tools/level-cli/docs/KNOWLEDGE.md.
 */
export type { Pipeline, Streams } from "./commands/index.js";
export { run } from "./run.js";
