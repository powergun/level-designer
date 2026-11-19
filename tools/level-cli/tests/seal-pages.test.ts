import { expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { recipeAt } from "@level-designer/level-format";
import type { FinishSwatch } from "@level-designer/snapshot-render";
import { BOX_PAGES } from "./box-level.js";
import { pageBytes, runSnapshot, sceneForEachTest } from "./fakes.js";
import { HALL_PAGES } from "./hall-level.js";
import { SEAL_PAGES, SEALS, withSeals } from "./seal-level.js";

// Owner: level-cli's `snapshot` seal pages: one swatch per finish path that only a painted
// seal names, the seal drawn as a slab of its longer plan extent, its height and its shorter
// extent, on the path's largest side, written between the box pages and the hall pages.

const scene = sceneForEachTest();

/** The page file of a finish path under the scene's finish directory. */
function pageOf(label: string): string {
  return join(scene.workdir, "snapshots", "finish", `${label.replace("/", ".")}.png`);
}

/** The seal pages of one `snapshot` run on the seal fixture, after a successful run. */
async function sealPages(): Promise<ReadonlyMap<string, FinishSwatch>> {
  const { status, calls } = await runSnapshot(withSeals(scene.built), scene.workdir);
  expect(status).toBe(0);
  const pages = calls.pages.filter((swatch) => swatch.label.startsWith("cladding/"));
  expect(pages).toHaveLength(SEAL_PAGES.length);
  return new Map(pages.map((swatch) => [swatch.label, swatch]));
}

/** The swatch of the page that `seal`'s path holds. */
function pageFor(
  pages: ReadonlyMap<string, FinishSwatch>,
  seal: { readonly finish: string },
): FinishSwatch {
  const page = pages.get(seal.finish);
  if (page === undefined) throw new Error(`no page for ${seal.finish}`);
  return page;
}

test("snapshot announces the slab, box, seal, then hall pages", async () => {
  const { status, output, calls } = await runSnapshot(withSeals(scene.built), scene.workdir);
  expect(status).toBe(0);
  const seals = SEAL_PAGES.map((page) => page.seal.finish);
  const boxes = BOX_PAGES.map((box) => box.finish);
  const labels = ["timber/crate", "steel/trim", ...boxes, ...seals, ...HALL_PAGES.keys()];
  expect(calls.pages.map((swatch) => swatch.label)).toEqual(labels);
  const finish = join(scene.workdir, "snapshots", "finish");
  const written = output.err.filter((line) => line.startsWith(`wrote ${finish}`));
  expect(written).toEqual(labels.map((label) => `wrote ${pageOf(label)}`));
  for (const label of seals) {
    expect([...(await readFile(pageOf(label)))]).toEqual([...pageBytes(label)]);
  }
});

test("each seal page takes its seal's colour, seed, wear and recipe", async () => {
  const pages = await sealPages();
  const { finishes } = withSeals(scene.built).level;
  for (const { seal, size } of SEAL_PAGES) {
    const recipe = recipeAt(finishes, seal.finish);
    if (recipe === undefined) throw new Error(`the fixture's table lacks ${seal.finish}`);
    expect(pageFor(pages, seal)).toEqual({
      label: seal.finish,
      recipe,
      tint: seal.color,
      subject: { kind: "slab", size, seed: seal.seed, wear: seal.wear },
    });
  }
});

/** Proves that `seal`'s path stands on `seal` itself, drawn as a slab of `size`. */
function expectStandsOn(
  pages: ReadonlyMap<string, FinishSwatch>,
  seal: { readonly finish: string; readonly color: string },
  size: readonly number[],
): void {
  expect(pageFor(pages, seal)).toMatchObject({ tint: seal.color, subject: { size } });
}

test("a seal longer along Z gives that extent as its width, also by one grid step", async () => {
  const pages = await sealPages();
  expectStandsOn(pages, SEALS.wallLongZ, [6, 3, 0.2]);
  expectStandsOn(pages, SEALS.deepByStep, [2.0001, 1, 2]);
});

test("a seal longer along X gives X as its width, and a square one either", async () => {
  const pages = await sealPages();
  expectStandsOn(pages, SEALS.gateLongX, [6, 3, 0.2]);
  expectStandsOn(pages, SEALS.square, [2, 1, 2]);
});

test("the largest side takes a path, a tie keeps the first, and a grid step taller wins", async () => {
  const pages = await sealPages();
  expect(pageFor(pages, SEALS.wallShortX).tint).toBe(SEALS.wallLongZ.color);
  expect(pageFor(pages, SEALS.gateTieZ).tint).toBe(SEALS.gateLongX.color);
  expect(pageFor(pages, SEALS.doorFirst).tint).toBe(SEALS.doorTaller.color);
});

test("the thickness does not count: a thin seal's larger side beats a thick one", async () => {
  const pages = await sealPages();
  expectStandsOn(pages, SEALS.slimThin, [5, 2, 0.1]);
});

test("a slab's, a static object's and a hall's path keep their pages; a flat seal has none", async () => {
  const { calls } = await runSnapshot(withSeals(scene.built), scene.workdir);
  const taken = [SEALS.slabPath, SEALS.staticPath, SEALS.hallPath];
  for (const seal of taken) {
    const pages = calls.pages.filter((swatch) => swatch.label === seal.finish);
    expect(pages).toHaveLength(1);
    expect(pages[0]?.tint).not.toBe(seal.color);
  }
  const sealTints = new Set(Object.values(SEALS).map((seal) => seal.color));
  const kept = SEAL_PAGES.map((page) => page.seal.color);
  const fromSeals = calls.pages.filter((swatch) => sealTints.has(swatch.tint));
  expect(fromSeals.map((swatch) => swatch.tint)).toEqual(kept);
});
