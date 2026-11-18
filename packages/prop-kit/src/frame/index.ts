/**
 * frame: slab roles in the prop frame. It owns the six facings and the pitched facing, the
 * reading of a role as a slab with its finish path and the prop's paint, the split of a box
 * role into the fewest equal runs the slab admission accepts, and the placement of a
 * prop-frame slab on its site by plan position, yaw and floor height.
 */
export { pitchPoint } from "./pitch.js";
export { placeSlab } from "./place.js";
export type { Site } from "./place.js";
export { mirrorX, mirrorZ, moveBox } from "./role.js";
export type { Box, BoxRole, PitchedRole, PlanePoint, Role, SlabPaint, Span } from "./role.js";
export { splitRole } from "./split.js";
