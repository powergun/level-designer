import { afterEach, expect, test } from "bun:test";
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Pipeline } from "@level-designer/qa-server";
import { qaClientPageFile } from "@level-designer/qa-server";
import { FAKE_DESCRIPTION, fakePipeline } from "./fakes.ts";
import type { RunFolders, TestRun } from "./harness.ts";
import {
  argsOf,
  makeFolders,
  misshapenLines,
  removeFolders,
  runLogLines,
  startRun,
} from "./harness.ts";

/** The folders of the current test, removed after it. */
let folders: RunFolders | undefined;

afterEach(() => {
  if (folders !== undefined) removeFolders(folders);
  folders = undefined;
});

/** The path of the one run log under the work directory. */
function onlyRunLog(workdir: string): string {
  const logs = join(workdir, "qa", "logs");
  const [name] = readdirSync(logs);
  return join(logs, name ?? "");
}

/** Fresh folders for this test. */
function fresh(): RunFolders {
  folders = makeFolders();
  return folders;
}

/**
 * Proves one start failure: status 1, an `err` line that names `subject`, the run log's path
 * on `err`, and the reason in the run log as an error line. Returns the run log's lines.
 */
async function expectStartFailure(
  started: TestRun,
  workdir: string,
  subject: string,
): Promise<string[]> {
  expect(await started.status).toBe(1);
  const reason = started.err.find((line) => line.includes(subject));
  expect(reason).toBeDefined();
  const lines = runLogLines(workdir);
  expect(started.err).toContainEqual(expect.stringContaining(join(workdir, "qa", "logs")));
  expect(
    lines.some((line) => line.includes(" server error start failed: ") && line.includes(subject)),
  ).toBe(true);
  expect(started.out).toEqual([`run log ${onlyRunLog(workdir)}`]);
  expect(misshapenLines(lines)).toEqual([]);
  return lines;
}

test("each usage error exits 3 before any file action and names its option", async () => {
  const { workdir, sibling } = fresh();
  const cases: [string[], string][] = [
    [["--sibling", sibling], "--workdir"],
    [["--workdir", workdir], "--sibling"],
    [["--workdir", workdir, "--sibling", sibling, "--port", "70000"], "--port"],
    [["--workdir", workdir, "--sibling", sibling, "--port", "x"], "--port"],
    [["--workdir=", "--sibling", sibling], "empty"],
    [["--workdir", workdir, "--sibling", sibling, "--colour", "red"], "--colour"],
  ];
  for (const [argv, subject] of cases) {
    const started = startRun(argv, fakePipeline("accepted"));
    expect(await started.status).toBe(3);
    expect(started.err[0]).toStartWith("qa-server: ");
    expect(started.err[0]).toContain(subject);
    expect(started.err[1]).toStartWith("usage: qa-server");
  }
  expect(existsSync(workdir)).toBe(false);
});

test("a run log that cannot be opened prints on the terminal alone", async () => {
  const dirs = fresh();
  writeFileSync(dirs.workdir, "a file where the work directory should be");
  const started = startRun(argsOf(dirs), fakePipeline("accepted"));
  expect(await started.status).toBe(1);
  expect(started.err).toHaveLength(1);
  expect(started.err[0]).toStartWith(
    `qa-server: cannot open the run log ${join(dirs.workdir, "qa", "logs")}`,
  );
});

test("a missing sibling install names the sibling and its fix", async () => {
  const dirs = fresh();
  const bare = join(dirs.root, "bare-sibling");
  mkdirSync(bare);
  const started = startRun([...argsOf(dirs), "--sibling", bare], fakePipeline("accepted"));
  const lines = await expectStartFailure(
    started,
    dirs.workdir,
    `${bare} has no install: run its own just setup in ${bare}`,
  );
  expect(lines.some((line) => line.endsWith(`sibling ${dirs.sibling}: install found`))).toBe(true);
  expect(lines.some((line) => line.endsWith(`sibling ${bare}: no install`))).toBe(true);
  expect(lines.some((line) => line.includes("start: level"))).toBe(false);
});

test("a sibling directory that does not exist says to check it out", async () => {
  const dirs = fresh();
  const absent = join(dirs.root, "absent-sibling");
  const started = startRun([...argsOf(dirs), "--sibling", absent], fakePipeline("accepted"));
  const lines = await expectStartFailure(
    started,
    dirs.workdir,
    `${absent} is no directory: check the sibling out beside this repository`,
  );
  expect(lines.some((line) => line.endsWith(`sibling ${absent}: no directory`))).toBe(true);
  expect(started.err.some((line) => line.includes("just setup"))).toBe(false);
});

test("an unreadable description names the file", async () => {
  const dirs = fresh();
  const started = startRun(argsOf(dirs), fakePipeline("unreadable"));
  await expectStartFailure(
    started,
    dirs.workdir,
    `cannot read the description ${FAKE_DESCRIPTION}: no such file`,
  );
});

/** A pipeline loader that fails as a broken sibling install does. */
function brokenLoad(): Promise<never> {
  return Promise.reject(new Error("Cannot find module rapier"));
}

test("a pipeline that fails to load and a build that throws are logged with the stack", async () => {
  const dirs = fresh();
  const loading = startRun(argsOf(dirs), fakePipeline("accepted"), { loadPipeline: brokenLoad });
  const lines = await expectStartFailure(
    loading,
    dirs.workdir,
    "the level pipeline failed to load: Cannot find module rapier",
  );
  expect(lines.some((line) => line.includes("server error Error: Cannot find module rapier"))).toBe(
    true,
  );
  rmSync(dirs.workdir, { recursive: true });

  // A stack holds line feeds: the fold keeps the whole stack, frames too, on one log line.
  const stack = lines.filter((line) => line.includes("Error: Cannot find module rapier"));
  expect(stack.some((line) => line.includes(" at brokenLoad "))).toBe(true);
});

test("a throwing read, build and validation each name their phase", async () => {
  const dirs = fresh();
  const phases: [Parameters<typeof fakePipeline>[0], string][] = [
    ["read-throws", "the level step failed at read: the base stage is missing"],
    ["build-throws", "the level step failed at build: sec-111 exploded"],
    ["validation-throws", "the level step failed at validation: the judgement broke"],
  ];
  for (const [build, subject] of phases) {
    await expectStartFailure(startRun(argsOf(dirs), fakePipeline(build)), dirs.workdir, subject);
    rmSync(dirs.workdir, { recursive: true });
  }
});

test("a page file that cannot be read names the file", async () => {
  const dirs = fresh();
  const missing = join(dirs.root, "no-such-page.css");
  const pageFile = (source: string): string =>
    source === "page.css" ? missing : qaClientPageFile(source);
  const started = startRun(argsOf(dirs), fakePipeline("accepted"), { pageFile });
  await expectStartFailure(started, dirs.workdir, "cannot read the page file page.css: ");
});

test("a stop during the start is told at once, waits for the running step and ends the run", async () => {
  const dirs = fresh();
  const stop = new AbortController();
  const loadPipeline = (): Promise<Pipeline> => {
    stop.abort("SIGINT");
    return Promise.resolve(fakePipeline("accepted"));
  };
  const started = startRun(argsOf(dirs), fakePipeline("accepted"), { loadPipeline, stop });
  expect(await started.status).toBe(0);
  expect(started.out).toEqual([`run log ${onlyRunLog(dirs.workdir)}`]);
  expect(started.err).toEqual([
    "qa-server: stop requested (SIGINT); waiting for the running step: level",
    "qa-server: stopped during the start: SIGINT",
  ]);
  const lines = runLogLines(dirs.workdir);
  expect(lines.at(-1)).toMatch(/ server info stopped during the start: SIGINT$/);
  expect(lines.some((line) => line.includes("start: page bundles"))).toBe(false);
});

test("a page script that fails to bundle names the script", async () => {
  const dirs = fresh();
  const broken = join(dirs.root, "program.ts");
  writeFileSync(broken, 'import { nothing } from "./no-such-module.ts";\nconsole.log(nothing);\n');
  const pageFile = (source: string): string =>
    source === "program.ts" ? broken : qaClientPageFile(source);
  const started = startRun(argsOf(dirs), fakePipeline("accepted"), { pageFile });
  await expectStartFailure(started, dirs.workdir, "cannot bundle the page script program.ts: ");
});

test("a taken port names the port, and the server never moves to another", async () => {
  const dirs = fresh();
  const holder = Bun.serve({ hostname: "127.0.0.1", port: 0, fetch: () => new Response("held") });
  try {
    const port = String(holder.port);
    const started = startRun([...argsOf(dirs).slice(0, -1), port], fakePipeline("accepted"));
    await expectStartFailure(started, dirs.workdir, `port ${port} is taken`);
  } finally {
    await holder.stop(true);
  }
});
