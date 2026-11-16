/**
 * raster: the 8-bit sRGB picture a sheet is painted on: fills, lines, circles, digit labels,
 * copies, and the PNG encoding compressed with the runtime's zlib.
 */
export { drawCentredLabel, drawLabel } from "./font.js";
export { encodePng } from "./png.js";
export { blit, createRaster, drawCircle, drawLine, fillRect, paint } from "./raster.js";
export type { Pixel, Raster, Rgb8 } from "./raster.js";
