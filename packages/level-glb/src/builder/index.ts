/**
 * builder: appends root nodes, object nodes with their mesh nodes, materials and geometry to a
 * read glTF document, and writes it back as one-buffer GLB bytes. Read records keep their
 * indices, and each appended accessor has its own buffer view, aligned to four bytes.
 */
export { SceneBuilder } from "./scene-builder.js";
export type { PrimitiveGeometry } from "./scene-builder.js";
