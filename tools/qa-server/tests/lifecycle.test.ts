import { afterEach, expect, test } from "bun:test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import {
  LEVEL_FILES,
  levelFileRoute,
  ROUTES,
  type RefusalReason,
  readMarkAnswer,
  readRefusalAnswer,
  readSessionAnswer,
} from "@level-designer/qa-client/protocol";
import { BUILD_ERRORS, FINDING, fakePipeline } from "./fakes.ts";
import type { RunFolders, TestRun } from "./harness.ts";
import {
  argsOf,
  makeFolders,
  readAnswer,
  removeFolders,
  runLogLines,
  startRun,
} from "./harness.ts";

/** The folders of the current test, removed after it. */
let folders: RunFolders | undefined;

/** The current test's server, stopped after it even when an assertion failed. */
let current: TestRun | undefined;

afterEach(async () => {
  const ending = current;
  current = undefined;
  try {
    if (ending !== undefined) {
      ending.stop.abort("the test ended");
      await ending.status;
    }
  } finally {
    if (folders !== undefined) removeFolders(folders);
    folders = undefined;
  }
});

/** Starts the current test's server on fresh folders with the fake build `build`. */
function startServer(dirs: RunFolders, build: Parameters<typeof fakePipeline>[0]): TestRun {
  current = startRun(argsOf(dirs), fakePipeline(build));
  return current;
}

/** A request to the server at `address`: a GET, or a POST of `body` as JSON. */
function request(address: string, path: string, body?: unknown): Promise<Response> {
  const init = body === undefined ? {} : { method: "POST", body: JSON.stringify(body) };
  return fetch(new URL(path, address), init);
}

/** Whether one of the run log's lines ends with `text`. */
function logged(lines: readonly string[], text: string): boolean {
  return lines.some((line) => line.endsWith(text));
}

test("a blocked build serves its errors and no level file; a stop writes the last line", async () => {
  folders = makeFolders();
  const started = startServer(folders, "blocked");
  const address = await started.address;

  const session = await readAnswer(await request(address, ROUTES.session), readSessionAnswer);
  expect(session.build).toEqual({ kind: "blocked", errors: BUILD_ERRORS });
  for (const name of Object.values(LEVEL_FILES)) {
    const response = await request(address, levelFileRoute(name));
    expect(response.status).toBe(404);
    expect((await readAnswer(response, readRefusalAnswer)).reason).toBe("no-level");
  }
  // The run is read first: a mark of this run hears no-level, an old page's mark other-run.
  const pose = { mode: "fly", eye: [0, 9, 0], feet: null, yaw: 0, pitch: 0, comment: "dark" };
  const marks: [string, RefusalReason][] = [
    [session.run, "no-level"],
    ["qa-2026-01-01T00-00-00", "other-run"],
  ];
  for (const [run, reason] of marks) {
    const mark = await request(address, ROUTES.mark, { run, ...pose });
    expect((await readAnswer(mark, readRefusalAnswer)).reason).toBe(reason);
  }

  started.stop.abort("SIGINT");
  expect(await started.status).toBe(0);
  const lines = runLogLines(folders.workdir);
  expect(logged(lines, "server warn build blocked: 2 errors")).toBe(true);
  for (const error of BUILD_ERRORS) {
    expect(logged(lines, `build error ${error.rule} ${error.path}: ${error.message}`)).toBe(true);
  }
  expect(lines.at(-1)).toMatch(/ server info stopped: SIGINT$/);
  const logPath = started.out[0]?.replace("run log ", "");
  expect(started.err).toEqual([`qa-server: stopped: SIGINT; the run log is ${logPath}`]);
  await expect(fetch(address)).rejects.toThrow();
});

test("a rejected level is served, and a mark the file system refuses fails once per request", async () => {
  folders = makeFolders();
  const marksFile = join(folders.workdir, "qa", "marks.log");
  mkdirSync(marksFile, { recursive: true });
  const started = startServer(folders, "rejected");
  const address = await started.address;

  const session = await readAnswer(await request(address, ROUTES.session), readSessionAnswer);
  expect(session.build).toMatchObject({
    kind: "built",
    verdict: { kind: "rejected", findings: 1 },
  });
  const pose = { mode: "fly", eye: [0, 9, 0], feet: null, yaw: 0, pitch: 0 };
  for (const comment of ["too dark", "still too dark"]) {
    const response = await request(address, ROUTES.mark, { run: session.run, ...pose, comment });
    expect(response.status).toBe(500);
    const answer = await readAnswer(response, readMarkAnswer);
    if (answer.kind !== "failed") throw new Error(`the mark did not fail: ${answer.kind}`);
    expect(answer.message).toStartWith(`cannot append to ${marksFile}: `);
  }

  started.stop.abort("SIGTERM");
  expect(await started.status).toBe(0);
  const lines = runLogLines(folders.workdir);
  expect(logged(lines, `finding ${FINDING.rule} ${FINDING.subject}: ${FINDING.message}`)).toBe(
    true,
  );
  const failures = lines.filter((line) => line.includes(`POST ${ROUTES.mark} -> 500 mark failed`));
  expect(failures).toHaveLength(2);
});
