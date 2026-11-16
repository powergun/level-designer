/**
 * frame: slab roles in the prop frame. It owns the six facings, the reading of a role's box
 * as a slab, the split of a role into the fewest equal runs the slab admission accepts, and
 * the placement of a prop-frame slab on its site by plan position, yaw and floor height.
 */
export { placeSlab } from "./place.js";
export type { Site } from "./place.js";
export { mirrorX, mirrorZ } from "./role.js";
export type { Box, Role } from "./role.js";
export { splitRole } from "./split.js";
