import { expect, test } from "bun:test";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { run } from "@level-designer/level-cli";
import { capture, fakePipeline, filesUnder, sceneForEachTest } from "./fakes.js";
import { ACCEPTED, ACCEPTED_LINES, BLOCKING, REJECTED } from "./reports.js";

// Owner: level-cli's `build`: it prints the report and writes the level pair under the work
// directory only for an accepted report, and announces every write or why it wrote nothing.

const scene = sceneForEachTest();

test("export-dressing writes the two pipeline sheets directly from placement", async () => {
  const dressing = { ok: true, props: "prop records", decorations: "floor boxes" } as const;
  const { pipeline, calls } = fakePipeline({ dressing, build: BLOCKING });
  const output = capture();
  const status = await run(
    ["export-dressing", "--workdir", scene.workdir],
    pipeline,
    output.streams,
  );
  expect(status).toBe(0);
  expect(calls.builds).toEqual([]);
  const dir = join(scene.workdir, "factory-dressing");
  expect(await readFile(join(dir, "props.json"), "utf8")).toBe(dressing.props);
  expect(await readFile(join(dir, "decorations.json"), "utf8")).toBe(dressing.decorations);
});

test("build writes the pair of an accepted level under the work directory and announces it", async () => {
  const { pipeline } = fakePipeline({ build: { ok: true, built: scene.built }, report: ACCEPTED });
  const output = capture();
  const status = await run(["build", "--workdir", scene.workdir], pipeline, output.streams);
  expect(status).toBe(0);
  expect(output.out).toEqual([...ACCEPTED_LINES]);
  const glb = join(scene.workdir, "level", "fixture-hall.glb");
  const json = join(scene.workdir, "level", "fixture-hall.json");
  expect(output.err).toEqual([`wrote ${glb}`, `wrote ${json}`]);
  expect(await filesUnder(scene.workdir)).toEqual([
    "level/fixture-hall.glb",
    "level/fixture-hall.json",
  ]);
  expect([...(await readFile(glb))]).toEqual([...scene.built.glb]);
  expect(await readFile(json, "utf8")).toBe(scene.built.json);
});

test("build writes nothing for a rejected level, says so and exits 2", async () => {
  const { pipeline } = fakePipeline({ build: { ok: true, built: scene.built }, report: REJECTED });
  const output = capture();
  const status = await run(["build", "--workdir", scene.workdir], pipeline, output.streams);
  expect(status).toBe(2);
  expect(output.out.at(-1)).toBe("rejected: 2 findings");
  expect(output.err).toEqual(["nothing written: the level is rejected"]);
  expect(await filesUnder(scene.workdir)).toEqual([]);
});

test("build writes nothing for a blocked build, prints its errors and exits 2", async () => {
  const { pipeline } = fakePipeline({ build: BLOCKING });
  const output = capture();
  const status = await run(["build", "--workdir", scene.workdir], pipeline, output.streams);
  expect(status).toBe(2);
  expect(output.out.at(-1)).toBe("blocked: 2 errors");
  expect(output.out).toHaveLength(3);
  expect(output.err).toEqual(["nothing written: the build is blocked"]);
  expect(await filesUnder(scene.workdir)).toEqual([]);
});

test("a work directory that cannot be written is named with exit 3", async () => {
  const blocker = join(scene.workdir, "taken");
  await writeFile(blocker, "a file where the work directory should be");
  const { pipeline } = fakePipeline({ build: { ok: true, built: scene.built }, report: ACCEPTED });
  const output = capture();
  const status = await run(["build", "--workdir", blocker], pipeline, output.streams);
  expect(status).toBe(3);
  expect(output.err).toHaveLength(1);
  expect(output.err[0]).toStartWith(`cannot write ${join(blocker, "level", "fixture-hall.glb")}: `);
  expect(await filesUnder(scene.workdir)).toEqual(["taken"]);
});
