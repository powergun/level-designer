import { expect, test } from "bun:test";
import { join } from "node:path";

test("the page bundle of the main entry holds one Rapier copy and no level preparation", async () => {
  const entry = join(import.meta.dir, "../src/index.ts");
  const { metafile } = await Bun.build({ entrypoints: [entry], target: "browser", metafile: true });
  const modules = Object.keys(metafile?.inputs ?? {});
  const rapier = new Set(
    modules.flatMap((path) => /^.*rapier3d-simd-compat@[^\\/]+/.exec(path) ?? []),
  );
  expect(rapier.size).toBe(1);
  expect(modules.filter((path) => /[\\/]tools[\\/]level-prep[\\/]/.test(path))).toEqual([]);
});
