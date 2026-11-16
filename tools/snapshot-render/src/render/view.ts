import type { Pixel } from "../raster/index.js";
import type { Vec3 } from "./vector.js";
import { cross, dot, normalize, sub } from "./vector.js";

/** A kept half-space: the points p with dot(normal, p) <= offset. */
export interface HalfSpace {
  readonly normal: Vec3;
  readonly offset: number;
}

/** A camera frame: its origin, screen right, screen up and the view direction, all unit. */
export interface Frame {
  readonly origin: Vec3;
  readonly right: Vec3;
  readonly up: Vec3;
  readonly forward: Vec3;
}

/** How a frame maps to pixels: a fixed scale, or a pinhole with its focal length in pixels. */
export type Projection =
  | { readonly kind: "orthographic"; readonly pixelsPerMetre: number }
  | { readonly kind: "perspective"; readonly focal: number };

/**
 * One tile's camera: its pixel size, frame, projection and kept half-spaces. With `cut` set,
 * the first kept half-space is the cut plane, and the tile draws where geometry crosses it.
 */
export interface View {
  readonly width: number;
  readonly height: number;
  readonly frame: Frame;
  readonly projection: Projection;
  readonly keep: readonly HalfSpace[];
  readonly cut: boolean;
}

/** The camera lens: the vertical field of view in degrees and the clip planes in metres. */
export interface Lens {
  readonly fovDeg: number;
  readonly near: number;
  readonly far: number;
}

/** The pixel size of a tile. */
export interface TileSize {
  readonly width: number;
  readonly height: number;
}

/** World up. */
const UP: Vec3 = [0, 1, 0];
/** The screen up of a view that looks straight up or down: the back wall. */
const BACK: Vec3 = [0, 0, -1];

/** The frame at `eye` looking at `target`, with world up on screen unless the view is vertical. */
function lookAtFrame(eye: Vec3, target: Vec3): Frame {
  const forward = normalize(sub(target, eye));
  if (forward[0] === 0 && forward[1] === 0 && forward[2] === 0) {
    throw new Error("a perspective view needs a look-at point apart from its eye");
  }
  const vertical = Math.abs(forward[1]) > 1 - 1e-9;
  const right = normalize(cross(forward, vertical ? BACK : UP));
  return { origin: eye, right, up: cross(right, forward), forward };
}

/** The pinhole view of a lens from `eye` toward `target`, kept between the near and far planes. */
export function perspectiveView(eye: Vec3, target: Vec3, lens: Lens, size: TileSize): View {
  const frame = lookAtFrame(eye, target);
  const along = dot(frame.forward, eye);
  const backward = sub([0, 0, 0], frame.forward);
  const focal = size.height / 2 / Math.tan((lens.fovDeg * Math.PI) / 360);
  return {
    ...size,
    frame,
    projection: { kind: "perspective", focal },
    keep: [
      { normal: backward, offset: -(along + lens.near) },
      { normal: frame.forward, offset: along + lens.far },
    ],
    cut: false,
  };
}

/**
 * Project a world point into the tile: screen x to the right and y down in pixels, and a depth
 * key that is linear across the screen and smaller toward the viewer.
 */
export function project(view: View, point: Vec3, out: Float64Array): void {
  const { origin, right, up, forward } = view.frame;
  const qx = point[0] - origin[0];
  const qy = point[1] - origin[1];
  const qz = point[2] - origin[2];
  const across = qx * right[0] + qy * right[1] + qz * right[2];
  const above = qx * up[0] + qy * up[1] + qz * up[2];
  const ahead = qx * forward[0] + qy * forward[1] + qz * forward[2];
  if (view.projection.kind === "orthographic") {
    const scale = view.projection.pixelsPerMetre;
    out[0] = across * scale;
    out[1] = -above * scale;
    out[2] = ahead;
    return;
  }
  const scale = view.projection.focal / ahead;
  out[0] = view.width / 2 + across * scale;
  out[1] = view.height / 2 - above * scale;
  out[2] = -1 / ahead;
}

/** The pixel of a tile that holds a world point. */
export function pixelOf(view: View, point: Vec3): Pixel {
  const out = new Float64Array(3);
  project(view, point, out);
  return [Math.floor(out[0] ?? 0), Math.floor(out[1] ?? 0)];
}

/**
 * How far a depth key may stray from the value its neighbours predict before the two pixels
 * count as different surfaces: 0.25 m on an orthographic tile, 2 % of the depth through a lens.
 */
export function depthTolerance(projection: Projection, a: number, b: number): number {
  if (projection.kind === "orthographic") return 0.25;
  return 0.02 * Math.max(Math.abs(a), Math.abs(b));
}

/** The unit direction from a world point toward the viewer. */
export function towardViewer(view: View, point: Vec3): Vec3 {
  const { frame } = view;
  if (view.projection.kind === "orthographic") return sub([0, 0, 0], frame.forward);
  return normalize(sub(frame.origin, point));
}
