import { describe, expect, test } from "bun:test";
import type { DrawnRecipe, Layer } from "@level-designer/level-format";
import {
  type FinishSwatch,
  type HallClass,
  renderFinishSheet,
} from "@level-designer/snapshot-render";
import { glyphRows, mark, plateSpans, redAt } from "./page-reading.js";
import { decodePng, type Pixels } from "./png-pixels.js";

// Owner: the finish sheet's page of a hall finish. Expected pixels come from the stated
// layout (8 px gutters, the title row 14 px high, a tile of its face, 4 px of ruler ticks, a
// row of numbers 14 px high, a gap of 2 and a caption 14 px high) and from the hall's frame
// rule on an interior of X -10..10, Y 0..9, Z -35..35. A wall faces +X: `x` is level Z.
// A white ground is 255, the tile ground and the gutters 48.

/** The interior box of the tests. */
const INTERIOR = { min: [-10, 0, -35], max: [10, 9, 35] } as const;

/** Black marks, each on one class: they pin its window, its orientation and its rulers. */
const LAYERS: readonly Layer[] = [
  // The wall: level Z -30..-29 at every height, and every Z above 7 m.
  mark("outside", [-30, 0], [-29, 100], { shade: 0 }),
  mark("outside", [-100, 7], [100, 100], { shade: 0 }),
  // The ceiling: X below -9 and Z below -34, its back corner.
  mark("bottom", [-100, -100], [-9, -34], { shade: 0 }),
  // The floor: Z below -34 at the back wall, and a floor line 0.1 m wide at Z 10.
  mark("top", [-100, -35], [100, -34], { shade: 0 }),
  mark("top", [-100, 10], [100, 10.1], { shade: 0 }),
];

/** A hall finish's recipe: the default body, no body of its own, and the marks above. */
const RECIPE: DrawnRecipe = {
  body: { shade: 1, metalness: 0, roughness: 0.6, lit: 0 },
  layers: LAYERS,
  light: "#ffffff",
};

/** The box of an interior, as `SnapshotInput.interior` states it. */
type Interior = { readonly min: Vec3; readonly max: Vec3 };
/** Three metres along X, Y and Z. */
type Vec3 = readonly [number, number, number];

/** The page of the marks on a white ground for the given classes of an interior. */
function pageOf(classes: readonly HallClass[], interior: Interior = INTERIOR): Pixels {
  const swatch: FinishSwatch = {
    label: "test/hall",
    recipe: RECIPE,
    tint: "#ffffff",
    subject: { kind: "hall", interior, classes },
  };
  return decodePng(renderFinishSheet(swatch));
}

/**
 * The wall and the ceiling, each 800 x 400 px at 20 mm: the wall tile is 825 wide (its last
 * Z number "-19" at column 799), the ceiling 830 (its right ruler of "-35"); they pass 1,520
 * together, so the ceiling opens row two at y 30 + 434 + 8.
 */
const WALLS = pageOf(["outside", "bottom"]);
const WALL = [8, 30] as const;
const CEILING = [8, 472] as const;

/**
 * The floor of an interior as long as the hall's, Z -35..85.2: 400 x 2,404 px at 50 mm, in
 * two parts of 60.1 m and 1,202 rows side by side. The back part is 430 wide (its right
 * ruler "-30"), the front part beside it at x 8 + 430 + 8.
 */
const FLOOR = pageOf(["top"], { min: [-10, 0, -35], max: [10, 9, 85.2] });
const BACK = [8, 30] as const;
const FRONT = [446, 30] as const;

/** The page of a floor 2 m wide (40 px) from Z 0 to `z`. */
function deepFloor(z: number): Pixels {
  return pageOf(["top"], { min: [-1, 0, 0], max: [1, 9, z] });
}

/** The parts side by side on a page of 2 m floors, each as wide as its caption, 114 px. */
function partsOf(page: Pixels): number {
  return (page.width - 8) / (114 + 8);
}

describe("the finish sheet's hall page", () => {
  test("a wall and a ceiling draw a 16 x 8 m window from the low corner at 20 mm", () => {
    expect([WALLS.width, WALLS.height]).toEqual([8 + 830 + 8, 472 + 434 + 8]);
    // Wall column c is level Z -35 + (c + 0.5) * 0.02; row r is Y 8 - (r + 0.5) * 0.02.
    for (const [origin, column, row, red] of [
      [WALL, 249, 200, 255],
      [WALL, 250, 200, 0],
      [WALL, 299, 200, 0],
      [WALL, 300, 200, 255],
      [WALL, 100, 49, 0],
      [WALL, 100, 50, 255],
      [WALL, 799, 200, 255],
      [WALL, 800, 210, 48],
      // Ceiling column c is X -10 + (c + 0.5) * 0.02; row r is Z -35 + (r + 0.5) * 0.02.
      [CEILING, 49, 49, 0],
      [CEILING, 50, 10, 255],
      [CEILING, 10, 50, 255],
      [CEILING, 10, 399, 255],
    ] as const) {
      expect(redAt(WALLS, origin, column, row)).toBe(red);
    }
    expect(plateSpans(WALLS, [WALL[0], WALL[1] + 420], 18)).toBe(true);
    expect(plateSpans(WALLS, [CEILING[0], CEILING[1] + 420], 17)).toBe(true);
  });

  test("a floor draws whole at 50 mm in the plan's orientation, in parts side by side", () => {
    expect([FLOOR.width, FLOOR.height]).toEqual([8 + 430 + 8 + 422 + 8, 30 + 1236 + 8]);
    // Back row r is Z -35 + (r + 0.5) * 0.05; the front part starts at Z 25.1.
    for (const [origin, column, row, red] of [
      [BACK, 10, 19, 0],
      [BACK, 10, 20, 255],
      [BACK, 10, 899, 255],
      [BACK, 10, 900, 0],
      [BACK, 10, 901, 0],
      [BACK, 10, 902, 255],
      [BACK, 10, 1201, 255],
      [FRONT, 10, 0, 255],
      [FRONT, 399, 1201, 255],
      [FRONT, 400, 300, 48],
    ] as const) {
      expect(redAt(FLOOR, origin, column, row)).toBe(red);
    }
  });

  test("a floor of 1,496 rows stays whole, and parts reach the reader's edge", () => {
    // A floor 2 m wide is 40 px: each part is as wide as its caption, 114 px. 74.8 m is
    // 1,496 rows, one part 1,530 px high with its rulers and caption: a page of 1,568 px.
    const pages = [deepFloor(74.8), deepFloor(74.85), deepFloor(149.6), deepFloor(149.65)];
    expect(pages.map(partsOf)).toEqual([1, 2, 2, 3]);
    // At the limits a part keeps 1,496 rows; three parts of 149.65 m keep 998 rows each.
    expect([pages[0]?.height, pages[2]?.height, pages[3]?.height]).toEqual([1568, 1568, 1070]);
  });
});

describe("the finish sheet's hall rulers and empty page", () => {
  test("the rulers number level coordinates", () => {
    for (const [page, origin, column, row, red] of [
      // The floor: X 0 at column 200, Z -30 at row 100, ticks every 10 m.
      [FLOOR, BACK, 200, 1202, 255],
      [FLOOR, BACK, 100, 1203, 48],
      [FLOOR, BACK, 401, 100, 255],
      [FLOOR, BACK, 401, 101, 48],
      // The wall: Y 7 at row 50 from the top, Z -34 at column 50, ticks every metre.
      [WALLS, WALL, 801, 50, 255],
      [WALLS, WALL, 50, 401, 255],
      [WALLS, WALL, 75, 401, 48],
    ] as const) {
      expect(redAt(page, origin, column, row)).toBe(red);
    }
    expect(glyphRows(FLOOR, [BACK[0] + 404, BACK[1] + 100], 0, 2)).toEqual([
      "... ..# #.#",
      "### .## #.#",
      "... ..# #.#",
    ]);
    // The wall's height counts up from the floor: "7" stands at row 50, not "1".
    expect(glyphRows(WALLS, [WALL[0] + 804, WALL[1] + 50], 0, 0)).toEqual(["..#", ".#.", ".#."]);
    expect(glyphRows(WALLS, [WALL[0], WALL[1] + 404], 0, 2)).toEqual([
      "... ..# #..",
      "### .## ###",
      "... ..# ..#",
    ]);
  });

  test("a role with no layer's class gets its title alone", () => {
    const empty = pageOf([]);
    expect([empty.width, empty.height]).toEqual([8 + 74 + 8, 30]);
  });
});
