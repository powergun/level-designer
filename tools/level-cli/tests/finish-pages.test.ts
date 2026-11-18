import { expect, test } from "bun:test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { run } from "@level-designer/level-cli";
import { recipeAt } from "@level-designer/level-format";
import {
  capture,
  fakePipeline,
  filesUnder,
  pageBytes,
  runSnapshot,
  sceneForEachTest,
} from "./fakes.js";
import { LARGEST, withFinishes } from "./finish-level.js";
import { BLOCKING } from "./reports.js";

// Owner: level-cli's `snapshot` finish pages: one swatch per finish path in use, each on the
// path's largest outside face, written as one announced page per path into an emptied
// directory.

const scene = sceneForEachTest();

/** The absolute path of a sheet or a finish page under the scene's snapshot directory. */
function under(...segments: readonly string[]): string {
  return join(scene.workdir, "snapshots", ...segments);
}

/** Leaves a finish page of an earlier run, which the next snapshot must not keep. */
async function earlierPage(): Promise<string> {
  const path = under("finish", "gone.role.png");
  await mkdir(under("finish"), { recursive: true });
  await writeFile(path, "old");
  return path;
}

test("snapshot writes one announced page per finish path in use, in order of first use", async () => {
  const built = withFinishes(scene.built);
  const { status, output, calls } = await runSnapshot(built, scene.workdir);
  expect(status).toBe(0);
  const labels = ["steel/plate", "timber/crate", "steel/trim"];
  const used = new Set(built.level.props.flatMap((prop) => prop.slabs.map((s) => s.finish)));
  expect(new Set(labels)).toEqual(used);
  expect(calls.pages.map((swatch) => swatch.label)).toEqual(labels);
  const pages = labels.map((label) => `${label.replace("/", ".")}.png`);
  expect(output.err).toEqual([
    ...["plan", "section", "view"].map((sheet) => `wrote ${under(`${sheet}.png`)}`),
    ...pages.map((page) => `wrote ${under("finish", page)}`),
  ]);
  for (const [i, page] of pages.entries()) {
    expect([...(await readFile(under("finish", page)))]).toEqual([...pageBytes(labels[i] ?? "")]);
  }
});

test("each page stands on its path's largest outside face, and a tie keeps the first slab", async () => {
  const built = withFinishes(scene.built);
  const { calls } = await runSnapshot(built, scene.workdir);
  expect(calls.pages).toHaveLength(LARGEST.length);
  for (const [i, swatch] of calls.pages.entries()) {
    const slab = LARGEST[i];
    if (slab === undefined) throw new Error("a page without its fixture slab");
    expect(swatch.label).toBe(slab.finish);
    expect(swatch.tint).toBe(slab.color);
    expect(swatch.subject).toEqual({
      kind: "slab",
      size: slab.size,
      seed: slab.seed,
      wear: slab.wear,
    });
    const recipe = recipeAt(built.level.finishes, slab.finish);
    if (recipe === undefined) throw new Error(`the fixture's table lacks ${slab.finish}`);
    expect(swatch.recipe).toEqual(recipe);
  }
});

test("snapshot empties the finish directory, so a level without props writes no page", async () => {
  const stale = await earlierPage();
  const { pipeline, calls } = fakePipeline({ build: { ok: true, built: scene.built } });
  const output = capture();
  const status = await run(["snapshot", "--workdir", scene.workdir], pipeline, output.streams);
  expect(status).toBe(0);
  expect(calls.pages).toEqual([]);
  expect(output.err).toEqual(
    ["plan", "section", "view"].map((sheet) => `wrote ${under(`${sheet}.png`)}`),
  );
  expect(await filesUnder(scene.workdir)).toEqual(
    ["plan", "section", "view"].map((sheet) => `snapshots/${sheet}.png`),
  );
  expect(await Bun.file(stale).exists()).toBe(false);
});

test("a blocked snapshot draws no page and leaves the finish directory as it was", async () => {
  const kept = await earlierPage();
  const { pipeline, calls } = fakePipeline({ build: BLOCKING });
  const status = await run(["snapshot", "--workdir", scene.workdir], pipeline, capture().streams);
  expect(status).toBe(2);
  expect(calls.pages).toEqual([]);
  expect(await readFile(kept, "utf8")).toBe("old");
});
