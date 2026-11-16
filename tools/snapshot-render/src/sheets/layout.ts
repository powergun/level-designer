import type { Raster, Rgb8 } from "../raster/index.js";
import { blit, createRaster } from "../raster/index.js";

/** The pixels around and between tiles. */
const GUTTER = 8;
/** The gutter colour. */
const GUTTER_COLOR: Rgb8 = [48, 48, 48];

/**
 * Compose a sheet from rows of tiles: each row left to right, rows top to bottom, a gutter
 * around and between every tile; a row is as high as its highest tile.
 */
export function composeSheet(rows: readonly (readonly Raster[])[]): Raster {
  const widthOf = (row: readonly Raster[]): number =>
    row.reduce((sum, tile) => sum + tile.width + GUTTER, GUTTER);
  const heightOf = (row: readonly Raster[]): number =>
    Math.max(...row.map((tile) => tile.height)) + GUTTER;
  const width = Math.max(...rows.map(widthOf));
  const height = rows.reduce((sum, row) => sum + heightOf(row), GUTTER);
  const sheet = createRaster(width, height, GUTTER_COLOR);
  let y = GUTTER;
  for (const row of rows) {
    let x = GUTTER;
    for (const tile of row) {
      blit(sheet, tile, x, y);
      x += tile.width + GUTTER;
    }
    y += heightOf(row);
  }
  return sheet;
}
