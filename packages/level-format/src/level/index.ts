/**
 * level: the level `.json`. It owns the level type, the one slab admission with the format
 * caps, the decoder and the canonical encoder.
 */
export { admitSlabs } from "./admission.js";
export { decodeLevel } from "./decode.js";
export { encodeLevel } from "./encode.js";
export type { Level, LevelProp } from "./level.js";
