import { lengthValue } from "../length/index.js";
import type { LengthPair } from "../length/index.js";
import type {
  BandsPattern,
  BorderPattern,
  CellsPattern,
  DiscPattern,
  DotsPattern,
  Layer,
  NoisePattern,
  Pattern,
} from "./layer.js";

/** A JSON record as the encoder writes it. */
export type Written = Readonly<Record<string, unknown>>;

/** A pair of lengths as the level `.json` writes it. */
function pairValue(pair: LengthPair): (number | string)[] {
  return pair.map(lengthValue);
}

/** A band's keys in the format's order; its `fit` is written only when true. */
function bandsKeys(pattern: BandsPattern): Written {
  const { kind, along, period, width, phase, offset, ramp } = pattern;
  const written = { kind, along, period: lengthValue(period), width: lengthValue(width) };
  const fitted = pattern.along !== "diagonal" && pattern.fit ? { fit: true } : {};
  return { ...written, phase, offset: lengthValue(offset), ...fitted, ramp: lengthValue(ramp) };
}

/** A dot lattice's keys in the format's order. */
function dotsKeys(pattern: DotsPattern): Written {
  const { kind, pitch, radius, phase, offset, fit } = pattern;
  const written = { kind, pitch: pairValue(pitch), radius: lengthValue(radius) };
  return { ...written, phase, offset: pairValue(offset), ...(fit === undefined ? {} : { fit }) };
}

/** Noise's keys in the format's order; a mask writes its threshold and softness. */
function noiseKeys(pattern: NoisePattern): Written {
  const { kind, wavelength, mask } = pattern;
  const written = { kind, wavelength: pairValue(wavelength) };
  return mask === undefined
    ? written
    : { ...written, threshold: mask.threshold, softness: mask.softness };
}

/** Cells' keys in the format's order; a `fit` is written only when stated. */
function cellsKeys(pattern: CellsPattern): Written {
  const { kind, width, height, gap, shift, fit, share } = pattern;
  const sizes = { width: lengthValue(width), height: lengthValue(height), gap: lengthValue(gap) };
  return { kind, ...sizes, shift, ...(fit === undefined ? {} : { fit }), share };
}

/** A disc's keys in the format's order. */
function discKeys(pattern: DiscPattern): Written {
  const { kind, at, radius, inner, diamond } = pattern;
  return {
    kind,
    at: pairValue(at),
    radius: lengthValue(radius),
    inner: lengthValue(inner),
    diamond,
  };
}

/** A border's keys in the format's order; its width is always the record of three. */
function borderKeys(pattern: BorderPattern): Written {
  const { ends, top, base } = pattern.width;
  const width = { ends: lengthValue(ends), top: lengthValue(top), base: lengthValue(base) };
  return { kind: pattern.kind, width, inset: lengthValue(pattern.inset) };
}

/** A pattern's keys in the format's order. */
function patternKeys(pattern: Pattern): Written {
  switch (pattern.kind) {
    case "bands":
      return bandsKeys(pattern);
    case "dots":
      return dotsKeys(pattern);
    case "noise":
      return noiseKeys(pattern);
    case "cells":
      return cellsKeys(pattern);
    case "disc":
      return discKeys(pattern);
    case "border":
      return borderKeys(pattern);
    case "face":
      return { kind: pattern.kind };
  }
  return { kind: pattern.kind, from: pairValue(pattern.from), to: pairValue(pattern.to) };
}

/** A layer as one flat record: its kind's keys, the common keys, then its effects. */
export function layerRecord(layer: Layer): Written {
  const { pattern, on, across, up, clip, detail, wear, amount, effects } = layer;
  const placement = {
    on,
    ...(across === undefined ? {} : { across }),
    ...(up === undefined ? {} : { up }),
    ...(clip === undefined ? {} : { clip: { from: pairValue(clip.from), to: pairValue(clip.to) } }),
    ...(detail === undefined ? {} : { detail }),
  };
  const { shade, paint, color, metalness, roughness, lit, jitter } = effects;
  const jittered = jitter === undefined ? undefined : { low: jitter.low, high: jitter.high };
  const mixed = { shade, paint, color, metalness, roughness, lit, jitter: jittered };
  const stated = Object.entries(mixed).filter(([, value]) => value !== undefined);
  return { ...patternKeys(pattern), ...placement, wear, amount, ...Object.fromEntries(stated) };
}
