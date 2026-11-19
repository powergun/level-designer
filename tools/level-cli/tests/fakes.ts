import { afterEach, beforeEach } from "bun:test";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { run } from "@level-designer/level-cli";
import type { Pipeline, Streams } from "@level-designer/level-cli";
import type { BuildError, BuiltLevel, ReadOutcome, Report } from "@level-designer/level-pipeline";
import type { PreparedLevel } from "@level-designer/sec111-gateway";
import { readCommittedLevel } from "@level-designer/sec111-gateway/testing";
import type { FinishSwatch, SnapshotInput } from "@level-designer/snapshot-render";

/** The committed description path the fake pipeline names as its default. */
export const COMMITTED = join(tmpdir(), "committed", "dark-factory.json");

/** The lines a run wrote to each stream. */
export interface Captured {
  readonly out: string[];
  readonly err: string[];
  readonly streams: Streams;
}

/** Fresh captured streams. */
export function capture(): Captured {
  const out: string[] = [];
  const err: string[] = [];
  return { out, err, streams: { out: (line) => out.push(line), err: (line) => err.push(line) } };
}

/** What the fake pipeline answers: the read, the build and the report of a built level. */
export interface Script {
  readonly read?: "ok" | "unreadable";
  readonly build: { readonly ok: true; readonly built: BuiltLevel } | readonly BuildError[];
  readonly report?: Report;
}

/** The calls the fake pipeline received, in order of each kind. */
export interface Calls {
  readonly reads: string[];
  readonly builds: number[];
  readonly validations: BuiltLevel[];
  readonly renders: SnapshotInput[];
  readonly pages: FinishSwatch[];
}

/** The PNG bytes the fake renderer returns for a finish page: its label's text, so distinct. */
export function pageBytes(label: string): Uint8Array {
  return new TextEncoder().encode(label);
}

/** The PNG bytes the fake renderer returns for each sheet, distinct per sheet. */
export const SHEET_BYTES = {
  plan: new Uint8Array([1]),
  section: new Uint8Array([2]),
  view: new Uint8Array([3]),
  custom: new Uint8Array([4]),
} as const;

/** A fake pipeline that answers by `script` and records every call. */
export function fakePipeline(script: Script): { pipeline: Pipeline; calls: Calls } {
  const calls: Calls = { reads: [], builds: [], validations: [], renders: [], pages: [] };
  const pipeline: Pipeline = {
    committedDescription: COMMITTED,
    readInputs: (path) => {
      calls.reads.push(path);
      const outcome: ReadOutcome =
        script.read === "unreadable"
          ? { ok: false, path, reason: "no such file" }
          : { ok: true, inputs: { description: new Uint8Array(), baseStage: new Uint8Array() } };
      return Promise.resolve(outcome);
    },
    buildLevel: () => {
      calls.builds.push(calls.builds.length);
      const build = script.build;
      return Promise.resolve("ok" in build ? build : { ok: false, errors: build });
    },
    validateLevel: (built) => {
      calls.validations.push(built);
      if (script.report === undefined) throw new Error("the script holds no report");
      return Promise.resolve(script.report);
    },
    renderSheets: (_glb, input) => {
      calls.renders.push(input);
      const { custom, ...three } = SHEET_BYTES;
      return input.custom === undefined ? three : { ...three, custom };
    },
    renderFinishSheet: (swatch) => {
      calls.pages.push(swatch);
      return pageBytes(swatch.label);
    },
  };
  return { pipeline, calls };
}

/** One `snapshot` run on a built level: its exit status, its captured streams and its calls. */
export async function runSnapshot(
  built: BuiltLevel,
  workdir: string,
): Promise<{ readonly status: number; readonly output: Captured; readonly calls: Calls }> {
  const { pipeline, calls } = fakePipeline({ build: { ok: true, built } });
  const output = capture();
  const status = await run(["snapshot", "--workdir", workdir], pipeline, output.streams);
  return { status, output, calls };
}

/** A crate prop of a description at the plan point `at`. */
function crate(
  id: string,
  at: readonly [number, number],
): BuiltLevel["description"]["props"][number] {
  return { id, kind: "crate", at, yaw: 0, params: new Map<string, unknown>() };
}

/** A built level named `fixture-hall` with two props on sec-111's committed prepared level. */
export async function fakeBuilt(): Promise<BuiltLevel> {
  const prepared: PreparedLevel = await readCommittedLevel();
  const lighting = {
    environment: { intensity: 1, ambient: [0, 0, 0], overhead: [0, 0, 0] },
    points: [],
    haze: { density: 0, color: [0, 0, 0], glow: 0 },
    exposure: 1,
  } as const;
  return {
    description: {
      name: "fixture-hall",
      base: { scale: 3.89956, materials: new Map(), doubleSided: [] },
      seals: [],
      statics: [],
      finishes: new Map(),
      glows: new Map(),
      props: [crate("front", [-5, 10]), crate("back", [0, -55])],
      lighting,
    },
    hash: "0123456789ab",
    glb: new Uint8Array([103, 108, 84, 70]),
    json: '{"props":[]}\n',
    level: { finishes: new Map(), props: [], lighting },
    baseImages: 11,
    prepared: { level: prepared, files: { document: "{}", navMesh: new Uint8Array() } },
    placed: [],
  };
}

/** The current test's temporary work directory and fake built level. */
export interface Scene {
  readonly workdir: string;
  readonly built: BuiltLevel;
}

/**
 * Gives every test of the calling file a fresh temporary work directory and fake built level,
 * and removes the directory with everything in it after the test.
 */
export function sceneForEachTest(): Scene {
  let current: Scene | undefined;
  beforeEach(async () => {
    current = { workdir: await mkdtemp(join(tmpdir(), "level-cli-")), built: await fakeBuilt() };
  });
  afterEach(async () => {
    if (current !== undefined) await rm(current.workdir, { recursive: true, force: true });
    current = undefined;
  });
  const now = (): Scene => {
    if (current === undefined) throw new Error("the scene exists only inside a test");
    return current;
  };
  return {
    get workdir() {
      return now().workdir;
    },
    get built() {
      return now().built;
    },
  };
}

/** Every file under the work directory, as sorted paths relative to it with `/` separators. */
export async function filesUnder(workdir: string): Promise<readonly string[]> {
  const entries = await readdir(workdir, { recursive: true, withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => relative(workdir, join(entry.parentPath, entry.name)).replaceAll("\\", "/"))
    .toSorted();
}
