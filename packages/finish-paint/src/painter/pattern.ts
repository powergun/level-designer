import type {
  BandsPattern,
  BorderPattern,
  CellsPattern,
  DiscPattern,
  DotsPattern,
  Length,
  NoisePattern,
  Pattern,
} from "@level-designer/level-format";
import type { Arithmetic } from "../arithmetic/index.js";
import { bands, border, cells, disc, dots, noise, rectangle } from "../kinds/index.js";
import type { Surface } from "./face.js";
import { type Axis, fitAxis, type LayerFrame, lengthOn, pairOn } from "./frame.js";

/** A pattern's coverage at a point; a `cells` pattern also gives its gaps and its tone. */
export interface PatternCoverage<S> {
  readonly coverage: S;
  readonly cells?: { readonly gaps: S; readonly tone: S };
}

/** The coverage of bands along their coordinate, fitted to the face when they fit. */
function bandsCoverage<S>(
  a: Arithmetic<S>,
  p: BandsPattern,
  frame: LayerFrame<S>,
  s: Surface<S>,
): S {
  const face = s.face;
  const period = lengthOn(a, p.period, face);
  const shape = {
    width: lengthOn(a, p.width, face),
    phase: a.constant(p.phase),
    offset: lengthOn(a, p.offset, face),
    ramp: lengthOn(a, p.ramp, face),
  };
  if (p.along === "diagonal") {
    const t = a.mul(a.add(frame.across.at, frame.up.at), a.constant(Math.SQRT1_2));
    return bands(a, { ...shape, period }, t, s.footprint);
  }
  const axis = p.along === "across" ? frame.across : frame.up;
  if (!p.fit) {
    return bands(a, { ...shape, period }, axis.at, s.footprint);
  }
  const [t, fitted] = fitAxis(a, axis, period);
  return bands(a, { ...shape, period: fitted }, t, s.footprint);
}

/** Both coordinates and periods of a lattice, each coordinate that `fit` names fitted. */
function fitLattice<S>(
  a: Arithmetic<S>,
  fit: "across" | "up" | "both" | undefined,
  frame: LayerFrame<S>,
  period: readonly [S, S],
): { readonly at: [S, S]; readonly period: [S, S] } {
  const along = (fitted: boolean, axis: Axis<S>, p: S): readonly [S, S] =>
    fitted ? fitAxis(a, axis, p) : [axis.at, p];
  const [x, px] = along(fit === "across" || fit === "both", frame.across, period[0]);
  const [y, py] = along(fit === "up" || fit === "both", frame.up, period[1]);
  return { at: [x, y], period: [px, py] };
}

/** The coverage of dots, each coordinate that `fit` names fitted to the face. */
function dotsCoverage<S>(a: Arithmetic<S>, p: DotsPattern, frame: LayerFrame<S>, s: Surface<S>): S {
  const lattice = fitLattice(a, p.fit, frame, pairOn(a, p.pitch, s.face));
  const params = {
    pitch: lattice.period,
    radius: lengthOn(a, p.radius, s.face),
    phase: [a.constant(p.phase[0]), a.constant(p.phase[1])],
    offset: pairOn(a, p.offset, s.face),
  } as const;
  return dots(a, params, lattice.at[0], lattice.at[1], s.footprint);
}

/** The coverage of noise, seeded by the face. */
function noiseCoverage<S>(
  a: Arithmetic<S>,
  p: NoisePattern,
  frame: LayerFrame<S>,
  s: Surface<S>,
): S {
  const wavelength = pairOn(a, p.wavelength, s.face);
  const mask =
    p.mask === undefined
      ? undefined
      : { threshold: a.constant(p.mask.threshold), softness: a.constant(p.mask.softness) };
  const params = mask === undefined ? { wavelength } : { wavelength, mask };
  return noise(a, params, frame.across.at, frame.up.at, s.face.seed, s.footprint);
}

/** The coverage of cells, seeded by the face, whose pitch is a cell plus its gap. */
function cellsCoverage<S>(
  a: Arithmetic<S>,
  p: CellsPattern,
  frame: LayerFrame<S>,
  s: Surface<S>,
): PatternCoverage<S> {
  const gap = lengthOn(a, p.gap, s.face);
  const pitch = [
    a.add(lengthOn(a, p.width, s.face), gap),
    a.add(lengthOn(a, p.height, s.face), gap),
  ] as const;
  const lattice = fitLattice(a, p.fit, frame, pitch);
  const params = {
    pitch: lattice.period,
    gap,
    shift: a.constant(p.shift),
    share: a.constant(p.share),
  };
  const [x, y] = lattice.at;
  const { coverage, gaps, tone } = cells(a, params, x, y, s.face.seed, s.footprint);
  return { coverage, cells: { gaps, tone } };
}

/** True for a length of exactly 0 m and no share: a disc without a hole. */
function isZero(length: Length): boolean {
  return length.metres === 0 && length.share === undefined;
}

/** The coverage of one disc, ring or diamond. */
function discCoverage<S>(a: Arithmetic<S>, p: DiscPattern, frame: LayerFrame<S>, s: Surface<S>): S {
  const shape = { at: pairOn(a, p.at, s.face), radius: lengthOn(a, p.radius, s.face) };
  const ring = isZero(p.inner) ? {} : { inner: lengthOn(a, p.inner, s.face) };
  const params = { ...shape, ...ring, diamond: p.diamond };
  return disc(a, params, frame.across.at, frame.up.at, s.footprint);
}

/** The coverage of a frame along the outline of the layer's coordinates on the face. */
function borderCoverage<S>(
  a: Arithmetic<S>,
  p: BorderPattern,
  frame: LayerFrame<S>,
  s: Surface<S>,
): S {
  const { across, up } = frame;
  const params = {
    low: [across.low, up.low],
    high: [a.add(across.low, across.extent), a.add(up.low, up.extent)],
    ends: lengthOn(a, p.width.ends, s.face),
    top: lengthOn(a, p.width.top, s.face),
    base: lengthOn(a, p.width.base, s.face),
    inset: lengthOn(a, p.inset, s.face),
  } as const;
  return border(a, params, across.at, up.at, s.footprint);
}

/** The coverage of a layer's pattern alone, at its coordinates, by its kind. */
export function patternCoverage<S>(
  a: Arithmetic<S>,
  p: Pattern,
  frame: LayerFrame<S>,
  s: Surface<S>,
): PatternCoverage<S> {
  switch (p.kind) {
    case "bands":
      return { coverage: bandsCoverage(a, p, frame, s) };
    case "dots":
      return { coverage: dotsCoverage(a, p, frame, s) };
    case "noise":
      return { coverage: noiseCoverage(a, p, frame, s) };
    case "cells":
      return cellsCoverage(a, p, frame, s);
    case "disc":
      return { coverage: discCoverage(a, p, frame, s) };
    case "border":
      return { coverage: borderCoverage(a, p, frame, s) };
    case "face":
      return { coverage: a.constant(1) };
    case "rectangle":
      break;
  }
  // Only the rectangle is left: a kind the switch misses fails the type check here.
  const corners = { from: pairOn(a, p.from, s.face), to: pairOn(a, p.to, s.face) };
  return { coverage: rectangle(a, corners, frame.across.at, frame.up.at, s.footprint) };
}
