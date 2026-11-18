/**
 * The painter: a finish's drawn recipe evaluated at a point of a face over the arithmetic
 * interface, from a base shade its caller gives; the base shade of a body, the face of a
 * slab's or a box's vertex, and the decode of a finish's colour text.
 */
export { linearFromSrgbHex } from "./color.js";
export {
  type PaintFace,
  type Rgb,
  type Shade,
  type SlabVertex,
  slabFace,
  type Surface,
} from "./face.js";
export { bodyShade, paintFace } from "./paint.js";
