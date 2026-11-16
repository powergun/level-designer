import type { Raster, Rgb8 } from "../raster/index.js";
import { drawCentredLabel, drawCircle, drawLabel, fillRect, paint } from "../raster/index.js";
import type { Vec3, View } from "../render/index.js";
import { pixelOf } from "../render/index.js";
import type { SnapshotInput } from "./input.js";
import type { Span } from "./orthographic.js";
import { PIXELS_PER_METRE } from "./orthographic.js";

/** The player spawn's marker colour on the plan. */
const PLAYER_MARK: Rgb8 = [0, 200, 255];
/** A minion spawn's marker colour on the plan. */
const MINION_MARK: Rgb8 = [255, 120, 0];
/** The grid colour. */
const GRID: Rgb8 = [0, 0, 0];
/** The grid's opacity. */
const GRID_ALPHA = 0.45;
/** The colour of a floor height line on a section tile. */
const FLOOR_LINE: Rgb8 = [255, 255, 255];
/** The colour of a clearance height line on a section tile. */
const CLEARANCE_LINE: Rgb8 = [255, 230, 0];
/** The plan grid's pitch, metres. */
const GRID_PITCH = 10;
/** The radius of the circle around each spawn on the plan, metres. */
const SPAWN_RADIUS = 6;

/** The multiples of the grid pitch inside a span. */
function gridLines(span: Span): readonly number[] {
  const lines: number[] = [];
  for (let at = Math.ceil(span.low / GRID_PITCH) * GRID_PITCH; at < span.high; at += GRID_PITCH) {
    lines.push(at);
  }
  return lines;
}

/** The 10 m grid of a plan tile, each line labelled with its coordinate at the tile's edge. */
export function drawPlanGrid(tile: Raster, x: Span, z: Span): void {
  for (const at of gridLines(x)) {
    const column = (at - x.low) * PIXELS_PER_METRE;
    for (let row = 0; row < tile.height; row++) paint(tile, column, row, GRID, GRID_ALPHA);
    drawLabel(tile, String(at), [column + 2, 2]);
  }
  for (const at of gridLines(z)) {
    const row = (at - z.low) * PIXELS_PER_METRE;
    for (let column = 0; column < tile.width; column++) paint(tile, column, row, GRID, GRID_ALPHA);
    drawLabel(tile, String(at), [2, row + 2]);
  }
}

/** One spawn on a plan tile: a dot and the circle of the spawn radius. */
function drawSpawn(tile: Raster, view: View, spawn: Vec3, color: Rgb8): void {
  const [column, row] = pixelOf(view, spawn);
  fillRect(tile, [column - 2, row - 2], [5, 5], color);
  drawCircle(tile, [column, row], SPAWN_RADIUS * PIXELS_PER_METRE, color);
}

/** The spawns with their circles and each prop's number on a plan tile. */
export function drawPlanMarks(tile: Raster, view: View, input: SnapshotInput): void {
  drawSpawn(tile, view, input.playerSpawn, PLAYER_MARK);
  for (const spawn of input.minionSpawns) drawSpawn(tile, view, spawn, MINION_MARK);
  input.props.forEach((point, index) => {
    drawCentredLabel(tile, String(index + 1), pixelOf(view, point));
  });
}

/** One full-width height line on a section tile at height `y`. */
function drawHeightLine(tile: Raster, view: View, y: number, color: Rgb8): void {
  const row = pixelOf(view, [view.frame.origin[0], y, view.frame.origin[2]])[1];
  for (let column = 0; column < tile.width; column++) paint(tile, column, row, color, 1);
}

/** The floor lines and the clearance lines above each floor on a section tile. */
export function drawHeightLines(tile: Raster, view: View, input: SnapshotInput): void {
  for (const floor of input.floors) {
    drawHeightLine(tile, view, floor, FLOOR_LINE);
    for (const clearance of input.clearances) {
      drawHeightLine(tile, view, floor + clearance, CLEARANCE_LINE);
    }
  }
}
