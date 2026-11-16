/**
 * level-format: the two persisted shapes of the level designer, the level description and the
 * level `.json`, with their admission, the one slab admission, the grid rounding, the surface
 * colour form, the canonical encoding and the reading of a slab as an oriented box; see
 * @packages/level-format/docs/KNOWLEDGE.md.
 */
export { parseDescription } from "./description/index.js";
export type {
  BaseStage,
  Description,
  Finish,
  Glow,
  MaterialOverride,
  Prop,
  Seal,
} from "./description/index.js";
export { admitSlabs, decodeLevel, encodeLevel } from "./level/index.js";
export type { Level, LevelProp } from "./level/index.js";
export type {
  Environment,
  Haze,
  KeyLight,
  Lighting,
  PointLight,
  Shadow,
} from "./lighting/index.js";
export { describeValue, isSurfaceColor, keyPath } from "./shape/index.js";
export type { Admission, FormatProblem, LinearRgb, Vec3 } from "./shape/index.js";
export { roundSlab, slabBox } from "./slab/index.js";
export type { Quaternion, Slab, SlabBox, SlabMaterial } from "./slab/index.js";
