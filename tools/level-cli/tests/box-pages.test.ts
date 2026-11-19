import { expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { recipeAt } from "@level-designer/level-format";
import { pageBytes, runSnapshot, sceneForEachTest } from "./fakes.js";
import { BOX_PAGES, withStatics } from "./box-level.js";
import { HALL_PAGES } from "./hall-level.js";

// Owner: level-cli's `snapshot` box pages: one swatch per finish path that only a static
// object names, the box drawn as a slab on the path's largest shown face, written between
// the slab pages and the hall pages.

const scene = sceneForEachTest();

/** The page file of a finish path under the scene's finish directory. */
function pageOf(label: string): string {
  return join(scene.workdir, "snapshots", "finish", `${label.replace("/", ".")}.png`);
}

test("snapshot announces the slab pages, then the box pages, then the hall pages", async () => {
  const { status, output, calls } = await runSnapshot(withStatics(scene.built), scene.workdir);
  expect(status).toBe(0);
  const boxes = BOX_PAGES.map((box) => box.finish);
  const labels = ["timber/crate", "steel/trim", ...boxes, ...HALL_PAGES.keys()];
  expect(calls.pages.map((swatch) => swatch.label)).toEqual(labels);
  const finish = join(scene.workdir, "snapshots", "finish");
  const pages = output.err.filter((line) => line.startsWith(`wrote ${finish}`));
  expect(pages).toEqual(labels.map((label) => `wrote ${pageOf(label)}`));
  for (const label of boxes) {
    expect([...(await readFile(pageOf(label)))]).toEqual([...pageBytes(label)]);
  }
});

test("each box page stands on its path's largest shown face, and a tie keeps the first", async () => {
  const built = withStatics(scene.built);
  const { calls } = await runSnapshot(built, scene.workdir);
  const boxes = calls.pages.filter((swatch) => swatch.label.startsWith("litter/"));
  expect(boxes).toHaveLength(BOX_PAGES.length);
  for (const [i, swatch] of boxes.entries()) {
    const box = BOX_PAGES[i];
    if (box === undefined) throw new Error("a page without its fixture box");
    expect(swatch.label).toBe(box.finish);
    expect(swatch.tint).toBe(box.color);
    expect(swatch.subject).toEqual({
      kind: "slab",
      size: box.size,
      seed: box.seed,
      wear: box.wear,
    });
    const recipe = recipeAt(built.level.finishes, box.finish);
    if (recipe === undefined) throw new Error(`the fixture's table lacks ${box.finish}`);
    expect(swatch.recipe).toEqual(recipe);
  }
});

test("a path that a slab also names keeps the slab's page", async () => {
  const { calls } = await runSnapshot(withStatics(scene.built), scene.workdir);
  const trim = calls.pages.filter((swatch) => swatch.label === "steel/trim");
  expect(trim).toHaveLength(1);
  expect(trim[0]?.tint).toBe("#555555");
  const plate = calls.pages.filter((swatch) => swatch.label === "steel/plate");
  expect(plate.map((swatch) => swatch.subject.kind)).toEqual(["hall"]);
});
