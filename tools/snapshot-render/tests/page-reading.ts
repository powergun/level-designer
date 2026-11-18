import type { Effects, Layer, Pattern } from "@level-designer/level-format";
import { type Pixels, pixelAt } from "./png-pixels.js";

// Shared readings of a finish sheet's page: the layers a test recipe draws, and the pixels,
// glyph cells and label plates a test reads back. A label plate is 8 px per character less
// 2, plus 4, and 14 px high; character k's 3 x 5 glyph cells of 2 px start at (2 + 8k, 2).

/** A layer on one face that covers the rectangle from `from` to `to`, in metres. */
export function mark(
  on: Layer["on"],
  from: [number, number],
  to: [number, number],
  effects: Effects,
): Layer {
  const pattern: Pattern = {
    kind: "rectangle",
    from: [{ metres: from[0] }, { metres: from[1] }],
    to: [{ metres: to[0] }, { metres: to[1] }],
  };
  return { pattern, on, wear: false, amount: 1, effects };
}

/** A page pixel's red byte at an offset from a tile origin. */
export function redAt(
  page: Pixels,
  origin: readonly [number, number],
  dx: number,
  dy: number,
): number {
  return pixelAt(page, origin[0] + dx, origin[1] + dy)[0] ?? -1;
}

/**
 * Rows 1 to 3 of characters `from` to `to` of the label whose plate starts at `plate`, as
 * `#` for an inked cell and `.` for a blank one, one string of three cells per row per glyph.
 */
export function glyphRows(
  page: Pixels,
  plate: readonly [number, number],
  from: number,
  to: number,
): string[] {
  const rows: string[] = [];
  for (let row = 1; row <= 3; row++) {
    const cells: string[] = [];
    for (let index = from; index <= to; index++) {
      for (let column = 0; column < 3; column++) {
        const x = 2 + 8 * index + 2 * column;
        cells.push(redAt(page, plate, x, 2 + 2 * row) === 0 ? "#" : ".");
      }
      cells.push(" ");
    }
    rows.push(cells.join("").trimEnd());
  }
  return rows;
}

/** Whether a label plate of `characters` starts at `plate`: white to its last column only. */
export function plateSpans(
  page: Pixels,
  plate: readonly [number, number],
  characters: number,
): boolean {
  const width = 8 * characters - 2 + 4;
  return redAt(page, plate, width - 1, 0) === 255 && redAt(page, plate, width, 0) === 48;
}
