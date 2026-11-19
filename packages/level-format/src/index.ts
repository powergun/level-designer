/**
 * level-format: the two persisted shapes of the level designer, the level description and the
 * level `.json`, with their admission, the one slab admission, the grid rounding, the surface
 * colour form, the canonical encoding, the reading of a slab as an oriented box, the finish
 * table's types with the reading of a finish path, the hash of an id into a seed, and the
 * static objects with their reading as an oriented box; see
 * @packages/level-format/docs/KNOWLEDGE.md.
 */
export { parseDescription, staticBox, staticClass } from "./description/index.js";
export type {
  BaseStage,
  Description,
  Glow,
  MaterialOverride,
  Prop,
  Seal,
  StaticClass,
  StaticObject,
} from "./description/index.js";
export { recipeAt, seedOfId } from "./finish/index.js";
export type { Body, Cut, DrawnRecipe, Finish, FinishTable, Recipe } from "./finish/index.js";
export type {
  BandsPattern,
  BorderPattern,
  CellsPattern,
  Clip,
  Detail,
  DiscPattern,
  DotsPattern,
  Effects,
  Face,
  Layer,
  NoisePattern,
  Pattern,
  RectanglePattern,
} from "./layer/index.js";
export type { Length, LengthPair } from "./length/index.js";
export { admitSlabs, decodeLevel, encodeLevel } from "./level/index.js";
export type { Level, LevelProp } from "./level/index.js";
export { MAX_POINT_LIGHTS } from "./lighting/index.js";
export type {
  Environment,
  Haze,
  KeyLight,
  Lighting,
  PointLight,
  Shadow,
} from "./lighting/index.js";
export { describeValue, isSurfaceColor, keyPath, LENGTH_SLACK } from "./shape/index.js";
export type { Admission, FormatProblem, LinearRgb, Vec3 } from "./shape/index.js";
export { formatLength, MAX_SEED, roundSlab, slabBox } from "./slab/index.js";
export type { Quaternion, Slab, SlabBox, SlabFinish, SlabMaterial } from "./slab/index.js";
