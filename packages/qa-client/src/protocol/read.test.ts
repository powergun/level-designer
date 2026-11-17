import { expect, test } from "bun:test";
import { readMarkAnswer, readSessionAnswer } from "./index.js";

/** Session facts of a blocked build. */
const BLOCKED = {
  run: "qa-run",
  runLog: "/w/qa/logs/qa-run.log",
  marksFile: "/w/qa/marks.log",
  build: { kind: "blocked", errors: [{ rule: "shape", path: "$.name", message: "$.name: bad" }] },
  logFailure: null,
};

test("session facts read in both build shapes, and a blocked build holds no name", () => {
  expect<unknown>(readSessionAnswer(BLOCKED)).toEqual({ ok: true, value: BLOCKED });
  const named = { ...BLOCKED, build: { ...BLOCKED.build, name: "dark-factory" } };
  const read = readSessionAnswer(named);
  expect(read.ok ? "" : read.miss.path).toBe("$.build.name");
});

test("a mismatch names the path of the first wrong value", () => {
  const built = {
    ...BLOCKED,
    build: {
      kind: "built",
      name: "a",
      description: "b",
      verdict: { kind: "rejected", findings: 0 },
    },
  };
  const read = readSessionAnswer(built);
  expect(read.ok ? "" : read.miss.path).toBe("$.build.verdict.findings");
  const mark = readMarkAnswer({ kind: "saved", mark: 1, file: "f" });
  expect(mark.ok ? "" : mark.miss.path).toBe("$.logFailure");
});
