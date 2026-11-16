/**
 * sec111-gateway, stage entry: the Bun-side bridge to sec-111's level preparation. It
 * re-exports `prepareLevel` and adds the reader of the base stage file; see
 * @packages/sec111-gateway/docs/KNOWLEDGE.md.
 */
export { prepareLevel } from "../../../../../sec-111/tools/level-prep/src/index.js";
export { readBaseStage } from "./readers.js";
