/**
 * footing: how each prop meets the prepared floors. It reads the floor under a prop's `at` and
 * under its slabs' corners, decides whether the prop stands or hangs, and collects its standing
 * slabs, whose plan outlines make the prop's standing footprint.
 */
export { footings, HANG_HEIGHT } from "./footing.js";
export type { PropFooting } from "./footing.js";
