import type { WorldTriangles } from "@level-designer/level-glb";
import type { Raster } from "../raster/index.js";
import type { HalfSpace, View } from "../render/index.js";
import { renderTile } from "../render/index.js";
import type { SnapshotInput } from "./input.js";
import { composeSheet } from "./layout.js";
import { drawHeightLines } from "./marks.js";
import type { Span } from "./orthographic.js";
import { orthographicView, spanOf } from "./orthographic.js";

/** The distance between cross-section stations, metres. */
const STATION_PITCH = 20;
/** The depth a cross section shows behind its station, metres. */
const SECTION_DEPTH = 10;
/** The number of cross sections. */
const STATIONS = 6;
/** The cross sections per sheet row. */
const PER_ROW = 3;

/** The spans of the interior's three axes on a tile. */
interface Spans {
  readonly x: Span;
  readonly y: Span;
  readonly z: Span;
}

/** The elevation from the centre plane `cx` toward the +X (sign 1) or the -X (sign -1) wall. */
function elevationView(spans: Spans, cx: number, sign: 1 | -1): View {
  const frame = {
    origin: [cx, spans.y.high, sign > 0 ? spans.z.low : spans.z.high] as const,
    right: [0, 0, sign] as const,
    up: [0, 1, 0] as const,
    forward: [sign, 0, 0] as const,
  };
  return orthographicView(frame, spans.z, spans.y, [{ normal: [-sign, 0, 0], offset: -sign * cx }]);
}

/**
 * The cross section at `station`, looking toward the back wall at the 10 m behind it. The first
 * station's window reaches back to the tile window's back edge instead, so it shows the back
 * wall.
 */
function crossView(spans: Spans, station: number, first: boolean): View {
  const frame = {
    origin: [spans.x.low, spans.y.high, station] as const,
    right: [1, 0, 0] as const,
    up: [0, 1, 0] as const,
    forward: [0, 0, -1] as const,
  };
  const behind: HalfSpace = first
    ? { normal: [0, 0, -1], offset: -spans.z.low }
    : { normal: [0, 0, -1], offset: SECTION_DEPTH - station };
  return orthographicView(frame, spans.x, spans.y, [
    { normal: [0, 0, 1], offset: station },
    behind,
  ]);
}

/** The stations, from the back: 10 m in front of the back wall, then one every 20 m. */
function stationsOf(input: SnapshotInput): readonly number[] {
  const back = input.interior.min[2];
  return Array.from({ length: STATIONS }, (_, k) => back + SECTION_DEPTH + k * STATION_PITCH);
}

/**
 * The section sheet: the elevation toward the +X wall, the one toward the -X wall, then the six
 * cross sections from the back, three per row. Every tile marks the floors and clearances.
 */
export function sectionSheet(triangles: WorldTriangles, input: SnapshotInput): Raster {
  const { min, max } = input.interior;
  const spans = { x: spanOf(min[0], max[0]), y: spanOf(min[1], max[1]), z: spanOf(min[2], max[2]) };
  const cx = (min[0] + max[0]) / 2;
  const tileOf = (view: View): Raster => {
    const tile = renderTile([triangles], view);
    drawHeightLines(tile, view, input);
    return tile;
  };
  const crosses = stationsOf(input).map((station, k) => tileOf(crossView(spans, station, k === 0)));
  const rows: Raster[][] = [
    [tileOf(elevationView(spans, cx, 1))],
    [tileOf(elevationView(spans, cx, -1))],
  ];
  for (let first = 0; first < crosses.length; first += PER_ROW) {
    rows.push(crosses.slice(first, first + PER_ROW));
  }
  return composeSheet(rows);
}
