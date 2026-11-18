import { expect, test } from "bun:test";
import { join } from "node:path";
import { recipeAt } from "@level-designer/level-format";
import { runSnapshot, sceneForEachTest } from "./fakes.js";
import { HALL_PAGES, withHallFinishes } from "./hall-level.js";

// Owner: level-cli's `snapshot` hall pages: one swatch per hall finish that a base override
// names, over the grey ground, with the prepared interior and the classes its layers draw on.

const scene = sceneForEachTest();

test("snapshot writes one announced hall page per hall finish in use, after the slab pages", async () => {
  const { status, output, calls } = await runSnapshot(withHallFinishes(scene.built), scene.workdir);
  expect(status).toBe(0);
  const labels = ["timber/crate", "steel/trim", ...HALL_PAGES.keys()];
  expect(calls.pages.map((swatch) => swatch.label)).toEqual(labels);
  const finish = join(scene.workdir, "snapshots", "finish");
  const pages = output.err.filter((line) => line.startsWith(`wrote ${finish}`));
  expect(pages).toEqual(
    labels.map((label) => `wrote ${join(finish, `${label.replace("/", ".")}.png`)}`),
  );
});

test("each hall swatch holds the interior, its classes once each, its recipe and the grey", async () => {
  const built = withHallFinishes(scene.built);
  const { calls } = await runSnapshot(built, scene.workdir);
  const hall = calls.pages.filter((swatch) => swatch.subject.kind === "hall");
  expect(hall.map((swatch) => swatch.label)).toEqual([...HALL_PAGES.keys()]);
  for (const swatch of hall) {
    const recipe = recipeAt(built.level.finishes, swatch.label);
    const classes = HALL_PAGES.get(swatch.label);
    if (recipe === undefined || classes === undefined) {
      throw new Error(`the fixture lacks ${swatch.label}`);
    }
    expect(swatch.subject).toEqual({
      kind: "hall",
      interior: built.prepared.level.metrics.interior,
      classes,
    });
    expect(swatch.recipe).toEqual(recipe);
    expect(swatch.tint).toBe("#808080");
  }
});
