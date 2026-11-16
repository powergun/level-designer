import { expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

/** This repository's root. */
const ROOT = join(import.meta.dir, "../../..");

/** The rendering library as the sibling repository holds it. */
const SIBLING = join(ROOT, "../rendering-poc/packages/library");

/** The rendering library as this repository installed it. */
const INSTALLED = dirname(
  dirname(fileURLToPath(import.meta.resolve("@rendering-poc/library/renderer"))),
);

/** A file's identity: device and 64-bit file index, exact as bigints. */
function identity(path: string): string {
  const stat = statSync(path, { bigint: true });
  return `${stat.dev}:${stat.ino}`;
}

/** Every file of the installed copy, relative to it and forward-slashed. */
function installedFiles(): string[] {
  const entries = readdirSync(INSTALLED, { recursive: true, withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => relative(INSTALLED, join(entry.parentPath, entry.name)).replaceAll("\\", "/"));
}

/** The sibling's manifest and TypeScript sources, which every install must carry. */
function requiredFiles(): string[] {
  const sources = [...new Bun.Glob("src/**/*.ts").scanSync({ cwd: SIBLING })];
  return ["package.json", ...sources.map((path) => path.replaceAll("\\", "/"))];
}

/** The `three` version a manifest names under one of its sections. */
function threeOf(manifestPath: string, section: "dependencies" | "overrides"): unknown {
  const manifest: unknown = JSON.parse(readFileSync(manifestPath, "utf8"));
  return Reflect.get(Object(Reflect.get(Object(manifest), section)), "three");
}

test("the installed library copy equals the sibling source (rerun just setup if not)", () => {
  const installed = installedFiles();
  const required = requiredFiles();
  expect(required.length).toBeGreaterThan(1);
  const notInstalled = required.filter((file) => !installed.includes(file));
  const orphans = installed.filter((file) => !existsSync(join(SIBLING, file)));
  const differing = installed.filter(
    (file) =>
      !orphans.includes(file) &&
      !readFileSync(join(INSTALLED, file)).equals(readFileSync(join(SIBLING, file))),
  );
  expect({ notInstalled, orphans, differing }).toEqual({
    notInstalled: [],
    orphans: [],
    differing: [],
  });
});

test("no installed library file is a hard link to its sibling original", () => {
  const linked = installedFiles().filter((file) => {
    const original = join(SIBLING, file);
    return existsSync(original) && identity(original) === identity(join(INSTALLED, file));
  });
  const fix = "run `just setup`, which detaches the copy after installing";
  expect({ linked, fix }).toEqual({ linked: [], fix });
});

test("the root three override pins the version the library declares", () => {
  const declared = threeOf(join(SIBLING, "package.json"), "dependencies");
  expect(typeof declared).toBe("string");
  expect(threeOf(join(ROOT, "package.json"), "overrides")).toBe(declared);
});
