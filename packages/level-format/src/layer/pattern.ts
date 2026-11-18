import { readOptional } from "../shape/index.js";
import type { ShapeNode } from "../shape/index.js";
import type {
  BandsPattern,
  BorderPattern,
  BorderWidths,
  CellsPattern,
  DiscPattern,
  DotsPattern,
  NoisePattern,
  Pattern,
  RectanglePattern,
} from "./layer.js";
import { readLength, readLengthPair, ZERO } from "../length/index.js";

/** The layer kinds the format admits, in the format's order. */
export const KINDS = [
  "bands",
  "rectangle",
  "dots",
  "noise",
  "cells",
  "face",
  "disc",
  "border",
] as const;

/** One layer kind. */
export type Kind = (typeof KINDS)[number];

/** The keys of a kind's record: those it requires and those it may hold. */
interface KindKeys {
  readonly required: readonly string[];
  readonly optional: readonly string[];
}

/** The keys of each kind, beside `kind` and the layer's common keys and effects. */
export const KIND_KEYS: Readonly<Record<Kind, KindKeys>> = {
  bands: { required: ["along", "period", "width"], optional: ["phase", "offset", "fit", "ramp"] },
  rectangle: { required: ["from", "to"], optional: [] },
  dots: { required: ["pitch", "radius"], optional: ["phase", "offset", "fit"] },
  noise: { required: ["wavelength"], optional: ["threshold", "softness"] },
  cells: { required: ["width", "height", "gap"], optional: ["shift", "fit", "share"] },
  face: { required: [], optional: [] },
  disc: { required: ["at", "radius"], optional: ["inner", "diamond"] },
  border: { required: ["width"], optional: ["inset"] },
};

/** A phase, where a centre lies in its period, from 0 to 1. */
function readPhase(node: ShapeNode): number {
  return node.numberIn(0, 1);
}

/**
 * A band's `fit`: true or absent along `across` or `up`, and absent along `diagonal`. The
 * placeholder is `false`.
 */
function readFit(node: ShapeNode, along: BandsPattern["along"]): boolean {
  const fit = node.optionalField("fit");
  if (fit === undefined || (fit.value === true && along !== "diagonal")) {
    return fit !== undefined;
  }
  fit.fail(along === "diagonal" ? "no fit on a band along diagonal" : "true, or no fit at all");
  return false;
}

/** Bands; a band along `across` or `up` may fit, and a diagonal band takes no fit. */
function readBands(node: ShapeNode): BandsPattern {
  const along = node.field("along").oneOf(["across", "up", "diagonal"] as const);
  const period = readLength(node.field("period"), "size");
  const width = readLength(node.field("width"), "size");
  const phase = readOptional(node, "phase", readPhase, 0.5);
  const offset = readOptional(node, "offset", (n) => readLength(n, "position"), ZERO);
  const fit = readFit(node, along);
  const ramp = readOptional(node, "ramp", (n) => readLength(n, "gap"), ZERO);
  const keys = { kind: "bands", period, width, phase, offset, ramp } as const;
  return along === "diagonal" ? { ...keys, along } : { ...keys, along, fit };
}

/** One rectangle between two corners. */
function readRectangle(node: ShapeNode): RectanglePattern {
  return {
    kind: "rectangle",
    from: readLengthPair(node.field("from"), "position"),
    to: readLengthPair(node.field("to"), "position"),
  };
}

/** A lattice's `fit`, naming the fitted coordinate, or nothing when it is unstated. */
function latticeFit(node: ShapeNode): { readonly fit?: "across" | "up" | "both" } {
  const fit = node.optionalField("fit");
  return fit === undefined ? {} : { fit: fit.oneOf(["across", "up", "both"] as const) };
}

/** Dots on a lattice; `fit` names the fitted coordinate. */
function readDots(node: ShapeNode): DotsPattern {
  const [across = 0.5, up = 0.5] = readOptional(
    node,
    "phase",
    (n) => n.tuple(2).map(readPhase),
    [0.5, 0.5],
  );
  return {
    kind: "dots",
    pitch: readLengthPair(node.field("pitch"), "size"),
    radius: readLength(node.field("radius"), "size"),
    phase: [across, up],
    offset: readOptional(node, "offset", (n) => readLengthPair(n, "position"), [ZERO, ZERO]),
    ...latticeFit(node),
  };
}

/** Value noise; `threshold` and `softness` make a mask and come together or not at all. */
function readNoise(node: ShapeNode): NoisePattern {
  const wavelength = readLengthPair(node.field("wavelength"), "size");
  const threshold = node.optionalField("threshold");
  const softness = node.optionalField("softness");
  if (threshold === undefined && softness === undefined) {
    return { kind: "noise", wavelength };
  }
  if (threshold === undefined || softness === undefined) {
    node.fail("threshold and softness together");
    return { kind: "noise", wavelength };
  }
  const mask = { threshold: threshold.numberIn(0, 1), softness: softness.positiveUpTo(1) };
  return { kind: "noise", wavelength, mask };
}

/** Cells with gaps between them; `shift` and `share` lie from 0 to 1 and default to 0. */
function readCells(node: ShapeNode): CellsPattern {
  return {
    kind: "cells",
    width: readLength(node.field("width"), "size"),
    height: readLength(node.field("height"), "size"),
    gap: readLength(node.field("gap"), "gap"),
    shift: readOptional(node, "shift", (n) => n.numberIn(0, 1), 0),
    share: readOptional(node, "share", (n) => n.numberIn(0, 1), 0),
    ...latticeFit(node),
  };
}

/** One disc, ring or diamond; a full round disc when `inner` and `diamond` are unstated. */
function readDisc(node: ShapeNode): DiscPattern {
  return {
    kind: "disc",
    at: readLengthPair(node.field("at"), "position"),
    radius: readLength(node.field("radius"), "size"),
    inner: readOptional(node, "inner", (n) => readLength(n, "gap"), ZERO),
    diamond: readOptional(node, "diamond", (n) => n.boolean(), false),
  };
}

/** A border's widths: one size for all three, or a record of `ends`, `top` and `base`. */
function readBorderWidths(node: ShapeNode): BorderWidths {
  if (typeof node.value !== "object" || node.value === null) {
    const width = readLength(node, "size");
    return { ends: width, top: width, base: width };
  }
  node.record(["ends", "top", "base"]);
  return {
    ends: readLength(node.field("ends"), "size"),
    top: readLength(node.field("top"), "size"),
    base: readLength(node.field("base"), "size"),
  };
}

/** A frame along the face's outline. */
function readBorder(node: ShapeNode): BorderPattern {
  const width = readBorderWidths(node.field("width"));
  return {
    kind: "border",
    width,
    inset: readOptional(node, "inset", (n) => readLength(n, "gap"), ZERO),
  };
}

/** The reader of each kind's keys. */
const READERS: Readonly<Record<Kind, (node: ShapeNode) => Pattern>> = {
  bands: readBands,
  rectangle: readRectangle,
  dots: readDots,
  noise: readNoise,
  cells: readCells,
  face: () => ({ kind: "face" }),
  disc: readDisc,
  border: readBorder,
};

/** The pattern of a layer of `kind`, read from the layer's record. */
export function readPattern(kind: Kind, node: ShapeNode): Pattern {
  return READERS[kind](node);
}
