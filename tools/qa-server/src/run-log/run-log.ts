import { closeSync, mkdirSync, openSync, writeSync } from "node:fs";
import { join } from "node:path";
import { foldLines } from "@level-designer/qa-client/protocol";
import { localTime, runName } from "./local-time.js";

/** Who wrote a line: the server itself, or the page through a log batch. */
export type LineSource = "server" | "page";

/** The level of a run log line. */
export type LogLevel = "info" | "warn" | "error";

/** The reason of a thrown file system error. */
function reasonOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * The run log of one server run: an append-only file written one whole line per event with a
 * synchronous write, so an abrupt end loses no written line and no write can truncate it.
 */
export class RunLog {
  /** The descriptor, or null once the log is closed. */
  private fd: number | null;

  /** The log at `path`, already open on `fd`, of the run `name`, timed by `now`. */
  constructor(
    fd: number,
    readonly path: string,
    readonly name: string,
    private readonly now: () => Date,
  ) {
    this.fd = fd;
  }

  /**
   * Writes one line `<time> <source> <level> <text>`; the protocol's fold turns each run of
   * line terminators inside the text into one space, so no text can forge a line. Returns null, or the reason
   * the line could not be written.
   */
  write(source: LineSource, level: LogLevel, text: string, time: Date = this.now()): string | null {
    if (this.fd === null) return `the run log ${this.path} is closed`;
    const line = `${localTime(time)} ${source} ${level} ${foldLines(text)}\n`;
    try {
      writeSync(this.fd, line);
      return null;
    } catch (error) {
      return `cannot write the run log ${this.path}: ${reasonOf(error)}`;
    }
  }

  /** Closes the file; later writes report a closed log. */
  close(): void {
    if (this.fd === null) return;
    closeSync(this.fd);
    this.fd = null;
  }
}

/** The opened run log, or its path and the reason it cannot be opened. */
export type RunLogOpening =
  | { readonly ok: true; readonly log: RunLog }
  | { readonly ok: false; readonly path: string; readonly reason: string };

/**
 * Opens a new run log `<qaDir>/logs/<run name>.log` for a run that starts now. The file is
 * created new and append-only: a file of that name, from a run that started in the same
 * second, is a failure, so no run appends to another run's log.
 */
export function openRunLog(qaDir: string, now: () => Date): RunLogOpening {
  const name = runName(now());
  const dir = join(qaDir, "logs");
  const path = join(dir, `${name}.log`);
  try {
    mkdirSync(dir, { recursive: true });
    return { ok: true, log: new RunLog(openSync(path, "ax"), path, name, now) };
  } catch (error) {
    return { ok: false, path, reason: reasonOf(error) };
  }
}
