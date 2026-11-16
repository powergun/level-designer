import { describe, expect, test } from "bun:test";
import type { Sheets, SnapshotInput } from "@level-designer/snapshot-render";
import { renderSheets } from "@level-designer/snapshot-render";
import type { SceneBox } from "./box-scene.js";
import { boxScene } from "./box-scene.js";
import { isBackground } from "./coverage.js";
import type { Pixels } from "./png-pixels.js";
import { decodePng, pixelAt } from "./png-pixels.js";
import { INPUT } from "./scene.js";

// Owner: snapshot-render's perspective tiles. The custom tile is 640 x 360 px at (8, 8); a
// 90 degree vertical field of view puts the focal length at 180 px, so a point at depth d,
// offset by (a, b) from the axis, lands on pixel (320 + 180 a / d, 180 - 180 b / d).

/** The custom eye 1 m above the origin, looking toward -Z. */
const LOOK_BACK = { eye: [0, 1, 0], lookAt: [0, 1, -10] } as const;

/** Pixel offsets from the tile centre that stay at least 5 px inside the hole's outline. */
const HOLE_OFFSETS = [-55, 0, 55].flatMap((dx) => [-25, 0, 25].map((dy) => [dx, dy] as const));

/**
 * The scene input with no minion and a small interior, so the plan and section tiles stay
 * small; the custom view does not depend on the interior. Its x window starts at -9, 1 m
 * above a multiple of 10, so the first grid line inside the window is x = 0.
 */
const SMALL_INPUT: SnapshotInput = {
  ...INPUT,
  interior: { min: [-7, 0, 0], max: [1, 1, 1] },
  minionSpawns: [],
};

/** A 0.2 m cube around a point. */
function cubeAt(centre: readonly [number, number, number], color: string): SceneBox {
  const [x, y, z] = centre;
  return { min: [x - 0.1, y - 0.1, z - 0.1], max: [x + 0.1, y + 0.1, z + 0.1], color };
}

/** The custom tile's pixel at tile column x and row y. */
function tilePixel(pixels: Pixels, x: number, y: number): readonly [number, number, number] {
  return pixelAt(pixels, 8 + x, 8 + y);
}

/** Whether a pixel of a sheet shows pure red, as the lit red cube does. */
function isRed(pixels: Pixels, x: number, y: number): boolean {
  const [r, g, b] = tilePixel(pixels, x, y);
  return r > 0 && g === 0 && b === 0;
}

/** Whether two optional sheets hold the same bytes. */
function same(a?: Uint8Array, b?: Uint8Array): boolean {
  return a !== undefined && b !== undefined && Buffer.compare(a, b) === 0;
}

/** The decoded custom sheet of rendered sheets. */
function customOf(sheets: Sheets): Pixels {
  if (sheets.custom === undefined) throw new Error("the input names a custom view");
  return decodePng(sheets.custom);
}

describe("custom view", () => {
  // A red cube 10 m ahead and 5 m up lands on (320, 90); a green cube 10 m ahead and 80/9 m to
  // the right, at eye height, lands on (480, 180).
  // A yellow box 6 m ahead (x -0.2..0.2, y 1.05..1.25: columns 314..326, rows 172.5..178.5)
  // stands in front of a blue box 20 m ahead (x -1..1, y 1.3..1.6: columns 311..329, rows
  // 174.6..177.3).
  const CUBES = boxScene([
    cubeAt([0, 6, -10], "#ff0000"),
    cubeAt([80 / 9, 1, -10], "#00ff00"),
    { min: [-1, 1.3, -20.2], max: [1, 1.6, -20], color: "#0000ff" },
    { min: [-0.2, 1.05, -6.2], max: [0.2, 1.25, -6], color: "#ffff00" },
  ]);
  const SHEET = customOf(
    renderSheets(CUBES, { ...SMALL_INPUT, minionSpawns: [[3, 0.3, -4]], custom: LOOK_BACK }),
  );

  test("a known point lands on its pixel within one pixel", () => {
    expect([
      isRed(SHEET, 319, 89),
      isRed(SHEET, 320, 89),
      isRed(SHEET, 319, 90),
      isRed(SHEET, 320, 90),
    ]).toEqual([true, true, true, true]);
    expect([316, 324].map((x) => isBackground(SHEET, 8 + x, 8 + 90))).toEqual([true, true]);
    expect([86, 94].map((y) => isBackground(SHEET, 8 + 320, 8 + y))).toEqual([true, true]);
  });

  test("a near surface hides a far one", () => {
    const [r, g, b] = tilePixel(SHEET, 320, 176);
    expect(r > 0 && g > 0 && b === 0).toBe(true);
    const [fr, fg, fb] = tilePixel(SHEET, 328, 176);
    expect(fb > 0 && fr === 0 && fg === 0).toBe(true);
  });

  test("a point off both axes lands on its pixel within one pixel", () => {
    const [r, g, b] = tilePixel(SHEET, 479, 179);
    expect(g > 0 && r === 0 && b === 0).toBe(true);
    expect([476, 484].map((x) => isBackground(SHEET, 8 + x, 8 + 179))).toEqual([true, true]);
  });

  test("the figure stands at the spawn from the feet to the figure height", () => {
    // The spawn's figure, a 0.5 m box from y 0 to 1.87, has its near face at z = -3.75: its
    // top lands on row 180 - 180 * 0.87 / 3.75 = 138.2 at column 140.
    const [r, , b] = tilePixel(SHEET, 140, 141);
    expect(b > r).toBe(true);
    expect(isBackground(SHEET, 8 + 140, 8 + 136)).toBe(true);
    // Its feet stand on the spawn (y 0): the near face's bottom lands on row 180 + 180 / 3.75
    // = 228, so row 226 shows the figure and row 230 the background.
    const [fr, , fb] = tilePixel(SHEET, 128, 226);
    expect(fb > fr).toBe(true);
    expect(isBackground(SHEET, 8 + 128, 8 + 230)).toBe(true);
    // A minion figure stands on its spawn's floor, 0.3 m up at (3, 0.3, -4): its near face
    // (x 2.75..3.25, 3.75 m ahead) covers columns 452..476 down to row 180 + 180 * 0.7 / 3.75
    // = 213.6, so row 210 shows it and row 220 the background.
    const [mr, mg, mb] = tilePixel(SHEET, 464, 210);
    expect(mr > mg && mg > 0 && mb === 0).toBe(true);
    expect(isBackground(SHEET, 8 + 464, 8 + 220)).toBe(true);
  });
});

describe("box room with a hole", () => {
  // A 6 m room with 0.2 m walls; the back wall at z = -3 has a 2 x 1 m hole around (0, 1.5).
  const WALL = "#808080";
  const ROOM: readonly SceneBox[] = [
    { min: [-3.2, -0.2, -3.2], max: [3.2, 0, 3.2], color: WALL },
    { min: [-3.2, 3, -3.2], max: [3.2, 3.2, 3.2], color: WALL },
    { min: [-3.2, 0, -3.2], max: [-3, 3, 3.2], color: WALL },
    { min: [3, 0, -3.2], max: [3.2, 3, 3.2], color: WALL },
    { min: [-3, 0, 3], max: [3, 3, 3.2], color: WALL },
    { min: [-3, 0, -3.2], max: [-1, 3, -3], color: WALL },
    { min: [1, 0, -3.2], max: [3, 3, -3], color: WALL },
    { min: [-1, 0, -3.2], max: [1, 1, -3], color: WALL },
    { min: [-1, 2, -3.2], max: [1, 3, -3], color: WALL },
  ];
  // The player spawn stands 50 m outside the room: its figure stays out of the custom view,
  // and the view tiles, which these tests do not read, see the room small and stay cheap.
  const HOLE_INPUT: SnapshotInput = {
    ...SMALL_INPUT,
    playerSpawn: [40, 0, 40],
    custom: { eye: [0, 1.5, 0], lookAt: [0, 1.5, -3] },
  };
  const GLB = boxScene(ROOM);
  const FIRST = renderSheets(GLB, HOLE_INPUT);
  const SHEET = customOf(FIRST);

  test("the background shows through the hole and the wall around it", () => {
    // At depth 3 the hole spans 60 px to each side of the centre and 30 px up and down.
    const through = HOLE_OFFSETS.filter(
      ([dx, dy]) => !isBackground(SHEET, 8 + 320 + dx, 8 + 180 + dy),
    );
    expect(through).toEqual([]);
    const wall = [
      [320, 140],
      [320, 220],
      [220, 180],
      [420, 180],
    ].map(([x = 0, y = 0]) => isBackground(SHEET, 8 + x, 8 + y));
    expect(wall).toEqual([false, false, false, false]);
  });

  test("no grid line or label falls outside the plan window", () => {
    // The x window starts at -9; the line x = -10 lies outside it, so its label, which would
    // start 2 px right of column -20, must not reach the tile's top left corner (3, 4).
    const plan = decodePng(FIRST.plan);
    expect(isBackground(plan, 8 + 3, 8 + 4)).toBe(true);
  });

  test("two renders in one run are byte-identical", () => {
    const second = renderSheets(GLB, HOLE_INPUT);
    expect([
      same(FIRST.plan, second.plan),
      same(FIRST.section, second.section),
      same(FIRST.view, second.view),
      same(FIRST.custom, second.custom),
    ]).toEqual([true, true, true, true]);
  });
});
