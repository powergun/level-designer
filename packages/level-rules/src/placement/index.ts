/**
 * placement: the rules on where a prop stands. Every slab stays in the interior; a prop stands
 * on one floor level or hangs; a standing footprint keeps off the ramp; a standing slab tops
 * out high enough; props do not enter each other; every seal reaches into the interior.
 */
export { interior, seal } from "./interior.js";
export { overlap } from "./overlap.js";
export { floor, lowTop, ramp, rampZone, support } from "./standing.js";
export type { RampZone } from "./standing.js";
