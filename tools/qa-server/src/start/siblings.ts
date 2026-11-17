import { statSync } from "node:fs";
import { join } from "node:path";
import type { StartLine, StepOutcome } from "./step.js";

/** What a sibling directory holds: its own install, no install, or no directory at all. */
type SiblingState = "install found" | "no install" | "no directory";

/** Whether `path` is a directory. */
function isDirectory(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

/** The state of the sibling at `dir`: an install is a `node_modules` directory inside it. */
function stateOf(dir: string): SiblingState {
  if (!isDirectory(dir)) return "no directory";
  return isDirectory(join(dir, "node_modules")) ? "install found" : "no install";
}

/** The fix of a sibling that is not ready: check it out, or run its own setup. */
function fixOf(dir: string, state: Exclude<SiblingState, "install found">): string {
  if (state === "no directory") {
    return `${dir} is no directory: check the sibling out beside this repository`;
  }
  return `${dir} has no install: run its own just setup in ${dir}`;
}

/**
 * Records each sibling's absolute path with its state and fails when any sibling is not ready,
 * naming every such sibling with its fix: a missing directory needs a checkout, a directory
 * without an install needs the sibling's own setup.
 */
export function checkSiblings(siblings: readonly string[]): StepOutcome<null> {
  const lines: StartLine[] = [];
  const fixes: string[] = [];
  for (const dir of siblings) {
    const state = stateOf(dir);
    lines.push({
      level: state === "install found" ? "info" : "error",
      text: `sibling ${dir}: ${state}`,
    });
    if (state !== "install found") fixes.push(fixOf(dir, state));
  }
  if (fixes.length === 0) return { ok: true, lines, value: null };
  return { ok: false, lines, failure: { reason: fixes.join("; "), stack: undefined } };
}
