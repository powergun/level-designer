/**
 * qa-client, testing entry: `createTestPage` assembles the hand-built document, the scripted
 * window, the manual clock and timers and the scripted view, on which the tests of qa-client and
 * qa-server boot the real page entry. Tests only; see @packages/qa-client/docs/KNOWLEDGE.md.
 */
export { createTestPage } from "./test-page.js";
export type { TestPage, TestPageOptions } from "./test-page.js";
