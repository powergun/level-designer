import {
  type LineLevel,
  type LogBatch,
  MAX_BATCH_LINES,
  MAX_LINE_TEXT,
  type PageLine,
  readLogAnswer,
  ROUTES,
} from "../protocol/index.js";
import { postJson, type Transport, unanswered } from "../transport/index.js";

/** What a value says in a log line: an error's stack, a string as it is, else its JSON. */
export function describe(value: unknown): string {
  if (value instanceof Error) return value.stack ?? `${value.name}: ${value.message}`;
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

/**
 * The kind of an alarm: the drawing stopped, the run log failed, the page threw, or a console
 * error came. The banner keeps one alarm of each kind, so one failing part never pushes another
 * out of view.
 */
export type AlarmKind = "drawing" | "run-log" | "page-error" | "console-error";

/** What a page without a run says of its lines: no line reaches the run log. */
export const UNLOGGED = "the page's lines are not in the run log";

/** The console alarm: a pipeline that fails to build reaches the page only as a console error. */
function consoleAlarm(where: string): string {
  return `a console error: programs may have failed and props may be missing; ${where}`;
}

/** Raises an alarm; false when the same text is already in view. */
export type Alarm = (kind: AlarmKind, text: string) => boolean;

/** How often the log posts its batch once it has joined the run, ms. */
const FLUSH_INTERVAL_MS = 5000;

/** A line text within the protocol's bounds. */
function bounded(text: string): string {
  if (text === "") return "(empty)";
  return text.length > MAX_LINE_TEXT ? `${text.slice(0, MAX_LINE_TEXT - 3)}...` : text;
}

/**
 * The page side of the run log: it buffers page lines with the page's clock and posts them in
 * batches under the run the page booted with: every 5 s from the join, and at once for an error
 * line. A batch that is not logged raises the alarm; its lines are not sent again. After an
 * `other-run` refusal the log stops posting, because the server runs another run.
 */
export class PageLog {
  private lines: PageLine[] = [];
  private run: string | null = null;
  /** Where the console alarm sends the reader: the run log, its path from the join on. */
  private consoleWhere = "see the run log";
  /** Whether a console error has raised the console alarm. */
  private consoleRaised = false;
  /** Whether the server refused this page's run, which ends the posting for good. */
  private ended = false;

  /** A log that posts through `transport` and raises `alarm` with the text of a log failure. */
  constructor(
    private readonly transport: Transport,
    private readonly clock: () => number,
    private readonly alarm: Alarm,
  ) {}

  /**
   * Post under `run`, whose lines land in `runLog`, from now on, every 5 s whatever the boot does
   * next; lines written before the join wait for it. A console alarm in view gains the path.
   */
  joinRun(run: string, runLog: string): void {
    this.run = run;
    this.placeConsoleAlarm(`see the run log ${runLog}`);
    const { timers } = this.transport;
    const tick = (): void => {
      this.flush();
      if (!this.ended) timers.setTimeout(tick, FLUSH_INTERVAL_MS);
    };
    timers.setTimeout(tick, FLUSH_INTERVAL_MS);
  }

  /** Write an info line. */
  info(text: string): void {
    this.record("info", text);
  }

  /** Write a warning line. */
  warn(text: string): void {
    this.record("warn", text);
  }

  /** Write an error line and flush the batch, so the error is on file at once. */
  error(text: string): void {
    this.record("error", text);
    this.flush();
  }

  /**
   * Write a console error's line, raise the console alarm once, and flush. A later console error
   * writes its own line only, because the alarm's text is already in view.
   */
  consoleError(text: string): void {
    this.record("error", text);
    this.consoleRaised = true;
    this.alarmed("console-error", consoleAlarm(this.consoleWhere));
    this.flush();
  }

  /** The session step failed before the join: the console alarm says no line reaches the log. */
  noRun(): void {
    this.placeConsoleAlarm(UNLOGGED);
  }

  /**
   * Point the console alarm at `where` from now on; an alarm already in view changes its text in
   * the banner alone, so its line is logged once.
   */
  private placeConsoleAlarm(where: string): void {
    this.consoleWhere = where;
    if (this.consoleRaised) this.alarm("console-error", consoleAlarm(where));
  }

  /** Raise an alarm of `kind`, and write its error line and flush unless it was already in view. */
  alarmed(kind: AlarmKind, text: string): void {
    if (this.alarm(kind, text)) this.error(text);
  }

  /** Raise the alarm when an API answer says the server could not write its run log lines. */
  noteLogFailure(logFailure: string | null): void {
    if (logFailure !== null) this.trouble(`the run log cannot be written: ${logFailure}`);
  }

  /** Post the buffered lines, at most 200 per batch; without a run they wait. */
  flush(): void {
    const run = this.run;
    if (run === null || this.ended) return;
    while (this.lines.length > 0) {
      const batch: LogBatch = { run, lines: this.lines.splice(0, MAX_BATCH_LINES) };
      void this.send(batch);
    }
  }

  /** Buffer one line. */
  private record(level: LineLevel, text: string): void {
    this.lines.push({ time: this.clock(), level, text: bounded(text) });
  }

  /** Post one batch and raise the alarm for every way it is not logged. */
  private async send(batch: LogBatch): Promise<void> {
    const reply = await postJson(this.transport, ROUTES.log, batch);
    const lost = `${batch.lines.length} page lines are not in the run log`;
    if (reply.kind !== "answered")
      return this.trouble(`log batch failed: ${unanswered(reply)}; ${lost}`);
    const answer = readLogAnswer(reply.body);
    if (!answer.ok) return this.trouble(`log batch failed: ${answer.miss.message}; ${lost}`);
    const { value } = answer;
    if (value.kind === "refused" && value.reason === "other-run")
      return this.otherRun(value.message);
    if (value.kind === "refused")
      return this.trouble(`log batch refused: ${value.message}; ${lost}`);
    this.noteLogFailure(value.logFailure);
  }

  /**
   * The server runs another run: raise one alarm and stop posting, since every later batch would
   * be refused the same way.
   */
  private otherRun(message: string): void {
    if (this.ended) return;
    this.ended = true;
    this.lines = [];
    this.placeConsoleAlarm(UNLOGGED);
    const text = `reload the page: the server restarted (${message}); this page's lines no longer reach the run log`;
    this.alarm("run-log", text);
  }

  /**
   * Raise a run log alarm and buffer its line without a flush. A text already in view is neither
   * raised nor buffered again, so a dead log falls quiet instead of posting its own failure.
   */
  private trouble(text: string): void {
    if (this.alarm("run-log", text)) this.record("error", text);
  }
}
