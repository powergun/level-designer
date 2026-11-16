import type { WorldTriangles } from "@level-designer/level-glb";
import type { Rgb8 } from "../raster/index.js";
import { createRaster, drawLine } from "../raster/index.js";
import { clipPolygon, insideAll } from "./clip.js";
import { drawOutlines } from "./outline.js";
import type { Tile } from "./rasterize.js";
import { fillTriangle } from "./rasterize.js";
import { lightOf, shade } from "./shade.js";
import type { Vec3 } from "./vector.js";
import { cross, dot, normalize, pointAt, sub } from "./vector.js";
import type { View } from "./view.js";
import { pixelOf, project, towardViewer } from "./view.js";

/** The loud background: magenta, which no surface of the hall shows. */
const BACKGROUND: Rgb8 = [255, 0, 255];
/** The colour of the cut plane's trace. */
const CUT: Rgb8 = [0, 0, 0];

/** What one tile's pass carries from triangle to triangle. */
interface Pass {
  readonly tile: Tile;
  readonly view: View;
  readonly light: Vec3;
  /** The cut plane's crossings, two points (six numbers) per crossing triangle. */
  readonly trace: number[];
  readonly screen: Float64Array;
  readonly color: Uint8Array;
}

/** An empty tile: the background colour at infinite depth. */
function emptyTile(view: View): Tile {
  const { width, height, rgb } = createRaster(view.width, view.height, BACKGROUND);
  return { width, height, rgb, key: new Float64Array(width * height).fill(Infinity) };
}

/** The triangle's corners clipped to the view's half-spaces; empty when nothing is kept. */
function keptPolygon(pass: Pass, corners: number[]): number[] {
  let polygon = corners;
  pass.view.keep.forEach((plane, index) => {
    if (polygon.length === 0 || insideAll(polygon, plane)) return;
    const traced = pass.view.cut && index === 0 ? pass.trace : undefined;
    polygon = clipPolygon(polygon, plane, traced);
  });
  return polygon;
}

/** The unit normal of a triangle turned toward the viewer; zero for a degenerate triangle. */
function facingNormal(pass: Pass, corners: readonly number[]): Vec3 {
  const a = pointAt(corners, 0);
  const normal = normalize(cross(sub(pointAt(corners, 3), a), sub(pointAt(corners, 6), a)));
  return dot(normal, towardViewer(pass.view, a)) < 0 ? sub([0, 0, 0], normal) : normal;
}

/** Project the kept polygon and fill it as a fan of triangles. */
function fillPolygon(pass: Pass, polygon: readonly number[]): void {
  const { screen, view } = pass;
  const corners = polygon.length / 3;
  const point = new Float64Array(3);
  const projected = new Float64Array(corners * 3);
  for (let corner = 0; corner < corners; corner++) {
    project(view, pointAt(polygon, corner * 3), point);
    projected.set(point, corner * 3);
  }
  screen.set(projected.subarray(0, 3), 0);
  for (let corner = 1; corner + 1 < corners; corner++) {
    screen.set(projected.subarray(corner * 3, corner * 3 + 6), 3);
    fillTriangle(pass.tile, screen, pass.color);
  }
}

/** Draw triangle `index` of a set: clip it, shade it with the light, fill it. */
function drawTriangle(pass: Pass, set: WorldTriangles, index: number): void {
  const corners = Array.from(set.positions.subarray(index * 9, index * 9 + 9));
  const polygon = keptPolygon(pass, corners);
  if (polygon.length < 9) return;
  const normal = facingNormal(pass, corners);
  shade(pointAt(set.colors, index * 3), normal, pass.light, pass.color);
  fillPolygon(pass, polygon);
}

/** Draw the cut plane's trace: one line per crossing triangle, over every surface. */
function drawTrace(pass: Pass): void {
  const { trace, view, tile } = pass;
  for (let at = 0; at + 6 <= trace.length; at += 6) {
    const from = pixelOf(view, pointAt(trace, at));
    drawLine(tile, from, pixelOf(view, pointAt(trace, at + 3)), CUT);
  }
}

/**
 * Render the triangle sets into one tile: every kept triangle flat-shaded by the one light,
 * the nearest surface per pixel, a dark outline where depth jumps, and the cut plane's trace.
 */
export function renderTile(sets: readonly WorldTriangles[], view: View): Tile {
  const pass: Pass = {
    tile: emptyTile(view),
    view,
    light: lightOf(view.frame),
    trace: [],
    screen: new Float64Array(9),
    color: new Uint8Array(3),
  };
  for (const set of sets) {
    for (let index = 0; index < set.colors.length / 3; index++) drawTriangle(pass, set, index);
  }
  drawOutlines(pass.tile, view.projection);
  drawTrace(pass);
  return pass.tile;
}
