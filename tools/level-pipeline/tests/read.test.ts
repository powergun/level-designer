import { afterAll, beforeAll, expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readInputs } from "@level-designer/level-pipeline";
import { fixtureBytes } from "./fixture.js";

// Owner: level-pipeline's read: the description file's bytes and the base stage, or the path
// of a description file it cannot read.

let directory: string;

beforeAll(async () => {
  directory = await mkdtemp(join(tmpdir(), "level-pipeline-read-"));
});

afterAll(async () => {
  await rm(directory, { recursive: true, force: true });
});

test("the read returns the description's bytes and the base stage", async () => {
  const path = join(directory, "fixture.json");
  await writeFile(path, fixtureBytes());
  const outcome = await readInputs(path);
  if (!outcome.ok) throw new Error(outcome.reason);
  expect(outcome.inputs.description).toEqual(fixtureBytes());
  expect(new TextDecoder().decode(outcome.inputs.baseStage.subarray(0, 4))).toBe("glTF");
});

test("the read names a description file it cannot read", async () => {
  const path = join(directory, "missing.json");
  const outcome = await readInputs(path);
  expect(outcome.ok).toBe(false);
  if (outcome.ok) return;
  expect(outcome.path).toBe(path);
  expect(outcome.reason.length).toBeGreaterThan(0);
});
