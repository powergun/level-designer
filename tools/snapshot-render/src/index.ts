/**
 * snapshot-render: rasterises a level GLB on the CPU into plan, section and perspective sheets,
 * and draws the finish sheet's page of a finish path, each as PNG bytes, without a browser or
 * a GPU; see @tools/snapshot-render/docs/KNOWLEDGE.md.
 */
export { renderFinishSheet } from "./finish/index.js";
export type { FinishSwatch, HallClass, SwatchSubject } from "./finish/index.js";
export { renderSheets } from "./sheets/index.js";
export type { Sheets, SnapshotInput } from "./sheets/index.js";
