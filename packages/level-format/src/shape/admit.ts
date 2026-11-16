import { ShapeNode } from "./node.js";
import type { Admission, FormatProblem } from "./problem.js";
import { quote } from "./render.js";

/** Reads a parsed document into its typed value, reporting into the shared problem list. */
export type DocumentReader<T> = (root: ShapeNode, problems: FormatProblem[]) => T;

/**
 * Admits one JSON text: it parses the text, lets `read` check and type it, and returns the
 * value only when no problem was recorded.
 */
export function admitText<T>(text: string, read: DocumentReader<T>): Admission<T> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    const message = `$: expected JSON text, got a syntax error: ${quote(reason)}`;
    return { ok: false, problems: [{ rule: "shape", path: "$", message }] };
  }
  const problems: FormatProblem[] = [];
  const value = read(new ShapeNode(parsed, "", problems, true), problems);
  return problems.length === 0 ? { ok: true, value } : { ok: false, problems };
}
