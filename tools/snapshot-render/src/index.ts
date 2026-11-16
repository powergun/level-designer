/**
 * snapshot-render: rasterises a level GLB on the CPU into plan, section and perspective sheets
 * and encodes them as PNG, without a browser or a GPU; see
 * @tools/snapshot-render/docs/KNOWLEDGE.md.
 */
export { renderSheets } from "./sheets/index.js";
export type { Sheets, SnapshotInput } from "./sheets/index.js";
