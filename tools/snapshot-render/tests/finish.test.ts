import { describe, expect, test } from "bun:test";
import type { DrawnRecipe, Pattern } from "@level-designer/level-format";
import { type FinishSwatch, renderFinishSheet } from "@level-designer/snapshot-render";
import { glyphRows, mark, plateSpans, redAt } from "./page-reading.js";
import { decodePng, pixelAt } from "./png-pixels.js";

// Owner: the finish sheet's page of one finish path. Expected pixels come from the stated
// layout: 8 px gutters; a face tile holds its face's pixels, 4 rows of ruler ticks, a row of
// ruler numbers 14 px high, 2 rows of gap and a caption 14 px high. A label plate is 8 px per
// character less 2, plus 4, and 14 px high; character k's 3 x 5 glyph cells of 2 px start at
// (2 + 8k, 2) inside it. The ground and the gutters are grey 48; a white body is 255.

/** Bands 0.01 m wide every 0.02 m across, centred at 0.01 m: two of every four 5 mm columns. */
const BANDS: Pattern = {
  kind: "bands",
  along: "across",
  period: { metres: 0.02 },
  width: { metres: 0.01 },
  phase: 0.5,
  offset: { metres: 0 },
  ramp: { metres: 0 },
  fit: false,
};

/**
 * A white body with black bands on the outside face only, and three marks that only their own
 * face, its low corner and its rows place: black on the high end above 0.5 m on the high-X
 * half, black on the top above 0.025 m east of 0.3 m, and red `"glow"` on the bottom west of
 * -0.5 m. The finish's light is red.
 */
const RECIPE: DrawnRecipe = {
  body: { shade: 1, metalness: 0, roughness: 0.6, lit: 0 },
  layers: [
    { pattern: BANDS, on: "outside", wear: false, amount: 1, effects: { shade: 0 } },
    mark("end+", [0, 0.5], [100, 100], { shade: 0 }),
    mark("top", [0.3, 0.025], [100, 100], { shade: 0 }),
    mark("bottom", [-100, -100], [-0.5, 100], { color: "glow" }),
  ],
  light: "#ff0000",
};

/** The white body alone. */
const PLAIN: DrawnRecipe = { ...RECIPE, layers: [] };

/** A page of a recipe, the bands by default, on a white slab of the given size. */
function swatchOn(size: readonly [number, number, number], recipe = RECIPE): FinishSwatch {
  return {
    label: "test/bands",
    recipe,
    tint: "#ffffff",
    subject: { kind: "slab", size, seed: 0, wear: 0 },
  };
}

/** The page of a slab of 1.2 x 0.6 x 0.05 m at 5 mm: outside 240 x 120 px, ends 10 x 120. */
const BYTES = renderFinishSheet(swatchOn([1.2, 0.6, 0.05]));
const PAGE = decodePng(BYTES);

/**
 * The tile origins of that page. Title row at y 8, 14 high. One row at y 30 holds every tile,
 * 1,334 px of the 1,520 a row takes: end- (caption "end- 5mm 1.000", 114 wide), outside
 * (240), end+ (114), inside (240), top (240), bottom (240) and the 40 mm view (caption 146).
 */
const AT = {
  endLow: [8, 30],
  outside: [130, 30],
  endHigh: [378, 30],
  inside: [500, 30],
  top: [748, 30],
  bottom: [996, 30],
  far: [1244, 30],
} as const;

describe("the finish sheet's faces", () => {
  test("the page holds its rows at their hand-computed size under the path's title", () => {
    expect([PAGE.width, PAGE.height]).toEqual([1398, 192]);
    // "test/bands": 10 characters; under their top rows "t" shows its stem, "e" its arms.
    expect(plateSpans(PAGE, [8, 8], 10)).toBe(true);
    expect(glyphRows(PAGE, [8, 8], 0, 1)).toEqual([".#. #..", ".#. ##.", ".#. #.."]);
  });

  test("at 5 mm each band covers its hand-computed columns of the outside face", () => {
    // Column c samples x = -0.6 + (c + 0.5) * 0.005; bands cover x mod 0.02 in 0.005..0.015.
    for (const [column, red] of [
      [0, 255],
      [1, 0],
      [2, 0],
      [3, 255],
      [237, 0],
      [239, 255],
      [240, 48],
    ] as const) {
      expect(redAt(PAGE, AT.outside, column, 60)).toBe(red);
    }
  });

  test("at 40 mm the outside face is the bands' mean in every pixel", () => {
    // A footprint of two periods covers half: linear 0.5 is sRGB 187.5, so 187 or 188.
    for (const [column, row] of [
      [0, 0],
      [17, 7],
      [29, 14],
    ] as const) {
      expect(Math.abs(redAt(PAGE, AT.far, column, row) - 187.5)).toBeLessThanOrEqual(0.5);
    }
    expect(redAt(PAGE, AT.far, 30, 7)).toBe(48);
  });

  test("the rulers tick and number every whole metre from the face's low edge", () => {
    for (const [origin, column, row, red] of [
      [AT.outside, 0, 120, 255],
      [AT.outside, 200, 123, 255],
      [AT.outside, 100, 121, 48],
      [AT.far, 0, 15, 255],
      [AT.far, 25, 18, 255],
      [AT.far, 12, 16, 48],
    ] as const) {
      expect(redAt(PAGE, origin, column, row)).toBe(red);
    }
    // The number "1" under metre 1: 5 mm at column 200, 40 mm at column 25.
    const one = ["##.", ".#.", ".#."];
    expect(glyphRows(PAGE, [AT.outside[0] + 200, AT.outside[1] + 124], 0, 0)).toEqual(one);
    expect(glyphRows(PAGE, [AT.far[0] + 25, AT.far[1] + 19], 0, 0)).toEqual(one);
  });
});

describe("the finish sheet's captions and layout", () => {
  test("each face prints its name, its scale and its mean as linear luminance", () => {
    // "outside 5mm 0.500" (17 characters) and "outside 40mm 0.500" (18): the mean at 12 and 13.
    const half = ["#.# ... #.. #.# #.#", "#.# ... ### #.# #.#", "#.# ... ..# #.# #.#"];
    expect(plateSpans(PAGE, [130, 170], 17)).toBe(true);
    expect(glyphRows(PAGE, [130, 170], 12, 16)).toEqual(half);
    expect(plateSpans(PAGE, [1244, 65], 18)).toBe(true);
    expect(glyphRows(PAGE, [1244, 65], 13, 17)).toEqual(half);
    // "inside 5mm 1.000": the mean 1 at 11.
    expect(glyphRows(PAGE, [500, 170], 11, 11)).toEqual(["##.", ".#.", ".#."]);
    // A tint of #ff00ff, linear (1, 0, 1): 0.2126 + 0.0722 = 0.2848, printed 0.285.
    const tinted = { ...swatchOn([1.2, 0.6, 0.05], PLAIN), tint: "#ff00ff" };
    const page = decodePng(renderFinishSheet(tinted));
    expect(glyphRows(page, [130, 170], 14, 16)).toEqual([
      "..# #.# #..",
      "### ### ###",
      "#.. #.# ..#",
    ]);
  });

  test("the six faces stand in the stated order, each edge at its own size", () => {
    // Captions by length: end- and end+ 14 characters, inside and bottom 16, top 13.
    for (const [plate, characters] of [
      [[8, 170], 14],
      [[378, 170], 14],
      [[500, 170], 16],
      [[748, 60], 13],
      [[996, 60], 16],
    ] as const) {
      expect(plateSpans(PAGE, plate, characters)).toBe(true);
    }
    // The inside has no bands; the top edge is 240 x 10 px and the end+ edge 10 x 120 px.
    for (const [origin, column, row, red] of [
      [AT.inside, 1, 60, 255],
      [AT.top, 239, 9, 255],
      [AT.top, 240, 5, 48],
      [AT.top, 5, 10, 48],
      [AT.endHigh, 9, 119, 255],
      [AT.endHigh, 10, 50, 48],
    ] as const) {
      expect(redAt(PAGE, origin, column, row)).toBe(red);
    }
  });
});

describe("the finish sheet's marks and rows", () => {
  test("each edge draws its own marks from its low corner, top row first", () => {
    // end+: column c at z = -0.025 + (c + 0.5) * 0.005, row r at y = 0.6 - (r + 0.5) * 0.005,
    // so the mark covers columns 5 to 9 of rows 0 to 19. top: x = -0.6 + (c + 0.5) * 0.005
    // and y = 0.05 - (r + 0.5) * 0.005, so columns 180 on of rows 0 to 4. bottom: columns 0
    // to 19 in the finish's red light.
    for (const [origin, column, row, red] of [
      [AT.endHigh, 7, 5, 0],
      [AT.endHigh, 2, 5, 255],
      [AT.endHigh, 7, 30, 255],
      [AT.endLow, 7, 5, 255],
      [AT.top, 200, 2, 0],
      [AT.top, 100, 2, 255],
      [AT.top, 200, 7, 255],
      [AT.bottom, 200, 2, 255],
    ] as const) {
      expect(redAt(PAGE, origin, column, row)).toBe(red);
    }
    const [x, y] = [AT.bottom[0], AT.bottom[1] + 5];
    expect([pixelAt(PAGE, x + 5, y), pixelAt(PAGE, x + 30, y)]).toEqual([
      [255, 0, 0],
      [255, 255, 255],
    ]);
  });

  test("a row holds 1,520 px of tiles: a square face at the limit, one step wider, taller", () => {
    // A 3.23 m square at 5 mm: end- 114, outside 646, end+ 114 and inside 646 fill one row of
    // 1,520 px, 680 high; top, bottom (646, 44 high) and the 40 mm view (146, 115 high) the next.
    const square = decodePng(renderFinishSheet(swatchOn([3.23, 3.23, 0.05], PLAIN)));
    expect([square.width, square.height]).toEqual([8 + 1520 + 32, 8 + 22 + 688 + 123]);
    // 3.235 m wide: 647 px, so inside opens row two beside top, and bottom with the 40 mm view
    // opens row three.
    const wider = decodePng(renderFinishSheet(swatchOn([3.235, 3.23, 0.05], PLAIN)));
    expect([wider.width, wider.height]).toEqual([8 + 1294 + 16, 8 + 22 + 688 + 688 + 123]);
    // 3.235 m high: 647 px, one row more on the tiles' height, the same rows.
    const taller = decodePng(renderFinishSheet(swatchOn([3.23, 3.235, 0.05], PLAIN)));
    expect([taller.width, taller.height]).toEqual([8 + 1520 + 32, 8 + 22 + 689 + 123]);
  });
});

describe("the finish sheet's scales and bytes", () => {
  test("a face of 8 m draws at 5 mm, one longer than 8 m at 20 mm", () => {
    const eight = decodePng(renderFinishSheet(swatchOn([8, 0.1, 0.05], PLAIN)));
    // Outside 1,600 x 20 px after an end tile 114 wide: its face starts at x 130.
    expect(redAt(eight, [130, 30], 1599, 10)).toBe(255);
    expect(redAt(eight, [130, 30], 1600, 10)).toBe(48);
    // At 20 mm the end tile's caption "end- 20mm 1.000" is 122 wide: the face starts at x 138.
    const wide = decodePng(renderFinishSheet(swatchOn([9, 0.1, 0.05], PLAIN)));
    expect(redAt(wide, [138, 30], 449, 2)).toBe(255);
    expect(redAt(wide, [138, 30], 450, 2)).toBe(48);
    const tall = decodePng(renderFinishSheet(swatchOn([0.5, 9, 0.05], PLAIN)));
    expect(redAt(tall, [138, 30], 5, 449)).toBe(255);
    expect(redAt(tall, [138, 30], 5, 450)).toBe(48);
  });

  test("two renders of one swatch give equal bytes", () => {
    expect(renderFinishSheet(swatchOn([1.2, 0.6, 0.05]))).toEqual(BYTES);
  });
});
