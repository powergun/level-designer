/**
 * Replace every file of the installed rendering library copy with an independent file of the
 * same bytes. Bun installs a `file:` directory dependency as hard links on Windows, so without
 * this step a write into `node_modules` would change the sibling repository. `just setup` runs
 * it after each install; see @packages/render-gateway/docs/KNOWLEDGE.md.
 */
import { readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const entry = fileURLToPath(import.meta.resolve("@rendering-poc/library/renderer"));
const installed = dirname(dirname(entry));
const files = readdirSync(installed, { recursive: true, withFileTypes: true }).filter((item) =>
  item.isFile(),
);
for (const item of files) {
  const path = join(item.parentPath, item.name);
  const bytes = readFileSync(path);
  // Unlinking first leaves the sibling original untouched; the write creates a new file.
  rmSync(path);
  writeFileSync(path, bytes);
}
console.log(`detached ${files.length} files of ${installed}`);
