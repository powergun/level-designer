/**
 * description: the level description, the one authoring input. It owns the description type
 * and its one admission: exact keys, ranges, the description caps and unique ids. Kind names
 * and kind parameters are left to `prop-kit`, base names to `level-glb`. It also owns a box's
 * paint keys, a seal's flat or painted look, and the class of a static object and its reading
 * as an oriented box at a given height.
 */
export { staticBox, staticClass } from "./box.js";
export type {
  BaseStage,
  BoxPaint,
  Description,
  Glow,
  MaterialOverride,
  PaintedSeal,
  Prop,
  Seal,
  StaticClass,
  StaticObject,
} from "./description.js";
export { parseDescription } from "./parse.js";
