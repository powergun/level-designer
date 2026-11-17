import { expect, test } from "bun:test";
import {
  admitLogBatch,
  admitMarkRequest,
  foldLines,
  MAX_BATCH_LINES,
  MAX_COMMENT,
  MAX_LINE_TEXT,
} from "./index.js";
import type { RefusalReason } from "./index.js";

/** The server's run in these cases. */
const RUN = "qa-run";

/** A valid walk mark body. */
function mark(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    run: RUN,
    mode: "walk",
    eye: [1, 1.656, 2],
    feet: [1, 0, 2],
    yaw: 12.5,
    pitch: -3,
    comment: "gap",
    ...overrides,
  };
}

/** The refusal reason of a mark body, or `admitted`. */
function markReason(body: unknown): RefusalReason | "admitted" {
  const admission = admitMarkRequest(body, RUN);
  return admission.ok ? "admitted" : admission.refusal.reason;
}

test("a mark is admitted whole, in fly with null feet too", () => {
  const admission = admitMarkRequest(mark(), RUN);
  expect<unknown>(admission).toEqual({ ok: true, value: mark() });
  expect(markReason(mark({ mode: "fly", feet: null }))).toBe("admitted");
});

test("the run is checked first: a body of another run is other-run whatever else it holds", () => {
  expect(markReason("text")).toBe("malformed");
  expect(markReason(mark({ run: 3 }))).toBe("malformed");
  expect(markReason({ run: "qa-old", pose: "an older shape" })).toBe("other-run");
  expect(markReason(mark({ run: "qa-old", comment: "x".repeat(MAX_COMMENT + 1) }))).toBe(
    "other-run",
  );
});

test("the keys come before the pose, and the pose before the comment", () => {
  expect(markReason(mark({ extra: 1 }))).toBe("malformed");
  expect(markReason({ ...mark(), comment: undefined })).toBe("malformed");
  expect(markReason(mark({ mode: "run", comment: "" }))).toBe("malformed-pose");
});

test("each pose rule refuses with malformed-pose", () => {
  const bad = [
    { mode: "swim" },
    { eye: [1, 2] },
    { eye: [1, 2, Number.NaN] },
    { feet: null },
    { mode: "fly", feet: [1, 0, 2] },
    { yaw: "north" },
    { pitch: 90.1 },
    { pitch: -90.1 },
  ];
  for (const overrides of bad) expect(markReason(mark(overrides))).toBe("malformed-pose");
  expect(markReason(mark({ pitch: 90 }))).toBe("admitted");
});

test("the comment cap passes at 2,000 and refuses 2,001 as comment-too-long", () => {
  expect(markReason(mark({ comment: "x".repeat(MAX_COMMENT) }))).toBe("admitted");
  expect(markReason(mark({ comment: "x".repeat(MAX_COMMENT + 1) }))).toBe("comment-too-long");
});

/**
 * Every character a Unicode line splitter breaks on, such as Python's `str.splitlines`: LF, VT,
 * FF, CR, FS, GS, RS, NEL, LS and PS. A run log reader splits by these.
 */
const SPLITTER_BREAKS = [0x0a, 0x0b, 0x0c, 0x0d, 0x1c, 0x1d, 0x1e, 0x85, 0x2028, 0x2029].map(
  (code) => String.fromCharCode(code),
);

test("an empty comment and a comment of two lines are malformed, with the path", () => {
  const twoLines = SPLITTER_BREAKS.map((terminator) => `one${terminator}two`);
  for (const comment of ["  ", "\r\n", ...twoLines]) {
    const admission = admitMarkRequest(mark({ comment }), RUN);
    expect(admission.ok ? "" : admission.refusal.message).toStartWith("$.comment:");
  }
});

test("foldLines folds each run of any splitter's line break into one space", () => {
  for (const terminator of SPLITTER_BREAKS) {
    expect(foldLines(`one${terminator}${terminator}two`)).toBe("one two");
  }
  expect(foldLines("a\r\n\u000bb")).toBe("a b");
});

test("a page line's time is a date instant: 8.64e15 ms either way passes, one ms beyond fails", () => {
  const at = (time: number): RefusalReason | "admitted" => {
    const admission = admitLogBatch({ run: RUN, lines: [{ time, level: "info", text: "x" }] }, RUN);
    return admission.ok ? "admitted" : admission.refusal.reason;
  };
  expect(at(8.64e15)).toBe("admitted");
  expect(at(-8.64e15)).toBe("admitted");
  expect(at(8.64e15 + 1)).toBe("malformed");
  expect(at(-8.64e15 - 1)).toBe("malformed");
  expect(at(1e20)).toBe("malformed");
  const refused = admitLogBatch(
    { run: RUN, lines: [{ time: 1e20, level: "info", text: "x" }] },
    RUN,
  );
  expect(refused.ok ? "" : refused.refusal.message).toStartWith("$.lines[0].time:");
});

test("a log batch holds 1 to 200 lines of 1 to 8,000 characters", () => {
  const line = { time: 1, level: "info", text: "x" };
  const batch = (lines: unknown[]): RefusalReason | "admitted" => {
    const admission = admitLogBatch({ run: RUN, lines }, RUN);
    return admission.ok ? "admitted" : admission.refusal.reason;
  };
  expect(batch(Array.from({ length: MAX_BATCH_LINES }, () => line))).toBe("admitted");
  expect(batch(Array.from({ length: MAX_BATCH_LINES + 1 }, () => line))).toBe("malformed");
  expect(batch([])).toBe("malformed");
  expect(batch([{ ...line, text: "x".repeat(MAX_LINE_TEXT) }])).toBe("admitted");
  expect(batch([{ ...line, text: "x".repeat(MAX_LINE_TEXT + 1) }])).toBe("malformed");
  expect(batch([{ ...line, text: "" }])).toBe("malformed");
  expect(batch([{ ...line, level: "debug" }])).toBe("malformed");
  const other = admitLogBatch({ run: "qa-old", lines: [line] }, RUN);
  expect(other.ok ? "admitted" : other.refusal.reason).toBe("other-run");
});
