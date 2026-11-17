import { expect, test } from "bun:test";
import { relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

/** The package root and the boot watch's page script. */
const PACKAGE = fileURLToPath(new URL("..", import.meta.url));
const WATCH = fileURLToPath(new URL("../page/watch.ts", import.meta.url));

test("the boot watch's browser bundle holds no module outside this package", async () => {
  // An in-memory build: no output directory, so the test writes no file.
  const result = await Bun.build({ entrypoints: [WATCH], target: "browser", metafile: true });
  expect(result.success).toBe(true);
  const inputs = Object.keys(result.metafile?.inputs ?? {});
  expect(inputs.length).toBeGreaterThan(1);
  const outside = inputs.filter((input) => {
    const path = relative(PACKAGE, resolve(input));
    return path.startsWith("..") || path.split(sep).includes("node_modules");
  });
  expect(outside).toEqual([]);
});
