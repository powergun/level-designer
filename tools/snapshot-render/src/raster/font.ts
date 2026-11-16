import type { Pixel, Raster, Rgb8 } from "./raster.js";
import { fillRect } from "./raster.js";

/** The glyphs of the label font, three columns by five rows, `#` for an inked cell. */
const GLYPHS: Readonly<Record<string, readonly string[]>> = {
  "0": ["###", "#.#", "#.#", "#.#", "###"],
  "1": [".#.", "##.", ".#.", ".#.", "###"],
  "2": ["###", "..#", "###", "#..", "###"],
  "3": ["###", "..#", ".##", "..#", "###"],
  "4": ["#.#", "#.#", "###", "..#", "..#"],
  "5": ["###", "#..", "###", "..#", "###"],
  "6": ["###", "#..", "###", "#.#", "###"],
  "7": ["###", "..#", ".#.", ".#.", ".#."],
  "8": ["###", "#.#", "###", "#.#", "###"],
  "9": ["###", "#.#", "###", "..#", "###"],
  "-": ["...", "...", "###", "...", "..."],
};
/** The pixels per glyph cell. */
const CELL = 2;
/** The pixels from one glyph to the next. */
const ADVANCE = 4 * CELL;
/** The padding of the label's plate around its text. */
const PAD = 2;
/** The label text colour. */
const INK: Rgb8 = [0, 0, 0];
/** The label plate colour. */
const PLATE: Rgb8 = [255, 255, 255];

/** The pixel size of a label's plate. */
function plateSize(text: string): Pixel {
  return [text.length * ADVANCE - CELL + 2 * PAD, 5 * CELL + 2 * PAD];
}

/** Paint one glyph with its top left cell at `corner`. */
function drawGlyph(raster: Raster, glyph: readonly string[], corner: Pixel): void {
  glyph.forEach((line, row) => {
    for (let column = 0; column < line.length; column++) {
      if (line[column] !== "#") continue;
      const at: Pixel = [corner[0] + column * CELL, corner[1] + row * CELL];
      fillRect(raster, at, [CELL, CELL], INK);
    }
  });
}

/**
 * Paint a label of digits and minus signs, black on a white plate, with the plate's top left
 * corner at `corner`.
 */
export function drawLabel(raster: Raster, text: string, corner: Pixel): void {
  fillRect(raster, corner, plateSize(text), PLATE);
  for (let index = 0; index < text.length; index++) {
    const glyph = GLYPHS[text[index] ?? ""];
    if (glyph === undefined) throw new Error(`the label font has no glyph for "${text[index]}"`);
    drawGlyph(raster, glyph, [corner[0] + PAD + index * ADVANCE, corner[1] + PAD]);
  }
}

/** Paint a label centred on a pixel. */
export function drawCentredLabel(raster: Raster, text: string, centre: Pixel): void {
  const [width, height] = plateSize(text);
  drawLabel(raster, text, [Math.round(centre[0] - width / 2), Math.round(centre[1] - height / 2)]);
}
