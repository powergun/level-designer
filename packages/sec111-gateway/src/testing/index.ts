/**
 * sec111-gateway, testing entry: Bun-side test support only. It re-exports sec-111's own
 * readers of its committed prepared level, typed and as its two files, which tests use as
 * real hall data without a preparation; no build reads them. See
 * @packages/sec111-gateway/docs/KNOWLEDGE.md.
 */
export {
  readCommittedFiles,
  readCommittedLevel,
} from "../../../../../sec-111/engine/level-data/testing/index.js";
