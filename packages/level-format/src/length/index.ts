/**
 * length: a length on a face, metres plus at most one share of the face's width or height.
 * It owns the length type, its one reading from the format's text with the bounds and the
 * floor of its terms, and its canonical text.
 */
export type { Length, LengthPair } from "./length.js";
export { lengthValue, readLength, readLengthPair, ZERO } from "./length.js";
