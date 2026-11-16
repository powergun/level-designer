/**
 * inspection: the facts a built GLB carries. It counts the triangles, lists the primitives
 * without a material and counts the images, and it reads the drawn triangles in world space.
 */
export { inspectGlb } from "./inspect.js";
export type { GlbInspection } from "./inspect.js";
export { readWorldTriangles } from "./triangles.js";
export type { WorldTriangles } from "./triangles.js";
