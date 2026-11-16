/**
 * lighting: the lighting section that the description and the level `.json` share. It owns
 * the section's one type, its one admission with the caps of eight points and one key, and
 * its canonical key order.
 */
export type { Environment, Haze, KeyLight, Lighting, PointLight, Shadow } from "./lighting.js";
export { canonicalLighting } from "./canonical.js";
export { readLighting } from "./read.js";
