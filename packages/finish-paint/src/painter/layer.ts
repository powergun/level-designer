import type { Face, Layer } from "@level-designer/level-format";
import type { Arithmetic } from "../arithmetic/index.js";
import { footprintFade, rectangle } from "../kinds/index.js";
import type { Surface } from "./face.js";
import { type LayerFrame, layerFrame, pairOn } from "./frame.js";
import { patternCoverage } from "./pattern.js";

/** The class range each face name draws on, by the finish format's face classes. */
const FACE_CLASSES: Readonly<Record<Exclude<Face, "all">, readonly [number, number]>> = {
  outside: [0, 0],
  inside: [1, 1],
  sides: [0, 1],
  top: [2, 2],
  bottom: [3, 3],
  "end+": [4, 4],
  "end-": [5, 5],
  ends: [4, 5],
  edges: [2, 5],
};

/** The metres of footprint at which a detail is gone. */
const DETAIL_END = { medium: 0.03, fine: 0.008 } as const;

/**
 * A layer's coverage at a point and, for a `cells` layer with `jitter`, the jitter's
 * weight, the cells' interior, and its factor on the albedo by the cell's tone.
 */
export interface LayerCoverage<S> {
  readonly coverage: S;
  readonly jitter?: { readonly weight: S; readonly factor: S };
}

/** 1 on the faces a layer draws on and 0 elsewhere, comparing the class at half a step. */
function faceGate<S>(a: Arithmetic<S>, on: Face, faceClass: S): S | undefined {
  if (on === "all") {
    return undefined;
  }
  const [low, high] = FACE_CLASSES[on];
  const above = a.step(a.constant(low - 0.5), faceClass);
  return a.sub(above, a.step(a.constant(high + 0.5), faceClass));
}

/** The factors beside the pattern: the clip, the detail's fade, the wear, amount and gate. */
function placementFactors<S>(
  a: Arithmetic<S>,
  layer: Layer,
  frame: LayerFrame<S>,
  s: Surface<S>,
): S[] {
  const factors: S[] = [];
  if (layer.clip !== undefined) {
    const clip = { from: pairOn(a, layer.clip.from, s.face), to: pairOn(a, layer.clip.to, s.face) };
    factors.push(rectangle(a, clip, frame.across.at, frame.up.at, s.footprint));
  }
  if (layer.detail !== undefined) {
    const wavelength = a.constant(2 * DETAIL_END[layer.detail]);
    factors.push(footprintFade(a, wavelength, s.footprint));
  }
  if (layer.wear) {
    factors.push(s.face.wear);
  }
  if (layer.amount !== 1) {
    factors.push(a.constant(layer.amount));
  }
  const gate = faceGate(a, layer.on, s.face.faceClass);
  if (gate !== undefined) {
    factors.push(gate);
  }
  return factors;
}

/**
 * A layer's coverage at a point: its pattern, times its clip, its detail's fade, the wear if
 * it wears, its amount and its face gate. A `jitter` mixes by the same factors on the cells'
 * interior instead of the pattern.
 */
export function layerCoverage<S>(a: Arithmetic<S>, layer: Layer, s: Surface<S>): LayerCoverage<S> {
  const frame = layerFrame(a, layer, s.face);
  const factors = placementFactors(a, layer, frame, s);
  const scaled = (first: S): S =>
    factors.reduce((product, factor) => a.mul(product, factor), first);
  const pattern = patternCoverage(a, layer.pattern, frame, s);
  const coverage = scaled(pattern.coverage);
  const jitter = layer.effects.jitter;
  if (jitter === undefined || pattern.cells === undefined) {
    return { coverage };
  }
  const { low, high } = jitter;
  const factor = a.mix(a.constant(low), a.constant(high), pattern.cells.tone);
  const weight = scaled(a.sub(a.constant(1), pattern.cells.gaps));
  return { coverage, jitter: { weight, factor } };
}
