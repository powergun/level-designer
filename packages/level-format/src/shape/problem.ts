/** The build error rules this component owns. */
type FormatRule = "shape" | "id" | "slab" | "finish";

/**
 * One reason a text or a level is refused: its rule, the path of the offending value and the
 * message an author reads. Every message starts with the path, except the slab count cap's.
 */
export interface FormatProblem {
  readonly rule: FormatRule;
  readonly path: string;
  readonly message: string;
}

/**
 * An admission's outcome: the typed value, or every problem found, in reading order: a
 * record's unknown and missing keys first, then its fields in the format's key order.
 */
export type Admission<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly problems: readonly FormatProblem[] };
