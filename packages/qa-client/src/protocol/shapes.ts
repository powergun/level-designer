/** A point in scaled metres, `[x, y, z]`. */
export type Point = readonly [number, number, number];

/** The validator's verdict on a built level. */
export type Verdict =
  | { readonly kind: "accepted" }
  | { readonly kind: "rejected"; readonly findings: number };

/** One reason a build is blocked, as the pipeline reports it. */
export interface BuildErrorFact {
  readonly rule: string;
  readonly path: string;
  readonly message: string;
}

/**
 * The build outcome: a built level with its name, description hash and verdict, or a blocked
 * build with its errors alone. Name and hash are facts of a built level only.
 */
export type BuildFacts =
  | {
      readonly kind: "built";
      readonly name: string;
      readonly description: string;
      readonly verdict: Verdict;
    }
  | { readonly kind: "blocked"; readonly errors: readonly BuildErrorFact[] };

/** The session facts: the run, the paths of its run log and marks file, and the build. */
export interface SessionFacts {
  readonly run: string;
  readonly runLog: string;
  readonly marksFile: string;
  readonly build: BuildFacts;
}

/** The level of a page line. */
export type LineLevel = "info" | "warn" | "error";

/** One page line: the page's clock in ms since the Unix epoch, the level and the text. */
export interface PageLine {
  readonly time: number;
  readonly level: LineLevel;
  readonly text: string;
}

/** The body of a log post: the run the page booted with and its lines. */
export interface LogBatch {
  readonly run: string;
  readonly lines: readonly PageLine[];
}

/** Walk or fly. */
export type MoveMode = "walk" | "fly";

/**
 * The body of a mark post: the run, the pose and the comment. `feet` is null exactly in fly;
 * yaw and pitch are degrees, yaw 0 along +Z growing toward +X.
 */
export interface MarkRequest {
  readonly run: string;
  readonly mode: MoveMode;
  readonly eye: Point;
  readonly feet: Point | null;
  readonly yaw: number;
  readonly pitch: number;
  readonly comment: string;
}

/** Why the server refused a request. */
export type RefusalReason =
  | "foreign-host"
  | "other-run"
  | "malformed"
  | "malformed-pose"
  | "comment-too-long"
  | "no-level"
  | "not-found";

/** A refused request: the reason the page branches on and the message it shows. */
export interface Refusal {
  readonly kind: "refused";
  readonly reason: RefusalReason;
  readonly message: string;
}

/** A saved mark: its number within the run and the marks file's path. */
export interface MarkSaved {
  readonly kind: "saved";
  readonly mark: number;
  readonly file: string;
}

/** A mark the server could not append. */
export interface MarkFailed {
  readonly kind: "failed";
  readonly message: string;
}

/** A log batch the server took. */
export interface Logged {
  readonly kind: "logged";
}

/**
 * Every API answer carries `logFailure`: null when the server wrote this request's run log
 * lines, else the reason it could not.
 */
type Answered<T> = T & { readonly logFailure: string | null };

/** The answer of the session route. */
export type SessionAnswer = Answered<SessionFacts>;

/** The answer of the log route. */
export type LogAnswer = Answered<Logged | Refusal>;

/** The answer of the mark route. */
export type MarkAnswer = Answered<MarkSaved | MarkFailed | Refusal>;
