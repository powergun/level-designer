import type { Layer, Length, LengthPair } from "@level-designer/level-format";
import type { Arithmetic } from "../arithmetic/index.js";
import type { PaintFace } from "./face.js";

/** One layer coordinate at a point, and the range it spans on the face: its low end and extent. */
export interface Axis<S> {
  readonly at: S;
  readonly low: S;
  readonly extent: S;
}

/** A layer's two coordinates at a point of a face, by its `across` and `up`. */
export interface LayerFrame<S> {
  readonly across: Axis<S>;
  readonly up: Axis<S>;
}

/** The finish format's length on a face: its metres plus its share of the width or height. */
export function lengthOn<S>(a: Arithmetic<S>, length: Length, face: PaintFace<S>): S {
  const metres = a.constant(length.metres);
  if (length.share === undefined) {
    return metres;
  }
  const extent = length.share.of === "w" ? face.size[0] : face.size[1];
  return a.add(metres, a.mul(a.constant(length.share.factor), extent));
}

/** A pair of lengths on a face. */
export function pairOn<S>(a: Arithmetic<S>, pair: LengthPair, face: PaintFace<S>): [S, S] {
  return [lengthOn(a, pair[0], face), lengthOn(a, pair[1], face)];
}

/**
 * The first coordinate: the face's `x`; with `ends` the distance in from the nearer end, and
 * with `out` the distance from the centre line, both spanning half the face from 0.
 */
function acrossAxis<S>(a: Arithmetic<S>, layer: Layer, face: PaintFace<S>): Axis<S> {
  const [low] = face.low;
  const [width] = face.size;
  if (layer.across === undefined) {
    return { at: face.x, low, extent: width };
  }
  const half = a.mul(width, a.constant(0.5));
  const zero = a.constant(0);
  if (layer.across === "ends") {
    const fromLow = a.sub(face.x, low);
    const fromHigh = a.sub(a.add(low, width), face.x);
    return { at: a.min(fromLow, fromHigh), low: zero, extent: half };
  }
  return { at: a.abs(a.sub(face.x, a.add(low, half))), low: zero, extent: half };
}

/** The second coordinate: the face's `y`, or with `top` the distance down from the top. */
function upAxis<S>(a: Arithmetic<S>, layer: Layer, face: PaintFace<S>): Axis<S> {
  const [, low] = face.low;
  const [, height] = face.size;
  if (layer.up === undefined) {
    return { at: face.y, low, extent: height };
  }
  const fromTop = a.sub(a.add(low, height), face.y);
  return { at: fromTop, low: a.constant(0), extent: height };
}

/** A layer's coordinates at a point of a face. */
export function layerFrame<S>(a: Arithmetic<S>, layer: Layer, face: PaintFace<S>): LayerFrame<S> {
  return { across: acrossAxis(a, layer, face), up: upAxis(a, layer, face) };
}

/**
 * A fitted axis: the period becomes the extent over the rounded count of periods, at least
 * one, and the coordinate starts at the axis's low end.
 */
export function fitAxis<S>(a: Arithmetic<S>, axis: Axis<S>, period: S): readonly [S, S] {
  const one = a.constant(1);
  const rounded = a.floor(a.add(a.div(axis.extent, period), a.constant(0.5)));
  return [a.sub(axis.at, axis.low), a.div(axis.extent, a.max(rounded, one))];
}
