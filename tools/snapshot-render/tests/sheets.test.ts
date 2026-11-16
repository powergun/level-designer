import { describe, expect, test } from "bun:test";
import { renderSheets } from "@level-designer/snapshot-render";
import { boxScene } from "./box-scene.js";
import type { PixelRect } from "./coverage.js";
import { coverageMisses, isBackground, surfaceInside } from "./coverage.js";
import type { Pixels } from "./png-pixels.js";
import { decodePng, pixelAt } from "./png-pixels.js";
import { INPUT } from "./scene.js";

// Owner: snapshot-render's plan, section and view sheets, on one render of one box scene.
// Expected pixels come from the stated scale of 20 px per metre, the whole-metre tile windows
// of the scene input (x from -11, z from -7, y down from 10), the 8 px gutter, and for the
// view tiles a 90 degree lens on 360 px rows: focal length 180 px around the centre (320, 180).

/** The scene: every box with the facts it pins. */
const GLB = boxScene([
  // A crate 0.5 m above the floor beyond the centre plane x = -1.25, and a blue slab under it.
  { min: [2, 0.5, 1], max: [4, 1.5, 4], color: "#ff0000" },
  { min: [2.5, 0, 2], max: [3.5, 0.3, 3], color: "#0000ff" },
  // A box that crosses the floor-plan cut, so its cut traces a black outline.
  { min: [6, 5, 5.2], max: [7, 6.5, 6], color: "#808080" },
  // A box above the floor-plan cut.
  { min: [-4, 6.5, -3], max: [-2, 7, -1], color: "#00ff00" },
  // Two thin boxes within 0.1 m of the centre plane: beyond it at z 5.5..6.5, short of it at
  // z 3.5..4.5.
  { min: [-1.2, 7.5, 5.5], max: [-1.15, 8.5, 6.5], color: "#808080" },
  { min: [-1.35, 7.5, 3.5], max: [-1.3, 8.5, 4.5], color: "#808080" },
  // A post short of the centre plane and a block just beyond it.
  { min: [-3, 4.5, 2], max: [-2.5, 5.5, 3], color: "#0000ff" },
  { min: [0, 3.6, -2], max: [0.5, 4.4, -1], color: "#808080" },
  // Red boxes hidden behind the block: toward +X in the elevation, toward -Z in a cross section.
  { min: [3, 3.8, -1.8], max: [3.5, 4.2, -1.2], color: "#ff0000" },
  { min: [0.1, 3.8, -3], max: [0.4, 4.2, -2.5], color: "#ff0000" },
  // Thin boxes just under and just over each plan cut (5.9 m and 16.2 m).
  { min: [4, 5.85, -6], max: [5, 5.88, -5], color: "#808080" },
  { min: [6, 5.92, -6], max: [7, 5.95, -5], color: "#808080" },
  { min: [4, 16.15, -4.5], max: [5, 16.18, -3.5], color: "#808080" },
  { min: [6, 16.22, -4.5], max: [7, 16.25, -3.5], color: "#808080" },
  // A wall behind the interior's back (z = -5), near the tile window's back edge (z = -7).
  { min: [1, 7, -6.9], max: [2, 8, -6.6], color: "#808080" },
  // Boxes at the far edge of the second cross window (z 15..25), just behind it, and in the
  // sixth window (95..105).
  { min: [2, 5, 15.02], max: [3, 6, 15.08], color: "#808080" },
  { min: [-6, 5, 14], max: [-5, 6, 14.9], color: "#808080" },
  { min: [2, 5, 100], max: [3, 6, 102], color: "#808080" },
  // Boxes just short of and just past the second station (z 25).
  { min: [-9, 5, 24.92], max: [-8, 6, 24.98], color: "#808080" },
  { min: [7.5, 5, 25.02], max: [8.5, 6, 25.08], color: "#808080" },
  // Markers 12 m ahead of the player's eye (-4, 1.72, -4), 4 m right and 2 m up in each
  // player tile: toward the back wall at (0, 3.72, -16), toward the sealed end at (-8, 3.72, 8).
  { min: [-0.1, 3.62, -16.1], max: [0.1, 3.82, -15.9], color: "#ff0000" },
  { min: [-8.1, 3.62, 7.9], max: [-7.9, 3.82, 8.1], color: "#00ff00" },
  // A small yellow box 0.10 to 0.12 m ahead of the player's eye, toward the back wall.
  { min: [-4.03, 1.7, -4.12], max: [-4.01, 1.71, -4.1], color: "#ffff00" },
  // Cyan markers about 3 m from each overview eye.
  { min: [-1, 9.15, -3.45], max: [-0.9, 9.25, -3.35], color: "#00ffff" },
  { min: [-1.6, 9.15, 3.35], max: [-1.5, 9.25, 3.45], color: "#00ffff" },
  // A cyan marker 6 m along the minion's view and 0.5 m above it.
  { min: [0.467, 2.321, -0.035], max: [0.567, 2.421, 0.065], color: "#00ffff" },
  // Overview markers 6 m below the floor: green for the back eye, blue for the end eye.
  { min: [-3.15, -6.15, 5.85], max: [-2.85, -5.85, 6.15], color: "#00ff00" },
  { min: [0.35, -6.15, -3.15], max: [0.65, -5.85, -2.85], color: "#0000ff" },
  // A marker near the minion's view line, about 24 m from its eye (5, 2.02, 4).
  {
    min: [5 - 216 / Math.sqrt(145) - 0.2, 5.52, 4 - 192 / Math.sqrt(145) - 0.2],
    max: [5 - 216 / Math.sqrt(145) + 0.2, 5.92, 4 - 192 / Math.sqrt(145) + 0.2],
    color: "#0000ff",
  },
]);
const SHEETS = renderSheets(GLB, INPUT);
const PLAN = decodePng(SHEETS.plan);
const SECTION = decodePng(SHEETS.section);
const VIEW = decodePng(SHEETS.view);

/** The plan tile origins: tiles of 400 x 280 px with gutters of 8 px. */
const FLOOR_PLAN = [8, 8] as const;
const OVERHEAD_PLAN = [416, 8] as const;
/** The section tile origins: elevations of 280 x 240 px, cross sections of 400 x 240 px. */
const TOWARD_PLUS_X = [8, 8] as const;
const TOWARD_MINUS_X = [8, 256] as const;
const CROSSES = [
  [8, 504],
  [416, 504],
  [824, 504],
  [8, 752],
  [416, 752],
  [824, 752],
] as const;
/** The view tile origins: tiles of 640 x 360 px, four per row. */
const PLAYER_TO_BACK = [8, 8] as const;
const PLAYER_TO_END = [656, 8] as const;
const MINION = [1304, 8] as const;
const OVERVIEW_BACK = [1952, 8] as const;
const OVERVIEW_END = [8, 376] as const;

/** The loud background and the marker colours a reader tells apart. */
const MAGENTA = [255, 0, 255];
const PLAYER_MARK = [0, 200, 255];
const MINION_MARK = [255, 120, 0];

/** The pixel at column x and row y of the tile at `origin`. */
function tilePixel(pixels: Pixels, origin: readonly [number, number], x: number, y: number) {
  return [...pixelAt(pixels, origin[0] + x, origin[1] + y)];
}

/** The one lit primary of a pixel, "red", "green" or "blue", or "other" for any mix. */
function primaryAt(pixels: Pixels, origin: readonly [number, number], x: number, y: number) {
  const lit = pixelAt(pixels, origin[0] + x, origin[1] + y).map((channel) => channel > 0);
  const names = ["red", "green", "blue"];
  return lit.filter(Boolean).length === 1 ? names[lit.indexOf(true)] : "other";
}

/** Whether a view pixel shows the player figure: no red, more blue than green. */
function isPlayerFigure(origin: readonly [number, number], x: number, y: number): boolean {
  const [r, g, b] = pixelAt(VIEW, origin[0] + x, origin[1] + y);
  return r === 0 && g > 0 && b > g;
}

/** The floor plan's pixel at tile column x and row y. */
function floorPlanAt(x: number, y: number): number[] {
  return tilePixel(PLAN, FLOOR_PLAN, x, y);
}

/** The pixel in column 5 and row y of the elevation toward +X. */
function elevationAt(y: number): number[] {
  return tilePixel(SECTION, TOWARD_PLUS_X, 5, y);
}

/** Whether a pixel shows the lit cyan of a marker: no red, equal green and blue. */
function isCyan(origin: readonly [number, number], x: number, y: number): boolean {
  const [r, g, b] = pixelAt(VIEW, origin[0] + x, origin[1] + y);
  return r === 0 && g > 0 && g === b;
}

/** Whether a pixel shows a lit grey: three equal channels. */
function isGrey(pixels: Pixels, origin: readonly [number, number], x: number, y: number): boolean {
  const [r, g, b] = pixelAt(pixels, origin[0] + x, origin[1] + y);
  return r > 0 && r === g && g === b;
}

/** The cross tiles holding a surface in a rectangle, by tile number from 1. */
function crossesShowing(rect: PixelRect): readonly number[] {
  const tiles = CROSSES.map((origin) => surfaceInside(SECTION, origin, rect).length > 0);
  return tiles.flatMap((shows, index) => (shows ? [index + 1] : []));
}

describe("plan sheet", () => {
  test("the sheet holds two 400 x 280 px tiles side by side in dark grey gutters", () => {
    expect([PLAN.width, PLAN.height]).toEqual([824, 296]);
    expect([...pixelAt(PLAN, 0, 0)]).toEqual([48, 48, 48]);
  });

  test("the plan shows the higher of two surfaces and traces its cut in black", () => {
    // The crate's top (y 1.5) hides the blue slab under it at x 3, z 2.5: pixel (280, 190).
    // The box crossing the cut has its x = 6 face on column 340, rows 244..260.
    expect(primaryAt(PLAN, FLOOR_PLAN, 280, 190)).toBe("red");
    expect(floorPlanAt(340, 250)).toEqual([0, 0, 0]);
  });

  test("the crate covers x 2..4 and z 1..4 on the floor plan within one pixel", () => {
    const rect = { left: 260, top: 160, right: 300, bottom: 220 };
    expect(coverageMisses(PLAN, FLOOR_PLAN, rect)).toEqual([]);
  });

  test("the hanging box shows on the overhead plan only", () => {
    const rect = { left: 140, top: 80, right: 180, bottom: 120 };
    expect(surfaceInside(PLAN, FLOOR_PLAN, rect)).toEqual([]);
    expect(coverageMisses(PLAN, OVERHEAD_PLAN, rect)).toEqual([]);
  });

  test("the floor plan cuts at 5.9 m and the overhead plan at 16.2 m", () => {
    // Boxes at y 5.85 and 5.92 cover x 4..5 and 6..7 (columns 300 and 340) at z -6..-5 (rows
    // 20..40); boxes at y 16.15 and 16.22 cover the same columns at rows 50..70.
    const under = { left: 300, top: 20, right: 320, bottom: 40 };
    const over = { left: 340, top: 20, right: 360, bottom: 40 };
    const underHigh = { left: 300, top: 50, right: 320, bottom: 70 };
    const overHigh = { left: 340, top: 50, right: 360, bottom: 70 };
    expect(coverageMisses(PLAN, FLOOR_PLAN, under)).toEqual([]);
    expect(surfaceInside(PLAN, FLOOR_PLAN, over)).toEqual([]);
    expect(coverageMisses(PLAN, OVERHEAD_PLAN, over)).toEqual([]);
    expect(coverageMisses(PLAN, OVERHEAD_PLAN, underHigh)).toEqual([]);
    expect(surfaceInside(PLAN, OVERHEAD_PLAN, overHigh)).toEqual([]);
  });
});

describe("plan sheet marks", () => {
  test("each spawn carries its colour and its 6 m circle", () => {
    // The player spawn (-4, -4) is pixel (140, 60), its dot 5 px square; 6 m east is pixel
    // (260, 60). The minion
    // spawn (5, 4) is pixel (320, 220). The overhead plan carries the same marks at the same
    // tile pixels.
    expect([
      floorPlanAt(140, 60),
      floorPlanAt(142, 62),
      floorPlanAt(260, 60),
      floorPlanAt(250, 60),
      floorPlanAt(320, 220),
      tilePixel(PLAN, OVERHEAD_PLAN, 140, 60),
    ]).toEqual([PLAYER_MARK, PLAYER_MARK, PLAYER_MARK, MAGENTA, MINION_MARK, PLAYER_MARK]);
  });

  test("each prop carries its own number in description order", () => {
    // The plates (10 x 14 px) are centred on the props' pixels (140, 220) and (300, 260); the
    // glyph cells of 2 px start 2 px inside, at (137, 215) and (297, 255). The second row of
    // "1" inks its left cell and not its right one; the second row of "2" does the opposite.
    const black = [0, 0, 0];
    const white = [255, 255, 255];
    expect([
      floorPlanAt(137, 217),
      floorPlanAt(141, 217),
      floorPlanAt(297, 257),
      floorPlanAt(301, 257),
      tilePixel(PLAN, OVERHEAD_PLAN, 137, 217),
      tilePixel(PLAN, OVERHEAD_PLAN, 141, 217),
    ]).toEqual([black, white, white, black, black, white]);
  });

  test("a 10 m grid crosses the plan, its lines labelled with their coordinates", () => {
    // x = 0 is column 220; x = 5 (column 320) holds no line. Over the background the grid
    // mixes 45 % black into magenta. The label of x = -10 sits at (22, 2), its first glyph
    // cells at (24, 4): "-" leaves the top middle cell blank and inks its third row. The label
    // of z = 0 sits at (2, 142), its first cell at (4, 144): "0" inks it, "1" would not.
    expect([
      floorPlanAt(220, 250),
      floorPlanAt(320, 250),
      floorPlanAt(26, 4),
      floorPlanAt(24, 8),
      floorPlanAt(4, 144),
      tilePixel(PLAN, OVERHEAD_PLAN, 220, 250),
    ]).toEqual([[140, 0, 140], MAGENTA, [255, 255, 255], [0, 0, 0], [0, 0, 0], [140, 0, 140]]);
  });
});

describe("section sheet: size and elevations", () => {
  test("the sheet holds two elevations and two rows of three cross sections", () => {
    expect([SECTION.width, SECTION.height]).toEqual([1232, 1000]);
  });

  test("the crate covers z 1..4 and y 0.5..1.5 on the elevation toward +X within one pixel", () => {
    const rect = { left: 160, top: 170, right: 220, bottom: 190 };
    expect(coverageMisses(SECTION, TOWARD_PLUS_X, rect)).toEqual([]);
  });

  test("each elevation shows only its own side of the centre plane x = -1.25", () => {
    // The crate (x 2..4, z 1..4) falls on columns 60..120 toward -X; the post (x -3..-2.5,
    // z 2..3, y 4.5..5.5) on columns 180..200 toward +X and 80..100 toward -X, rows 90..110.
    const crate = { left: 60, top: 170, right: 120, bottom: 190 };
    expect(surfaceInside(SECTION, TOWARD_MINUS_X, crate)).toEqual([]);
    const postPlus = { left: 180, top: 90, right: 200, bottom: 110 };
    expect(surfaceInside(SECTION, TOWARD_PLUS_X, postPlus)).toEqual([]);
    const postMinus = { left: 80, top: 90, right: 100, bottom: 110 };
    expect(coverageMisses(SECTION, TOWARD_MINUS_X, postMinus)).toEqual([]);
    // The block (x 0..0.5, z -2..-1, y 3.6..4.4) on columns 100..120 toward +X and 160..180
    // toward -X, rows 112..128.
    const blockPlus = { left: 100, top: 112, right: 120, bottom: 128 };
    expect(coverageMisses(SECTION, TOWARD_PLUS_X, blockPlus)).toEqual([]);
    const blockMinus = { left: 160, top: 112, right: 180, bottom: 128 };
    expect(surfaceInside(SECTION, TOWARD_MINUS_X, blockMinus)).toEqual([]);
    // The thin box at x -1.2..-1.15 (z 5.5..6.5) lands on columns 250..270 toward +X and
    // 10..30 toward -X; the one at x -1.35..-1.3 (z 3.5..4.5) on 210..230 toward +X and
    // 50..70 toward -X; both on rows 30..50.
    const nearPlus = { left: 250, top: 30, right: 270, bottom: 50 };
    expect(coverageMisses(SECTION, TOWARD_PLUS_X, nearPlus)).toEqual([]);
    const nearPlusMirror = { left: 10, top: 30, right: 30, bottom: 50 };
    expect(surfaceInside(SECTION, TOWARD_MINUS_X, nearPlusMirror)).toEqual([]);
    const nearMinus = { left: 50, top: 30, right: 70, bottom: 50 };
    expect(coverageMisses(SECTION, TOWARD_MINUS_X, nearMinus)).toEqual([]);
    const nearMinusMirror = { left: 210, top: 30, right: 230, bottom: 50 };
    expect(surfaceInside(SECTION, TOWARD_PLUS_X, nearMinusMirror)).toEqual([]);
    // Toward +X the block (column 110, row 120) hides the red box behind it at x 3..3.5.
    expect(isGrey(SECTION, TOWARD_PLUS_X, 110, 120)).toBe(true);
  });
});

describe("section sheet: cross sections", () => {
  test("the crate covers x 2..4 and y 0.5..1.5 on the first cross section within one pixel", () => {
    const rect = { left: 260, top: 170, right: 300, bottom: 190 };
    expect(coverageMisses(SECTION, CROSSES[0], rect)).toEqual([]);
    // Looking toward -Z the block (column 225, row 120) hides the red box behind it.
    expect(isGrey(SECTION, CROSSES[0], 225, 120)).toBe(true);
  });

  test("six stations every 20 m each show their own 10 m; the first reaches the back wall", () => {
    // Columns from x + 11, rows from 10 - y: the wall behind the back at columns 240..260,
    // rows 40..60; the boxes in the second and sixth windows at 260..280, rows 80..100; the box
    // just behind the second window at columns 100..120. The second window's box stands at
    // z 15.02..15.08, within 0.1 m of the window's far edge (z 15); the box behind stands at
    // z 14..14.9, just past it. Together they pin the 10 m depth from both sides.
    const wall = { left: 240, top: 40, right: 260, bottom: 60 };
    const window = { left: 260, top: 80, right: 280, bottom: 100 };
    const behind = { left: 100, top: 80, right: 120, bottom: 100 };
    expect(crossesShowing(wall)).toEqual([1]);
    expect(crossesShowing(window)).toEqual([2, 6]);
    expect(crossesShowing(behind)).toEqual([]);
    expect(coverageMisses(SECTION, CROSSES[1], window)).toEqual([]);
    expect(coverageMisses(SECTION, CROSSES[5], window)).toEqual([]);
    // The second station stands at z 25: a box at z 24.92..24.98 (columns 40..60) shows in
    // its tile, a box at z 25.02..25.08 (columns 370..390) in none.
    expect(crossesShowing({ left: 40, top: 80, right: 60, bottom: 100 })).toEqual([2]);
    expect(crossesShowing({ left: 370, top: 80, right: 390, bottom: 100 })).toEqual([]);
  });

  test("height lines mark each floor and each clearance above each floor", () => {
    // On a tile whose top is y = 10 m: floors 0 and 0.3 m on rows 200 and 194; 2.17, 2.47, 3
    // and 3.3 m on rows 156, 150, 140 and 134; row 145 holds no line.
    const white = [255, 255, 255];
    const yellow = [255, 230, 0];
    expect([200, 194, 156, 150, 140, 134, 145].map(elevationAt)).toEqual([
      white,
      white,
      yellow,
      yellow,
      yellow,
      yellow,
      MAGENTA,
    ]);
    // The cross sections carry the same lines: column 5 of the third cross tile.
    expect([200, 156].map((y) => tilePixel(SECTION, CROSSES[2], 5, y))).toEqual([white, yellow]);
  });
});

describe("view sheet", () => {
  test("the player looks toward the back wall, then toward the sealed end, at eye height", () => {
    // Each marker lies 12 m ahead, 4 m right and 2 m up: pixel (380, 150), +-1.5 px.
    expect(primaryAt(VIEW, PLAYER_TO_BACK, 379, 149)).toBe("red");
    expect(primaryAt(VIEW, PLAYER_TO_END, 379, 149)).toBe("green");
  });

  test("a surface 0.1 m from the eye shows; a minion figure shows in its colour and size", () => {
    // The yellow box (x -4.03..-4.01, y 1.70..1.71) has its near face 0.10 m ahead and its
    // far face 0.12 m ahead: it covers columns 266..305 and rows 195..216.
    const [r, g, b] = pixelAt(VIEW, PLAYER_TO_BACK[0] + 285, PLAYER_TO_BACK[1] + 207);
    expect(r > 0 && g > 0 && b === 0).toBe(true);
    // Toward the sealed end the minion figure (x 4.75..5.25, z 3.75..4.25, y 0.3..2.17) shows
    // its near face 7.75 m ahead and 8.75 to 9.25 m left: columns 105..117. Its top edge,
    // 0.45 m above the eye, lands on row 180 - 180 * 0.45 / 7.75 = 169.5: row 171 shows the
    // figure, row 167 the background.
    const [fr, fg, fb] = pixelAt(VIEW, PLAYER_TO_END[0] + 111, PLAYER_TO_END[1] + 171);
    expect(fr > fg && fg > 0 && fb === 0).toBe(true);
    expect(isBackground(VIEW, PLAYER_TO_END[0] + 111, PLAYER_TO_END[1] + 167)).toBe(true);
    // Its 0.5 m width: the near face's left edge (x 5.25) lands on column 105.2, so column 104
    // shows the background and 106 the figure; the side face (x 4.75) ends at its back corner
    // (z 4.25, 8.25 m ahead) on column 129.1, so column 131 shows the background.
    expect(isBackground(VIEW, PLAYER_TO_END[0] + 104, PLAYER_TO_END[1] + 175)).toBe(true);
    const [wr, wg, wb] = pixelAt(VIEW, PLAYER_TO_END[0] + 106, PLAYER_TO_END[1] + 175);
    expect(wr > wg && wg > 0 && wb === 0).toBe(true);
    expect(isBackground(VIEW, PLAYER_TO_END[0] + 131, PLAYER_TO_END[1] + 175)).toBe(true);
  });

  test("a player tile is not blocked by the player's own figure", () => {
    expect(isBackground(VIEW, PLAYER_TO_BACK[0] + 320, PLAYER_TO_BACK[1] + 180)).toBe(true);
    expect(isBackground(VIEW, PLAYER_TO_END[0] + 320, PLAYER_TO_END[1] + 180)).toBe(true);
  });

  test("the minion looks from its eye at the player's eye", () => {
    // The eye stands 1.72 m above the spawn on the 0.3 m floor: (5, 2.02, 4). The centre sees
    // the player figure; its top edge (1.87 m) lands near row 177.7, so row 174 shows the
    // background. The marker (-12.94, 5.72, -11.95), 0.4 m wide, lies 23.90 m ahead, on the
    // centre column and 3.71 m up: rows 146.1..149.1, so row 147 shows it; an eye 0.3 m
    // lower would move it to rows 148.5..151.5.
    expect(isPlayerFigure(MINION, 320, 180)).toBe(true);
    expect(isBackground(VIEW, MINION[0] + 320, MINION[1] + 174)).toBe(true);
    expect(primaryAt(VIEW, MINION, 319, 147)).toBe("blue");
    // The cyan marker 6 m along the view and 0.5 m above it, 0.1 m wide, covers rows
    // 163.5..166.5 of the centre columns; an eye 0.1 m higher would move it to 165..168.
    expect(isCyan(MINION, 319, 164)).toBe(true);
  });

  test("the overviews look from 12 m up at each end toward the floor's centre", () => {
    // Back eye (-1.25, 12, -4.5): the crate's top point (3, 1.5, 2.5) lies 12.29 m ahead,
    // 4.25 m left and 2.87 m up, pixel (257.7, 138.0). End eye (-1.25, 12, 4.5): 10.53 m
    // ahead, 4.25 m right and 1.81 m down, pixel (392.6, 211.0).
    expect(primaryAt(VIEW, OVERVIEW_BACK, 257, 138)).toBe("red");
    expect(primaryAt(VIEW, OVERVIEW_END, 392, 211)).toBe("red");
    // The 0.3 m markers, +-1.3 px: from the back eye, (-3, -6, 6) lies 20.54 m ahead, 1.75 m
    // right and 3.51 m up, pixel (335.3, 149.2); from the end eye, (0.5, -6, -3) lies
    // 19.49 m ahead, 1.75 m right and 0.70 m up, pixel (336.2, 173.5).
    expect(primaryAt(VIEW, OVERVIEW_BACK, 335, 149)).toBe("green");
    expect(primaryAt(VIEW, OVERVIEW_END, 336, 173)).toBe("blue");
    // The 0.1 m cyan markers about 3 m from each eye, at (-0.95, 9.2, -3.4) and
    // (-1.55, 9.2, 3.4), lie 3.01 m ahead and 0.3 m left: pixel (302.1, 177.2), +-3 px. An eye
    // 0.5 m higher moves them to rows 181..187, a look-at point 0.5 m higher to 177..183.
    expect(isCyan(OVERVIEW_BACK, 302, 175)).toBe(true);
    expect(isCyan(OVERVIEW_END, 302, 175)).toBe(true);
  });
});
