import {
  linearFromSrgbHex,
  paintSwatch,
  type Rgb,
  type Swatch,
  type SwatchFace,
  type SwatchWindow,
} from "@level-designer/finish-paint";
import type { Raster, Rgb8 } from "../raster/index.js";
import { createRaster, drawLabel, fillRect, labelSize } from "../raster/index.js";
import { srgbByte } from "../render/index.js";
import type { NamedFace } from "./faces.js";
import type { FinishSwatch } from "./input.js";

/** The ground of a tile around its face, its ruler and its caption. */
const GROUND: Rgb8 = [48, 48, 48];
/** The colour of a ruler's ticks. */
const TICK: Rgb8 = [255, 255, 255];
/** The pixels of a ruler's ticks, out from the face. */
const TICK_ROWS = 4;
/** The rows between the ruler's numbers and the caption. */
const CAPTION_GAP = 2;
/** The weights of linear RGB in linear luminance, Rec. 709. */
const LUMINANCE = [0.2126, 0.7152, 0.0722] as const;

/** A ruler mark: the number it prints and the pixel along the face it stands on. */
export type RulerMark = readonly [number, number];

/**
 * What a tile draws beside its swatch: the marks of the ruler under the face, those of the
 * ruler on its right (none on a slab's face), and whether row 0 shows the lowest `y`.
 */
export interface TileRulers {
  readonly under: readonly RulerMark[];
  readonly right: readonly RulerMark[];
  readonly lowestOnTop: boolean;
}

/** The linear luminance of a linear colour. */
function luminance(color: Rgb<number>): number {
  return LUMINANCE[0] * color[0] + LUMINANCE[1] * color[1] + LUMINANCE[2] * color[2];
}

/** The caption under a face: its format name, its scale in millimetres and its mean. */
function captionOf(name: string, scale: number, swatch: Swatch): string {
  const millimetres = Math.round(scale * 1000);
  return `${name} ${millimetres}mm ${luminance(swatch.mean).toFixed(3)}`;
}

/** The ruler's marks: every whole metre of the face's width and the pixel column it falls on. */
function rulerMarks(swatch: Swatch, scale: number): readonly RulerMark[] {
  const metres = Math.floor(swatch.width * scale + 1e-6);
  return Array.from({ length: metres + 1 }, (_, metre) => {
    const column = Math.min(Math.round(metre / scale), swatch.width - 1);
    return [metre, column] as const;
  });
}

/** Copy a swatch's linear albedo into a raster's top left corner as sRGB bytes. */
function blitAlbedo(tile: Raster, swatch: Swatch, lowestOnTop: boolean): void {
  for (let row = 0; row < swatch.height; row++) {
    const shown = lowestOnTop ? swatch.height - 1 - row : row;
    for (let column = 0; column < swatch.width; column++) {
      const from = (row * swatch.width + column) * 3;
      const to = (shown * tile.width + column) * 3;
      for (let channel = 0; channel < 3; channel++) {
        tile.rgb[to + channel] = srgbByte(swatch.albedo[from + channel] ?? 0);
      }
    }
  }
}

/** A swatch's face, or a window of it, painted by the swatch's recipe on its decoded tint. */
export function paintOn(
  swatch: FinishSwatch,
  face: SwatchFace,
  window: SwatchWindow | undefined,
  scale: number,
): Swatch {
  const { recipe } = swatch;
  const tint = linearFromSrgbHex(swatch.tint);
  const light = linearFromSrgbHex(recipe.light);
  const request = { face, scale, tint, light };
  return paintSwatch(recipe, window === undefined ? request : { ...request, window });
}

/** The width a ruler on the right of a face adds: its ticks and its widest number. */
function rightRulerWidth(marks: readonly RulerMark[]): number {
  if (marks.length === 0) return 0;
  return TICK_ROWS + Math.max(...marks.map(([value]) => labelSize(`${value}`)[0]));
}

/**
 * A painted face as a tile: the albedo in sRGB, a ruler under it, a ruler on its right when
 * it has marks, and the caption under all. The tile is as wide as the widest of them.
 */
export function swatchTile(
  painted: Swatch,
  name: string,
  scale: number,
  rulers: TileRulers,
): Raster {
  const caption = captionOf(name, scale, painted);
  const [captionWidth, labelHeight] = labelSize(caption);
  const underWidth = Math.max(...rulers.under.map(([n, at]) => at + labelSize(`${n}`)[0]));
  const numbersRow = painted.height + TICK_ROWS;
  const captionRow = numbersRow + labelHeight + CAPTION_GAP;
  const faceWidth = painted.width + rightRulerWidth(rulers.right);
  const width = Math.max(faceWidth, captionWidth, underWidth);
  const tile = createRaster(width, captionRow + labelHeight, GROUND);
  blitAlbedo(tile, painted, rulers.lowestOnTop);
  for (const [value, at] of rulers.under) {
    fillRect(tile, [at, painted.height], [1, TICK_ROWS], TICK);
    drawLabel(tile, `${value}`, [at, numbersRow]);
  }
  const lowestLabelRow = Math.max(0, painted.height - labelHeight);
  for (const [value, at] of rulers.right) {
    fillRect(tile, [painted.width, at], [TICK_ROWS, 1], TICK);
    drawLabel(tile, `${value}`, [painted.width + TICK_ROWS, Math.min(at, lowestLabelRow)]);
  }
  drawLabel(tile, caption, [0, captionRow]);
  return tile;
}

/**
 * One face of a slab's page at one scale: the swatch's albedo in sRGB, under it a ruler with
 * a tick and a number at every whole metre from the face's low edge, then the caption.
 */
export function faceTile(swatch: FinishSwatch, named: NamedFace, scale: number): Raster {
  const painted = paintOn(swatch, named.face, undefined, scale);
  const rulers = { under: rulerMarks(painted, scale), right: [], lowestOnTop: false };
  return swatchTile(painted, named.name, scale, rulers);
}
