/**
 * sec111-gateway, testing entry: Bun-side test support only. It re-exports sec-111's own
 * reader of its committed prepared level, which tests use as real hall data without a
 * preparation; no build reads it. See @packages/sec111-gateway/docs/KNOWLEDGE.md.
 */
export { readCommittedLevel } from "../../../../../sec-111/engine/level-data/testing/index.js";
