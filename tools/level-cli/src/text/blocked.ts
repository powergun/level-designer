import { counted } from "./count.js";
import type { BuildError } from "@level-designer/level-pipeline";

/** The lines of a blocked build: one tab-separated line per error, then `blocked: <n> errors`, singular for one. */
export function blockedLines(errors: readonly BuildError[]): readonly string[] {
  const lines = errors.map((error) => [error.rule, error.path, error.message].join("\t"));
  return [...lines, `blocked: ${counted(errors.length, "error")}`];
}
