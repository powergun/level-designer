import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ShapeRead } from "@level-designer/qa-client/protocol";
import type { ExitStatus, Pipeline, Surroundings } from "@level-designer/qa-server";
import { qaClientPageFile, run } from "@level-designer/qa-server";

/** A run's folders: the temporary root, the work directory and the installed sibling stub. */
export interface RunFolders {
  readonly root: string;
  readonly workdir: string;
  readonly sibling: string;
}

/**
 * A fresh temporary root with `work/` and a sibling stub that holds its own install,
 * `sibling/node_modules/`. The caller removes the root with `removeFolders`.
 */
export function makeFolders(): RunFolders {
  const root = mkdtempSync(join(tmpdir(), "qa-server-"));
  const sibling = join(root, "sibling");
  mkdirSync(join(sibling, "node_modules"), { recursive: true });
  return { root, workdir: join(root, "work"), sibling };
}

/** Removes a run's temporary root with everything in it. */
export function removeFolders(folders: RunFolders): void {
  rmSync(folders.root, { recursive: true, force: true });
}

/** A run in progress or ended: its captured streams, its stop and its exit status. */
export interface TestRun {
  readonly out: string[];
  readonly err: string[];
  readonly stop: AbortController;
  readonly status: Promise<ExitStatus>;
  /** The printed address; it rejects when the run ends without serving. */
  readonly address: Promise<string>;
}

/** What a test changes from the default run surroundings. */
export interface RunChanges {
  readonly loadPipeline?: () => Promise<Pipeline>;
  readonly pageFile?: (source: string) => string;
  /** The stop request, when the test raises it from inside a start step. */
  readonly stop?: AbortController;
}

/** A clock that starts at 2026-11-17 10:00 local time and moves 1 s per reading. */
function steppingClock(): () => Date {
  let tick = 0;
  return () => {
    tick += 1;
    return new Date(2026, 10, 17, 10, 0, tick);
  };
}

/** Starts `run` on `argv` with captured streams, a stepping clock and the given pipeline. */
export function startRun(
  argv: readonly string[],
  pipeline: Pipeline,
  changes: RunChanges = {},
): TestRun {
  const out: string[] = [];
  const err: string[] = [];
  const stop = changes.stop ?? new AbortController();
  const served = Promise.withResolvers<string>();
  const surroundings: Surroundings = {
    loadPipeline: changes.loadPipeline ?? (() => Promise.resolve(pipeline)),
    pageFile: changes.pageFile ?? qaClientPageFile,
    out: (line) => {
      out.push(line);
      const address = /^serving (http:\/\/127\.0\.0\.1:\d+\/)$/.exec(line)?.[1];
      if (address !== undefined) served.resolve(address);
    },
    err: (line) => err.push(line),
    now: steppingClock(),
    stop: stop.signal,
  };
  const status = run(argv, surroundings);
  void status.then(
    (ended) => served.reject(new Error(`the run ended with ${ended}: ${err.join(" | ")}`)),
    (error: unknown) => served.reject(error),
  );
  served.promise.catch(() => undefined);
  return { out, err, stop, status, address: served.promise };
}

/** The arguments of a run on `folders` with port 0. */
export function argsOf(folders: RunFolders): string[] {
  return ["--workdir", folders.workdir, "--sibling", folders.sibling, "--port", "0"];
}

/** The lines of the one run log under the work directory. */
export function runLogLines(workdir: string): string[] {
  const dir = join(workdir, "qa", "logs");
  const files = readdirSync(dir);
  if (files.length !== 1) throw new Error(`expected one run log, found ${files.length}`);
  return readFileSync(join(dir, files[0] ?? ""), "utf8")
    .split("\n")
    .slice(0, -1);
}

/** The answer of `response`, read with one of the protocol's readers; a mismatch throws. */
export async function readAnswer<T>(
  response: Response,
  reader: (json: unknown) => ShapeRead<T>,
): Promise<T> {
  const json: unknown = await response.json();
  const read = reader(json);
  if (!read.ok) throw new Error(`the answer is not of its shape: ${read.miss.message}`);
  return read.value;
}

/** One run log line: local ISO time with milliseconds and offset, source, level, then text. */
const LINE_SHAPE =
  /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}[+-]\d\d:\d\d (server|page) (info|warn|error) \S/;

/** The run log lines that break the line shape; none when every text was folded. */
export function misshapenLines(lines: readonly string[]): string[] {
  return lines.filter((line) => !LINE_SHAPE.test(line));
}
