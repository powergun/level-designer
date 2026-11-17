import { appendFileSync } from "node:fs";
import type { MarkRequest } from "@level-designer/qa-client/protocol";

/** The level a mark belongs to: its name and its description hash, against stale marks. */
export interface MarkedLevel {
  readonly name: string;
  readonly hash: string;
}

/** The outcome of one append: the mark's number within the run, or why it failed. */
export type MarkAppend =
  | { readonly ok: true; readonly mark: number }
  | { readonly ok: false; readonly reason: string };

/**
 * The marks file shared by every run, with the number of this run's next mark. One mark is one
 * JSON line appended in one synchronous call; only a written line takes a number.
 */
export class MarkFile {
  /** The number the next saved mark of this run takes. */
  private next = 1;

  /** The marks file at `path` for the run `run`. */
  constructor(
    readonly path: string,
    private readonly run: string,
  ) {}

  /** Appends one line with the time, the run, the number, the level and the request's fields. */
  append(request: MarkRequest, level: MarkedLevel, time: string): MarkAppend {
    const { mode, eye, feet, yaw, pitch, comment } = request;
    const mark = this.next;
    const line = JSON.stringify({
      time,
      run: this.run,
      mark,
      level: level.name,
      description: level.hash,
      mode,
      eye,
      feet,
      yaw,
      pitch,
      comment,
    });
    try {
      appendFileSync(this.path, `${line}\n`);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      return { ok: false, reason: `cannot append to ${this.path}: ${reason}` };
    }
    this.next = mark + 1;
    return { ok: true, mark };
  }
}
