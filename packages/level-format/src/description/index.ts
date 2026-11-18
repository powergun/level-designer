/**
 * description: the level description, the one authoring input. It owns the description type
 * and its one admission: exact keys, ranges, the description caps and unique ids. Kind names
 * and kind parameters are left to `prop-kit`, base names to `level-glb`.
 */
export type {
  BaseStage,
  Description,
  Glow,
  MaterialOverride,
  Prop,
  Seal,
} from "./description.js";
export { parseDescription } from "./parse.js";
