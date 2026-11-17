import type { RunLog } from "./run-log/index.js";
import type { StartFailure, StartLine } from "./start/index.js";
import type { ExitStatus, Surroundings } from "./surroundings.js";

/**
 * The start's record keeper: it writes the start lines to the run log, names the running step,
 * tells the terminal at once that a stop request waits for that step, and ends the start with
 * its one outcome. A start line that cannot be written ends the start on the terminal alone,
 * because the log no longer explains the run.
 */
export class StartRecord {
  /** The step that runs now; the stop notice names it. */
  private step = "run log";

  /** Prints the stop notice when a stop request arrives during the start. */
  private readonly onStop = (): void => {
    const reason = String(this.surroundings.stop.reason);
    this.surroundings.err(
      `qa-server: stop requested (${reason}); waiting for the running step: ${this.step}`,
    );
  };

  /** The record of a start that writes to `log` and prints on the surroundings' streams. */
  constructor(
    private readonly log: RunLog,
    private readonly surroundings: Surroundings,
  ) {
    surroundings.stop.addEventListener("abort", this.onStop, { once: true });
  }

  /** Writes the lines; returns false after the first line that could not be written. */
  write(lines: readonly StartLine[]): boolean {
    for (const line of lines) {
      const failed = this.log.write("server", line.level, line.text);
      if (failed !== null) {
        this.surroundings.err(`qa-server: ${failed}`);
        return false;
      }
    }
    return true;
  }

  /** Starts the step `name`: writes `start: <name>`; returns false when the line failed. */
  begin(name: string): boolean {
    this.step = name;
    return this.write([{ level: "info", text: `start: ${name}` }]);
  }

  /** Ends the start once the port is bound; a later stop request belongs to the server. */
  end(): void {
    this.surroundings.stop.removeEventListener("abort", this.onStop);
  }

  /** Logs the failure with its stack, prints it with the log's path, and returns status 1. */
  fail(failure: StartFailure): ExitStatus {
    this.end();
    const stack =
      failure.stack === undefined ? [] : [{ level: "error" as const, text: failure.stack }];
    const logged = this.write([
      { level: "error", text: `start failed: ${failure.reason}` },
      ...stack,
    ]);
    this.surroundings.err(`qa-server: ${failure.reason}`);
    if (logged) this.surroundings.err(`qa-server: see the run log ${this.log.path}`);
    return 1;
  }

  /**
   * True after a stop request: the last line `stopped during the start: <reason>` goes to the
   * log and to the terminal.
   */
  stopped(): boolean {
    const { stop } = this.surroundings;
    if (!stop.aborted) return false;
    this.end();
    const last = `stopped during the start: ${String(stop.reason)}`;
    this.write([{ level: "info", text: last }]);
    this.surroundings.err(`qa-server: ${last}`);
    return true;
  }
}
