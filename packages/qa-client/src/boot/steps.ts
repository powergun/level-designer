import type { Display } from "../display/index.js";
import { describe, type PageLog } from "../log/index.js";
import { messageOf } from "../transport/index.js";

/** The outcome of one boot step: its value, or the message the page shows. */
export type StepOutcome<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly message: string };

/** What every boot step reports through. */
export interface StepReport {
  readonly display: Display;
  readonly log: PageLog;
}

/** A step's value. */
export function done<T>(value: T): StepOutcome<T> {
  return { ok: true, value };
}

/** A step's failure with the message the page shows. */
export function failed<T>(message: string): StepOutcome<T> {
  return { ok: false, message };
}

/**
 * Run one boot step: log its start, name it in the status strip, flush the batch so a stalled
 * step is on file, then log its outcome. A failure shows its message as an error line; a throw
 * is a failure too, with its stack in the log. Resolves to the value, or null when it failed.
 */
export async function runStep<T>(
  report: StepReport,
  name: string,
  work: () => Promise<StepOutcome<T>>,
): Promise<T | null> {
  const { display, log } = report;
  log.info(`boot step ${name}: start`);
  display.status(`boot: ${name}`);
  log.flush();
  let outcome: StepOutcome<T>;
  try {
    outcome = await work();
  } catch (thrown) {
    log.warn(`boot step ${name}: ${describe(thrown)}`);
    outcome = failed(`${name} failed: ${messageOf(thrown)}`);
  }
  if (!outcome.ok) {
    display.status(outcome.message, "error");
    return null;
  }
  log.info(`boot step ${name}: done`);
  return outcome.value;
}
