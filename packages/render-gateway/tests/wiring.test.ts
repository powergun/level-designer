import { expect, test } from "bun:test";
import { join } from "node:path";

test("a browser entry naming every re-export bundles with one three.js core", async () => {
  const browser = { target: "browser", metafile: true } as const;
  const built = await Bun.build({
    entrypoints: [join(import.meta.dir, "browser-entry.ts")],
    ...browser,
  });
  const cores = Object.keys(built.metafile?.inputs ?? {}).filter((path) =>
    /[\\/]three[\\/]build[\\/]three\.core\.js$/.test(path),
  );
  expect(cores).toHaveLength(1);
});
