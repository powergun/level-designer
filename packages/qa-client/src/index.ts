/**
 * qa-client: the QA page. The human walks the level in the game's collision, flies freely and
 * records a mark with a typed comment on F3. The facade holds `bootPage` and the `fetch` port its
 * tests fake. The boot watch script imports its own unit only, and the protocol shared with
 * qa-server has its own entry. See @packages/qa-client/docs/KNOWLEDGE.md.
 */
export { bootPage } from "./boot-page.js";
export type { PageFetch } from "./surroundings/index.js";
