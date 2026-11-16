/**
 * level-pipeline: the one build sequence from a level description to a built level, and the
 * validation of a built level into a report; see @tools/level-pipeline/docs/KNOWLEDGE.md.
 */
export { buildLevel } from "./sequence/index.js";
export type {
  BuildError,
  BuildInputs,
  BuildOutcome,
  BuiltLevel,
  PreparedStatic,
} from "./sequence/index.js";
export { COMMITTED_DESCRIPTION, readInputs } from "./read.js";
export type { ReadOutcome } from "./read.js";
export { validateLevel } from "./validation/index.js";
export type { Report } from "./validation/index.js";
