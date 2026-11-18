/**
 * layer: one layer of a recipe, the mark or field it draws and how it mixes in. It owns the
 * layer's types, the patterns of the eight kinds, its one reading with its common keys and
 * effects, and its canonical record.
 */
export { layerRecord } from "./canonical.js";
export type { Written } from "./canonical.js";
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
} from "./layer.js";
export { readLayer } from "./read.js";
