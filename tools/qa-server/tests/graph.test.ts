import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative } from "node:path";

/** The repository root, which every statically loaded module of the program file lies under. */
const REPOSITORY = join(import.meta.dir, "../../..");

/** The static imports of one source file: import and re-export statements, no dynamic import. */
function staticImports(file: string): string[] {
  const loader = file.endsWith(".ts") ? "ts" : "js";
  const scanned = new Bun.Transpiler({ loader }).scan(readFileSync(file, "utf8"));
  return scanned.imports
    .filter((entry) => entry.kind !== "dynamic-import")
    .map((entry) => entry.path);
}

/** Every module Bun loads before the program's first statement runs, by its resolved path. */
function staticGraph(entry: string): Set<string> {
  const reached = new Set<string>();
  const pending = [entry];
  for (let file = pending.pop(); file !== undefined; file = pending.pop()) {
    if (reached.has(file)) continue;
    reached.add(file);
    for (const specifier of staticImports(file)) {
      if (specifier.startsWith("node:") || specifier === "bun") continue;
      pending.push(Bun.resolveSync(specifier, dirname(file)));
    }
  }
  return reached;
}

test("the program file loads no sibling repository before the run log opens", () => {
  const graph = staticGraph(join(import.meta.dir, "../main.ts"));
  // On Windows, a file on another drive has no relative path: `relative` returns it whole.
  const outside = [...graph].filter((file) => {
    const path = relative(REPOSITORY, file);
    return path.startsWith("..") || isAbsolute(path);
  });
  expect(graph.size).toBeGreaterThan(10);
  expect(outside).toEqual([]);
});
