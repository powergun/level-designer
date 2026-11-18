import type { ShapeNode } from "../shape/index.js";

/**
 * A length in metres plus at most one share of the face: `metres + factor * width` when
 * `of` is `w`, `metres + factor * height` when `of` is `h`. A plain number has no share;
 * `"1h-0.1"` has `metres` -0.1 and the share `{ of: "h", factor: 1 }`.
 */
export interface Length {
  readonly metres: number;
  readonly share?: { readonly of: "w" | "h"; readonly factor: number };
}

/** A point, or a pair of sizes, written `[across, up]`. */
export type LengthPair = readonly [Length, Length];

/**
 * What a length may be. Every term, metres or a factor of the face, is at most 1,000 in
 * magnitude. A position takes any such terms. A size's terms are each 0 or at least one
 * grid step, and one term is not 0; a gap's terms follow the same floor, and it may be 0.
 */
type LengthUse = "position" | "size" | "gap";

/**
 * The format's length grid, 0.1 mm: the least nonzero term of a size or a gap. A smaller
 * term, a typed exponent or a slipped decimal, would reach a shader as a division by zero.
 */
const GRID_STEP = 0.0001;

/**
 * The largest magnitude of a length's term, the metres or a share's factor, in every use.
 * The hall is 120 m long; a larger term, a slipped exponent, would reach a shader as a
 * 32-bit infinity.
 */
const MAX_TERM = 1000;

/**
 * A share of the face with an optional offset in metres: `0.25w`, `1h-0.1`, `-0.5w+0.2`.
 * A figure may carry an exponent, as `String` prints a tiny number.
 */
const SHARE = /^([+-]?\d+(?:\.\d+)?(?:e[+-]?\d+)?)([wh])(?:([+-]\d+(?:\.\d+)?(?:e[+-]?\d+)?))?$/;

/** The requirement text of each use. */
const REQUIREMENTS: Readonly<Record<LengthUse, string>> = {
  position: 'a length whose terms lie from -1000 to 1000, such as 0.5 or "1h-0.1"',
  size: 'a positive length whose terms are 0 or from 0.0001 to 1000, such as 0.02 or "0.25w+0.1"',
  gap: 'a length whose terms are 0 or from 0.0001 to 1000, such as 0, 0.01 or "0.25w+0.1"',
};

/** The length `0`. */
export const ZERO: Length = { metres: 0 };

/** A number of the text without a negative zero. */
function figure(text: string | undefined): number {
  return Number(text ?? "0") + 0;
}

/** The length a value states, or `undefined` when it is neither a number nor a share. */
function parseLength(value: unknown): Length | undefined {
  if (typeof value === "number") {
    return Number.isFinite(value) ? { metres: value + 0 } : undefined;
  }
  const match = typeof value === "string" ? SHARE.exec(value) : null;
  if (match === null) {
    return undefined;
  }
  const [, factor, axis, metres] = match;
  return {
    metres: figure(metres),
    share: { of: axis === "h" ? "h" : "w", factor: figure(factor) },
  };
}

/** Whether a length suits its use; every use bounds each term's magnitude. */
function suits(length: Length, use: LengthUse): boolean {
  const terms = [length.metres, length.share?.factor ?? 0];
  if (!terms.every((term) => Math.abs(term) <= MAX_TERM)) {
    return false;
  }
  if (use === "position") {
    return true;
  }
  const onGrid = terms.every((term) => term === 0 || term >= GRID_STEP);
  return onGrid && (use === "gap" || terms.some((term) => term > 0));
}

/** A length for its use; the placeholder is `0`. */
export function readLength(node: ShapeNode, use: LengthUse): Length {
  const length = parseLength(node.value);
  if (length !== undefined && suits(length, use)) {
    return length;
  }
  node.fail(REQUIREMENTS[use]);
  return ZERO;
}

/** A pair `[across, up]` of lengths for one use. */
export function readLengthPair(node: ShapeNode, use: LengthUse): LengthPair {
  const [across, up] = node
    .tuple(2, `a pair [across, up] of lengths`)
    .map((item) => readLength(item, use));
  return [across ?? ZERO, up ?? ZERO];
}

/** A length as the level `.json` writes it: plain metres as a number, a share as text. */
export function lengthValue(length: Length): number | string {
  const { metres, share } = length;
  if (share === undefined) {
    return metres;
  }
  const offset = metres === 0 ? "" : `${metres > 0 ? "+" : ""}${metres}`;
  return `${share.factor}${share.of}${offset}`;
}
