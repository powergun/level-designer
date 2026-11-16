import { describe, expect, test } from "bun:test";
import type { WorldTriangles } from "@level-designer/level-glb";
import type { View } from "./index.js";
import { perspectiveView, pixelOf, renderTile } from "./index.js";

// Owner: the render unit: triangle coverage, the cut trace and the depth outline, on hand-built
// triangles. A top view at 10 px per metre puts world (x, z) on pixel (10 x, 10 z).

/** A 100 x 100 px top view kept below the cut height `cut`, +X right and -Z up. */
function topView(cut: number): View {
  return {
    width: 100,
    height: 100,
    frame: { origin: [0, cut, 0], right: [1, 0, 0], up: [0, 0, -1], forward: [0, -1, 0] },
    projection: { kind: "orthographic", pixelsPerMetre: 10 },
    keep: [{ normal: [0, 1, 0], offset: cut }],
    cut: true,
  };
}

/** White triangles from flat corner lists, three corners of xyz each. */
function triangles(...corners: readonly (readonly number[])[]): WorldTriangles {
  return {
    positions: Float64Array.from(corners.flat()),
    colors: new Float32Array(corners.length * 3).fill(1),
  };
}

/** Two triangles of the quad a, b, c, d, wound in order. */
function quad(
  a: readonly number[],
  b: readonly number[],
  c: readonly number[],
  d: readonly number[],
) {
  return [
    [...a, ...b, ...c],
    [...a, ...c, ...d],
  ];
}

/** The sRGB bytes at a tile pixel. */
function rgbAt(tile: { readonly width: number; readonly rgb: Uint8Array }, x: number, y: number) {
  const at = (y * tile.width + x) * 3;
  return [...tile.rgb.subarray(at, at + 3)];
}

/** The loud background. */
const MAGENTA = [255, 0, 255];

describe("render unit: coverage, trace and outline", () => {
  test("a triangle covers only its own half of its bounding box", () => {
    // The triangle (0, 0), (10, 0), (0, 10) covers the pixels whose centres satisfy x + z <= 10.
    const tile = renderTile([triangles([0, 0, 0, 10, 0, 0, 0, 0, 10])], topView(10));
    const wrong: string[] = [];
    for (let row = 0; row < 100; row++) {
      for (let column = 0; column < 100; column++) {
        const background = rgbAt(tile, column, row).join() === MAGENTA.join();
        if (column + row <= 97 && background) wrong.push(`${column},${row}`);
        if (column + row >= 101 && !background) wrong.push(`${column},${row}`);
      }
    }
    expect(wrong).toEqual([]);
  });

  test("a wall that crosses the cut draws its trace in black", () => {
    // The wall x = 5.05, z 2..8, y 0..3 projects to no area; its cut at y = 1 is column 50.
    const wall = quad([5.05, 0, 2], [5.05, 0, 8], [5.05, 3, 8], [5.05, 3, 2]);
    const tile = renderTile([triangles(...wall)], topView(1));
    // Rows 25 and 75 lie on the traces of the wall's two triangles.
    expect([rgbAt(tile, 50, 25), rgbAt(tile, 50, 75), rgbAt(tile, 52, 50)]).toEqual([
      [0, 0, 0],
      [0, 0, 0],
      MAGENTA,
    ]);
  });

  test("a step in depth darkens the nearer edge, a flat floor stays plain", () => {
    // A floor at y = 0 under a box top at y = 1 over x 2..4, z 2..4 (pixels 20..39).
    const floor = quad([0, 0, 0], [10, 0, 0], [10, 0, 10], [0, 0, 10]);
    const top = quad([2, 1, 2], [4, 1, 2], [4, 1, 4], [2, 1, 4]);
    const tile = renderTile([triangles(...floor, ...top)], topView(10));
    const [edge, inside, plain, plainNext] = [
      rgbAt(tile, 20, 30),
      rgbAt(tile, 25, 30),
      rgbAt(tile, 60, 60),
      rgbAt(tile, 61, 60),
    ];
    expect((edge[0] ?? 0) < (inside[0] ?? 0)).toBe(true);
    expect(plain).toEqual(plainNext);
  });

  test("a floor seen at a grazing angle draws no outline", () => {
    // Eye 1.7 m up looking along -Z through a 90 degree lens: the focal length is 18 px on a
    // 64 x 36 tile, so row 18 sees the floor about 61 m away and row 34 about 2 m away.
    const floor = quad([-100, 0, 0], [100, 0, 0], [100, 0, -150], [-100, 0, -150]);
    const view = perspectiveView(
      [0, 1.7, 0],
      [0, 1.7, -1],
      { fovDeg: 90, near: 0.05, far: 160 },
      {
        width: 64,
        height: 36,
      },
    );
    const tile = renderTile([triangles(...floor)], view);
    expect(rgbAt(tile, 32, 18)).toEqual(rgbAt(tile, 32, 34));
  });
});

describe("render unit: light and camera", () => {
  test("the one light comes from the upper left of the tile", () => {
    // Four slopes of 0.75 seen from above; each one's normal leans toward one screen side.
    const leansLeft = quad([1, 0, 1], [3, 1.5, 1], [3, 1.5, 3], [1, 0, 3]);
    const leansRight = quad([5, 1.5, 1], [7, 0, 1], [7, 0, 3], [5, 1.5, 3]);
    const leansUp = quad([1, 0, 5], [3, 0, 5], [3, 1.5, 7], [1, 1.5, 7]);
    const leansDown = quad([5, 1.5, 5], [7, 1.5, 5], [7, 0, 7], [5, 0, 7]);
    const slopes = [...leansLeft, ...leansRight, ...leansUp, ...leansDown];
    const tile = renderTile([triangles(...slopes)], topView(10));
    const red = (x: number, y: number): number => rgbAt(tile, x, y)[0] ?? 0;
    expect(red(20, 20) > red(60, 20)).toBe(true);
    expect(red(20, 60) > red(60, 60)).toBe(true);
  });

  test("a view straight down keeps the back wall on top and +X on the right", () => {
    const lens = { fovDeg: 90, near: 0.05, far: 160 };
    const view = perspectiveView([0, 10, 0], [0, 0, 0], lens, { width: 64, height: 36 });
    // At depth 10 the focal length of 18 px puts 4 m off the axis 7.2 px from the centre (32, 18).
    expect([pixelOf(view, [0, 0, -4]), pixelOf(view, [4, 0, 0])]).toEqual([
      [32, 10],
      [39, 18],
    ]);
  });

  test("a view whose look-at point is its eye is refused", () => {
    const lens = { fovDeg: 90, near: 0.05, far: 160 };
    expect(() => perspectiveView([1, 2, 3], [1, 2, 3], lens, { width: 64, height: 36 })).toThrow(
      "a perspective view needs a look-at point apart from its eye",
    );
  });
});
