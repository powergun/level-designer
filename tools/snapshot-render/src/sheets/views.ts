import type { WorldTriangles } from "@level-designer/level-glb";
import type { Raster } from "../raster/index.js";
import type { TileSize, Vec3 } from "../render/index.js";
import { perspectiveView, renderTile } from "../render/index.js";
import { figuresSeenFrom } from "./figures.js";
import type { CustomView, SnapshotInput } from "./input.js";
import { composeSheet } from "./layout.js";

/** The pixel size of a perspective tile. */
const VIEW_TILE: TileSize = { width: 640, height: 360 };
/** The perspective tiles per sheet row. */
const PER_ROW = 4;
/** The overviews' height above the interior's floor, metres. */
const OVERVIEW_HEIGHT = 12;
/** How far inside the interior's end faces the overview eyes stand, metres. */
const OVERVIEW_INSET = 0.5;

/** The point `height` above another. */
function above(point: Vec3, height: number): Vec3 {
  return [point[0], point[1] + height, point[2]];
}

/**
 * The eight shots, in sheet order: the player spawn toward the back wall and toward the sealed
 * end, each minion spawn at the player spawn, then the overviews from the back and the end.
 */
function shotsOf(input: SnapshotInput): readonly CustomView[] {
  const { min, max } = input.interior;
  const player = above(input.playerSpawn, input.eyeHeight);
  const centre: Vec3 = [(min[0] + max[0]) / 2, min[1], (min[2] + max[2]) / 2];
  const overview = (z: number): CustomView => ({
    eye: [centre[0], min[1] + OVERVIEW_HEIGHT, z],
    lookAt: centre,
  });
  return [
    { eye: player, lookAt: [player[0], player[1], player[2] - 1] },
    { eye: player, lookAt: [player[0], player[1], player[2] + 1] },
    ...input.minionSpawns.map((spawn) => ({ eye: above(spawn, input.eyeHeight), lookAt: player })),
    overview(min[2] + OVERVIEW_INSET),
    overview(max[2] - OVERVIEW_INSET),
  ];
}

/** One perspective tile through the lens, with the figures at the spawns. */
function viewTile(triangles: WorldTriangles, input: SnapshotInput, shot: CustomView): Raster {
  const view = perspectiveView(shot.eye, shot.lookAt, input.lens, VIEW_TILE);
  return renderTile([triangles, figuresSeenFrom(input, shot.eye)], view);
}

/** The view sheet: the eight perspective tiles, four per row. */
export function viewSheet(triangles: WorldTriangles, input: SnapshotInput): Raster {
  const tiles = shotsOf(input).map((shot) => viewTile(triangles, input, shot));
  const rows: Raster[][] = [];
  for (let first = 0; first < tiles.length; first += PER_ROW) {
    rows.push(tiles.slice(first, first + PER_ROW));
  }
  return composeSheet(rows);
}

/** The custom sheet: one perspective tile from the custom eye toward its look-at point. */
export function customSheet(
  triangles: WorldTriangles,
  input: SnapshotInput,
  custom: CustomView,
): Raster {
  return composeSheet([[viewTile(triangles, input, custom)]]);
}
