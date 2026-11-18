import type { Length, LengthPair } from "../length/index.js";

/** The faces a layer draws on; `outside` is the default. */
export type Face =
  | "outside"
  | "inside"
  | "sides"
  | "top"
  | "bottom"
  | "end+"
  | "end-"
  | "ends"
  | "edges"
  | "all";

/** How a layer fades as the footprint grows: gone at 30 mm or at 8 mm. */
export type Detail = "medium" | "fine";

/** The keys every band shares, whatever it runs along. */
interface BandsKeys {
  readonly kind: "bands";
  readonly period: Length;
  readonly width: Length;
  readonly phase: number;
  readonly offset: Length;
  readonly ramp: Length;
}

/**
 * Bands of one width repeating at one period along a coordinate. A band along `across` or
 * `up` may fit its period to the face; a band along `diagonal` takes no fit.
 */
export type BandsPattern =
  | (BandsKeys & { readonly along: "across" | "up"; readonly fit: boolean })
  | (BandsKeys & { readonly along: "diagonal" });

/** One axis-aligned rectangle between two corners. */
export interface RectanglePattern {
  readonly kind: "rectangle";
  readonly from: LengthPair;
  readonly to: LengthPair;
}

/** Discs of one radius on a lattice; `fit` names the fitted coordinate, if any. */
export interface DotsPattern {
  readonly kind: "dots";
  readonly pitch: LengthPair;
  readonly radius: Length;
  readonly phase: readonly [number, number];
  readonly offset: LengthPair;
  readonly fit?: "across" | "up" | "both";
}

/**
 * Value noise on the two coordinates. With a mask, the noise turns into coverage around the
 * threshold over the softness; without one, the noise itself is the coverage.
 */
export interface NoisePattern {
  readonly kind: "noise";
  readonly wavelength: LengthPair;
  readonly mask?: { readonly threshold: number; readonly softness: number };
}

/**
 * A grid of cells of one width and height with gaps between them, each row shifted by
 * `shift` of a cell; `share` of the cells, chosen by tone, is covered whole.
 */
export interface CellsPattern {
  readonly kind: "cells";
  readonly width: Length;
  readonly height: Length;
  readonly gap: Length;
  readonly shift: number;
  readonly share: number;
  readonly fit?: "across" | "up" | "both";
}

/** The whole face. */
interface FacePattern {
  readonly kind: "face";
}

/**
 * One disc at a point; an `inner` radius above 0 makes a ring, and `diamond` measures the
 * distance along the two coordinates summed.
 */
export interface DiscPattern {
  readonly kind: "disc";
  readonly at: LengthPair;
  readonly radius: Length;
  readonly inner: Length;
  readonly diamond: boolean;
}

/** A border's width at the face's two ends, at its top and at its base. */
export interface BorderWidths {
  readonly ends: Length;
  readonly top: Length;
  readonly base: Length;
}

/** A frame along the face's outline, `inset` inside it. */
export interface BorderPattern {
  readonly kind: "border";
  readonly width: BorderWidths;
  readonly inset: Length;
}

/** What a layer covers, by its kind. */
export type Pattern =
  | BandsPattern
  | RectanglePattern
  | DotsPattern
  | NoisePattern
  | CellsPattern
  | FacePattern
  | DiscPattern
  | BorderPattern;

/** The factors on a cell's albedo at the low and the high end of its tone. */
export interface Jitter {
  readonly low: number;
  readonly high: number;
}

/** A layer's effects, each mixed in by its coverage; a layer states at least one. */
export interface Effects {
  readonly shade?: number;
  readonly paint?: number;
  readonly color?: string;
  readonly metalness?: number;
  readonly roughness?: number;
  readonly lit?: number;
  readonly jitter?: Jitter;
}

/** Two corners in the layer's coordinates that bound the layer. */
export interface Clip {
  readonly from: LengthPair;
  readonly to: LengthPair;
}

/** One layer: its pattern, where it draws, how its coverage scales, and its effects. */
export interface Layer {
  readonly pattern: Pattern;
  readonly on: Face;
  readonly across?: "ends" | "out";
  readonly up?: "top";
  readonly clip?: Clip;
  readonly detail?: Detail;
  readonly wear: boolean;
  readonly amount: number;
  readonly effects: Effects;
}
