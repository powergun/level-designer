/**
 * The generic parts of the procedural materials: the arithmetic interface and its number
 * back end, the lattice hash every back end builds its hash from, the slab's frame rule, and
 * the painter that draws a finish's recipe on a face, and the swatch that renders a recipe
 * as pixels on the CPU.
 */
export {
  latticeHash,
  numberArithmetic,
  type Arithmetic,
  type CoreArithmetic,
} from "./arithmetic/index.js";
export {
  type FaceClass,
  type HallBox,
  hallFace,
  type SlabFace,
  slabFrame,
  type Vec3,
} from "./frame/index.js";
export {
  bodyShade,
  linearFromSrgbHex,
  type PaintFace,
  paintFace,
  type Rgb,
  type Shade,
  type SlabVertex,
  slabFace,
  type Surface,
} from "./painter/index.js";
export {
  paintSwatch,
  type Swatch,
  type SwatchFace,
  type SwatchRequest,
  type SwatchWindow,
} from "./swatch/index.js";
