/**
 * finish: the finish sheet, one page per finish path: the path's slab drawn by its recipe on
 * `finish-paint`'s swatch, face by face at the near and the far scale, each with a ruler in
 * metres and its mean albedo as linear luminance, as PNG bytes.
 */
export { renderFinishSheet } from "./finish-sheet.js";
export type { FinishSwatch, HallClass, SwatchSubject } from "./input.js";
