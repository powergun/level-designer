import { expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ROUTES, readSessionAnswer } from "@level-designer/qa-client/protocol";
import type { RunLog } from "../run-log/index.js";
import { openRunLog } from "../run-log/index.js";
import { createHandler, MarkFile } from "./index.js";

/** The test clock: one fixed morning. */
function now(): Date {
  return new Date(2026, 10, 17, 9, 0, 0);
}

/** A loopback request for `path`, as the page sends it. */
function loopback(path: string): Request {
  return new Request(`http://127.0.0.1:4327${path}`, { headers: { host: "127.0.0.1:4327" } });
}

/** Runs `body` with an open run log and a marks file in a temporary root it then removes. */
async function withRunLog(body: (log: RunLog, marks: MarkFile) => Promise<void>): Promise<void> {
  const root = mkdtempSync(join(tmpdir(), "qa-server-handler-"));
  try {
    const opening = openRunLog(root, now);
    if (!opening.ok) throw new Error(opening.reason);
    try {
      await body(opening.log, new MarkFile(join(root, "marks.log"), opening.log.name));
    } finally {
      opening.log.close();
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test("a run log that cannot be written never fails a request: the answer says so", async () => {
  await withRunLog(async (log, marks) => {
    log.close();
    const page = { document: "<!doctype html>", style: "", watch: "", program: "" };
    const handle = createHandler({ log, marks, level: { kind: "blocked", errors: [] }, page, now });
    const session = await handle(loopback(ROUTES.session));
    expect(session.status).toBe(200);
    const json: unknown = await session.json();
    const read = readSessionAnswer(json);
    if (!read.ok) throw new Error(read.miss.message);
    expect(read.value.run).toBe(log.name);
    expect(read.value.logFailure).toBe(`the run log ${log.path} is closed`);
    const served = await handle(loopback("/"));
    expect([served.status, await served.text()]).toEqual([200, "<!doctype html>"]);
  });
});

test("a defect answers one failure and logs its message when the stack is empty", async () => {
  await withRunLog(async (log, marks) => {
    const broken = Object.assign(new Error("the level state broke"), { stack: "" });
    const page = { document: "", style: "", watch: "", program: "" };
    const session = {
      log,
      marks,
      page,
      now,
      get level(): never {
        throw broken;
      },
    };
    const answer = await createHandler(session)(loopback(ROUTES.session));
    expect(answer.status).toBe(500);
    expect(await answer.json()).toEqual({
      kind: "failed",
      message: "the level state broke",
      logFailure: null,
    });
    const lines = (await Bun.file(log.path).text()).split("\n");
    const defects = lines.filter((line) =>
      line.endsWith(" server error defect: the level state broke"),
    );
    expect(defects).toHaveLength(1);
    const requests = lines.filter((line) => line.includes(`GET ${ROUTES.session} -> 500 defect:`));
    expect(requests).toHaveLength(1);
  });
});
