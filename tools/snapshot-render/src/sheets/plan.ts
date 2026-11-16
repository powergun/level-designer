import type { WorldTriangles } from "@level-designer/level-glb";
import type { Raster } from "../raster/index.js";
import type { View } from "../render/index.js";
import { renderTile } from "../render/index.js";
import type { SnapshotInput } from "./input.js";
import { composeSheet } from "./layout.js";
import { drawPlanGrid, drawPlanMarks } from "./marks.js";
import type { Span } from "./orthographic.js";
import { orthographicView, spanOf } from "./orthographic.js";

/** The cut of the floor plan, under the gantry decks, metres. */
const FLOOR_CUT = 5.9;
/** The cut of the overhead plan, under the trusses, metres. */
const OVERHEAD_CUT = 16.2;

/** The top-down view of everything below `cut`: +X to the right, the back wall (-Z) on top. */
function planView(cut: number, x: Span, z: Span): View {
  const frame = {
    origin: [x.low, cut, z.low] as const,
    right: [1, 0, 0] as const,
    up: [0, 0, -1] as const,
    forward: [0, -1, 0] as const,
  };
  return orthographicView(frame, x, z, [{ normal: [0, 1, 0], offset: cut }]);
}

/** One plan tile with its grid, spawns and prop numbers. */
function planTile(triangles: WorldTriangles, input: SnapshotInput, cut: number): Raster {
  const { min, max } = input.interior;
  const x = spanOf(min[0], max[0]);
  const z = spanOf(min[2], max[2]);
  const view = planView(cut, x, z);
  const tile = renderTile([triangles], view);
  drawPlanGrid(tile, x, z);
  drawPlanMarks(tile, view, input);
  return tile;
}

/** The plan sheet: the floor plan below 5.9 m, then the overhead plan below 16.2 m. */
export function planSheet(triangles: WorldTriangles, input: SnapshotInput): Raster {
  return composeSheet([
    [planTile(triangles, input, FLOOR_CUT), planTile(triangles, input, OVERHEAD_CUT)],
  ]);
}
