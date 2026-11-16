/**
 * Generate the type half of the destruction gateway: declarations of destruction lib's packages,
 * emitted with the sibling's own compiler settings into the git-ignored `generated/`. The folder
 * is marked CommonJS so NodeNext accepts the sibling's extensionless imports, and each sibling
 * package name gets a types-only stub so the declarations resolve one another. `just setup` and
 * `just lint` run it; see @packages/destruction-gateway/docs/KNOWLEDGE.md.
 */
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const sibling = join(import.meta.dir, "../../../destruction-poc");
const out = join(import.meta.dir, "generated");
const root = join(import.meta.dir, "../..");

/** The name and single source entry of a sibling package, when its manifest has both. */
function readEntry(dir: string): { readonly name: string; readonly entry: string } | null {
  const manifest: unknown = JSON.parse(
    readFileSync(join(sibling, "packages", dir, "package.json"), "utf8"),
  );
  if (typeof manifest !== "object" || manifest === null) return null;
  if (!("name" in manifest) || !("exports" in manifest)) return null;
  const { name, exports } = manifest;
  return typeof name === "string" && typeof exports === "string" ? { name, entry: exports } : null;
}

rmSync(out, { recursive: true, force: true });
const emit = ["-p", join(sibling, "tsconfig.json"), "--noEmit", "false", "--declaration"];
const place = ["--emitDeclarationOnly", "--outDir", out, "--rootDir", join(sibling, "packages")];
const tsc = Bun.spawnSync([process.execPath, "x", "--no-install", "tsc", ...emit, ...place], {
  cwd: root,
  stdout: "inherit",
  stderr: "inherit",
});
if (tsc.exitCode !== 0) throw new Error(`declaration emit failed with exit code ${tsc.exitCode}`);
writeFileSync(join(out, "package.json"), '{ "type": "commonjs" }\n');

for (const dir of readdirSync(join(sibling, "packages"))) {
  const found = readEntry(dir);
  if (found === null) continue;
  const stub = join(out, "node_modules", found.name);
  const types = join(out, dir, found.entry.replace(/\.ts$/, ".d.ts"));
  mkdirSync(stub, { recursive: true });
  const target = relative(stub, types).replaceAll("\\", "/");
  writeFileSync(join(stub, "package.json"), JSON.stringify({ name: found.name, types: target }));
}
console.log(`emitted destruction lib declarations into ${relative(root, out)}`);
