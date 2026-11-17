import type { LogLevel } from "../run-log/index.js";

/** One server line a start step hands to the run log. */
export interface StartLine {
  readonly level: LogLevel;
  readonly text: string;
}

/** Why a start step failed: the reason for the terminal and the log, and the error's stack. */
export interface StartFailure {
  readonly reason: string;
  readonly stack: string | undefined;
}

/** The outcome of a start step: its lines, and its value or its failure. */
export type StepOutcome<T> =
  | { readonly ok: true; readonly lines: readonly StartLine[]; readonly value: T }
  | { readonly ok: false; readonly lines: readonly StartLine[]; readonly failure: StartFailure };

/** The message of a thrown value. */
export function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** A failure with `reason` and the stack of the error behind it, if any. */
export function failure(reason: string, error?: unknown): StartFailure {
  return { reason, stack: error instanceof Error ? error.stack : undefined };
}
