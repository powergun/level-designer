import type { Arithmetic } from "../arithmetic/index.js";

/** A linear RGB colour as three scalars. */
export type Rgb<S> = readonly [S, S, S];

/** What a painter returns: linear albedo, metalness, roughness and emission from 0 to 1. */
export interface Shade<S> {
  readonly albedo: Rgb<S>;
  readonly metalness: S;
  readonly roughness: S;
  readonly emission: S;
}

/**
 * A point of a face: its pattern coordinates, the face's low corner and size `[width,
 * height]` in metres, its class (0 to 5, compared at half a step), and its seed and wear.
 */
export interface PaintFace<S> {
  readonly x: S;
  readonly y: S;
  readonly low: readonly [S, S];
  readonly size: readonly [S, S];
  readonly faceClass: S;
  readonly seed: S;
  readonly wear: S;
}

/** One vertex's data of a slab or a box, as the GLB carries it. */
export interface SlabVertex<S> {
  readonly x: S;
  readonly y: S;
  readonly width: S;
  readonly height: S;
  readonly faceClass: S;
  readonly seed: S;
  readonly wear: S;
}

/**
 * What the painter reads of a surface: the face, the linear tint, the linear colour that
 * `"glow"` takes (the glow's, or the finish's `light`), and the footprint in metres.
 */
export interface Surface<S> {
  readonly face: PaintFace<S>;
  readonly tint: Rgb<S>;
  readonly light: Rgb<S>;
  readonly footprint: S;
}

/** The painter's face of a slab's or a box's vertex: its low corner lies at `(-width / 2, 0)`. */
export function slabFace<S>(a: Arithmetic<S>, vertex: SlabVertex<S>): PaintFace<S> {
  return {
    x: vertex.x,
    y: vertex.y,
    low: [a.mul(vertex.width, a.constant(-0.5)), a.constant(0)],
    size: [vertex.width, vertex.height],
    faceClass: vertex.faceClass,
    seed: vertex.seed,
    wear: vertex.wear,
  };
}
