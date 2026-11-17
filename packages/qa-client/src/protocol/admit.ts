import {
  type JsonObject,
  listAt,
  numberAt,
  objectAt,
  oneOfAt,
  pointAt,
  readShape,
  recordAt,
  stringAt,
} from "./json.js";
import { foldLines, MAX_BATCH_LINES, MAX_COMMENT, MAX_LINE_TEXT } from "./routes.js";
import { ShapeMiss } from "./shape-miss.js";
import type {
  LineLevel,
  LogBatch,
  MarkRequest,
  MoveMode,
  PageLine,
  Point,
  Refusal,
  RefusalReason,
} from "./shapes.js";

/** The HTTP status of each refusal reason. */
export const REFUSAL_STATUS: Readonly<Record<RefusalReason, number>> = {
  "foreign-host": 403,
  "other-run": 409,
  malformed: 400,
  "malformed-pose": 400,
  "comment-too-long": 400,
  "no-level": 404,
  "not-found": 404,
};

/** The admission of one request body: the typed body, or the refusal to answer with. */
export type BodyAdmission<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly refusal: Refusal };

/** A refusal with its reason and message. */
export function refusal(reason: RefusalReason, message: string): Refusal {
  return { kind: "refused", reason, message };
}

/** The furthest instant a date holds from the Unix epoch, ms, either way (ECMA-262 time values). */
const LAST_INSTANT_MS = 8.64e15;

/** The keys of a mark body and of a log batch. */
const MARK_KEYS = ["run", "mode", "eye", "feet", "yaw", "pitch", "comment"] as const;
const BATCH_KEYS = ["run", "lines"] as const;
const LINE_KEYS = ["time", "level", "text"] as const;

/**
 * The body's object and the run check, first: a body that is no object, or has no string run,
 * is `malformed`; another run's body is `other-run`, whatever its other fields hold.
 */
function admitRun(body: unknown, run: string): BodyAdmission<JsonObject> {
  const read = readShape(() => {
    const object = objectAt(body, "$");
    return { object, named: stringAt(object.run, "$.run") };
  });
  if (!read.ok) return { ok: false, refusal: refusal("malformed", read.miss.message) };
  if (read.value.named !== run) {
    const message = `the body names run "${read.value.named}"; this server runs "${run}"`;
    return { ok: false, refusal: refusal("other-run", message) };
  }
  return { ok: true, value: read.value.object };
}

/** The pose of a mark body: mode, eye, feet (null exactly in fly), yaw, and pitch within 90. */
function readPose(body: JsonObject): Omit<MarkRequest, "run" | "comment"> {
  const mode: MoveMode = oneOfAt(body.mode, "$.mode", ["walk", "fly"] as const);
  const eye: Point = pointAt(body.eye, "$.eye");
  let feet: Point | null = null;
  if (mode === "walk") feet = pointAt(body.feet, "$.feet");
  else if (body.feet !== null) throw new ShapeMiss("$.feet", "null in fly");
  const yaw = numberAt(body.yaw, "$.yaw");
  const pitch = numberAt(body.pitch, "$.pitch");
  if (Math.abs(pitch) > 90) throw new ShapeMiss("$.pitch", "degrees from -90 to 90");
  return { mode, eye, feet, yaw, pitch };
}

/** The comment of a mark body: a string that is not empty and holds no line terminator. */
function readComment(body: JsonObject): string {
  const comment = stringAt(body.comment, "$.comment");
  if (comment.trim() === "") throw new ShapeMiss("$.comment", "a comment that is not empty");
  if (foldLines(comment) !== comment) throw new ShapeMiss("$.comment", "one line of text");
  return comment;
}

/**
 * Admit a mark body for the server's `run`. Order: object and run, the exact keys, the pose,
 * the comment, then the comment cap.
 */
export function admitMarkRequest(body: unknown, run: string): BodyAdmission<MarkRequest> {
  const named = admitRun(body, run);
  if (!named.ok) return named;
  const keys = readShape(() => recordAt(named.value, "$", MARK_KEYS));
  if (!keys.ok) return { ok: false, refusal: refusal("malformed", keys.miss.message) };
  const pose = readShape(() => readPose(named.value));
  if (!pose.ok) return { ok: false, refusal: refusal("malformed-pose", pose.miss.message) };
  const comment = readShape(() => readComment(named.value));
  if (!comment.ok) return { ok: false, refusal: refusal("malformed", comment.miss.message) };
  if (comment.value.length > MAX_COMMENT) {
    const message = `$.comment: holds ${comment.value.length} characters; the cap is ${MAX_COMMENT}`;
    return { ok: false, refusal: refusal("comment-too-long", message) };
  }
  return { ok: true, value: { run, ...pose.value, comment: comment.value } };
}

/** One page line at `path`: a time, a level and a text of 1 to 8,000 characters. */
function readLine(value: unknown, path: string): PageLine {
  const line = recordAt(value, path, LINE_KEYS);
  const time = numberAt(line.time, `${path}.time`);
  if (Math.abs(time) > LAST_INSTANT_MS) throw new ShapeMiss(`${path}.time`, "a date instant in ms");
  const level: LineLevel = oneOfAt(line.level, `${path}.level`, ["info", "warn", "error"] as const);
  const text = stringAt(line.text, `${path}.text`);
  if (text.length === 0 || text.length > MAX_LINE_TEXT) {
    throw new ShapeMiss(`${path}.text`, `1 to ${MAX_LINE_TEXT} characters`);
  }
  return { time, level, text };
}

/** The lines of a log batch: 1 to 200 page lines. */
function readLines(value: unknown): readonly PageLine[] {
  const list = listAt(value, "$.lines");
  if (list.length === 0 || list.length > MAX_BATCH_LINES) {
    throw new ShapeMiss("$.lines", `1 to ${MAX_BATCH_LINES} lines`);
  }
  return list.map((line, index) => readLine(line, `$.lines[${index}]`));
}

/** Admit a log batch for the server's `run`: object and run first, then the exact shape. */
export function admitLogBatch(body: unknown, run: string): BodyAdmission<LogBatch> {
  const named = admitRun(body, run);
  if (!named.ok) return named;
  const lines = readShape(() => readLines(recordAt(named.value, "$", BATCH_KEYS).lines));
  if (!lines.ok) return { ok: false, refusal: refusal("malformed", lines.miss.message) };
  return { ok: true, value: { run, lines: lines.value } };
}
