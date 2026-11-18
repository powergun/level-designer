/**
 * slab: one destruction lib wall model as the level `.json` stores it. It owns the slab
 * type, the shape of its record, its canonical key order, the rounding to the format's grid
 * and its reading as an oriented box with eight world corners.
 */
export { slabBox } from "./box.js";
export type { SlabBox } from "./box.js";
export { formatLength, roundSlab } from "./round.js";
export { canonicalSlab, MAX_SEED, readSlab, SLAB_MATERIALS } from "./slab.js";
export type { Quaternion, Slab, SlabFinish, SlabMaterial } from "./slab.js";
