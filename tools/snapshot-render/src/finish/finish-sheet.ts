import type { Raster } from "../raster/index.js";
import { createRaster, drawLabel, encodePng, labelSize } from "../raster/index.js";
import { composeSheet } from "../sheets/index.js";
import { FAR_SCALE, nearScale, slabFaces } from "./faces.js";
import { hallTiles } from "./hall.js";
import type { FinishSwatch, SlabSubject } from "./input.js";
import { faceTile } from "./tile.js";

/** The title row's tile: the swatch's label on its plate. */
function titleTile(label: string): Raster {
  const [width, height] = labelSize(label);
  const tile = createRaster(width, height, [0, 0, 0]);
  drawLabel(tile, label, [0, 0]);
  return tile;
}

/**
 * Shelve tiles into rows in order: a tile joins the current row while the row's tile widths
 * stay within `limit`, and opens the next row otherwise.
 */
function shelve(tiles: readonly Raster[], limit: number): Raster[][] {
  const rows: Raster[][] = [];
  let row: Raster[] = [];
  let used = 0;
  for (const tile of tiles) {
    if (row.length > 0 && used + tile.width > limit) {
      rows.push(row);
      row = [];
      used = 0;
    }
    row.push(tile);
    used += tile.width;
  }
  if (row.length > 0) rows.push(row);
  return rows;
}

/**
 * The tile widths a row holds, so that a page with its gutters stays within the reader's
 * long edge of about 1,568 px.
 */
const ROW_WIDTH = 1520;

/**
 * A slab's rows: the low end, outside face and high end, which unfold side by side, then the
 * inside face and the top and bottom edges at the near scale, and the outside face at 40 mm.
 * A row holds 1,520 px of tiles, or the unfold's width when that is wider.
 */
function slabRows(swatch: FinishSwatch, subject: SlabSubject): Raster[][] {
  const { outside, inside, top, bottom, endHigh, endLow } = slabFaces(subject);
  const near = nearScale(outside.face.size);
  const unfolded = [endLow, outside, endHigh].map((face) => faceTile(swatch, face, near));
  const tiles = [
    ...unfolded,
    faceTile(swatch, inside, near),
    faceTile(swatch, top, near),
    faceTile(swatch, bottom, near),
    faceTile(swatch, outside, FAR_SCALE),
  ];
  const unfoldWidth = unfolded.reduce((sum, tile) => sum + tile.width, 0);
  return shelve(tiles, Math.max(ROW_WIDTH, unfoldWidth));
}

/**
 * One finish path's page as a raster: the title, then the subject's tiles in rows: a slab's
 * faces, or a hall finish's tiles, one class after the other, in rows of 1,520 px.
 */
function finishPage(swatch: FinishSwatch): Raster {
  const { subject } = swatch;
  const rows =
    subject.kind === "slab"
      ? slabRows(swatch, subject)
      : shelve(hallTiles(swatch, subject), ROW_WIDTH);
  return composeSheet([[titleTile(swatch.label)], ...rows]);
}

/**
 * The finish sheet's page of one finish path as PNG bytes: the path's slab or hall drawn by
 * its recipe, face by face, with rulers and mean luminances. It reads and writes no file.
 */
export function renderFinishSheet(swatch: FinishSwatch): Uint8Array {
  return encodePng(finishPage(swatch));
}
