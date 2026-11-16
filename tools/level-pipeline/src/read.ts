import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { readBaseStage } from "@level-designer/sec111-gateway/stage";
import type { BuildInputs } from "./sequence/index.js";

/** The committed level description, the default input of every command. */
export const COMMITTED_DESCRIPTION: string = join(
  import.meta.dir,
  "../../../levels/dark-factory.json",
);

/** The read's outcome: the build inputs, or the description file it cannot read and why. */
export type ReadOutcome =
  | { readonly ok: true; readonly inputs: BuildInputs }
  | { readonly ok: false; readonly path: string; readonly reason: string };

/**
 * Reads the description file at `path` and the base stage. A description file that cannot be
 * read is an outcome; a missing base stage is a broken sec-111 install and throws.
 */
export async function readInputs(path: string): Promise<ReadOutcome> {
  const [description, baseStage] = await Promise.all([
    readFile(path).then(
      (bytes) => new Uint8Array(bytes),
      (error: unknown) => (error instanceof Error ? error : new Error(String(error))),
    ),
    readBaseStage(),
  ]);
  if (description instanceof Error) return { ok: false, path, reason: description.message };
  return { ok: true, inputs: { description, baseStage } };
}
