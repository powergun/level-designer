import { expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openRunLog } from "./run-log/index.js";
import { StartRecord } from "./start-record.js";
import type { Surroundings } from "./surroundings.js";

/** The test clock: one fixed morning. */
function now(): Date {
  return new Date(2026, 10, 17, 9, 0, 0);
}

test("a start line that cannot be written ends the start on the terminal alone", () => {
  const root = mkdtempSync(join(tmpdir(), "qa-server-record-"));
  try {
    const opening = openRunLog(root, now);
    if (!opening.ok) throw new Error(opening.reason);
    const log = opening.log;
    log.close();
    const err: string[] = [];
    const surroundings: Surroundings = {
      loadPipeline: () => Promise.reject(new Error("not loaded in this test")),
      pageFile: (source) => source,
      out: () => undefined,
      err: (line) => err.push(line),
      now,
      stop: new AbortController().signal,
    };
    const record = new StartRecord(log, surroundings);
    expect(record.begin("sibling check")).toBe(false);
    expect(err).toEqual([`qa-server: the run log ${log.path} is closed`]);
    expect(record.fail({ reason: "the level broke", stack: undefined })).toBe(1);
    // The failure is printed, and no `see the run log` line points at a log that lacks it.
    expect(err.slice(1)).toEqual([
      `qa-server: the run log ${log.path} is closed`,
      "qa-server: the level broke",
    ]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
