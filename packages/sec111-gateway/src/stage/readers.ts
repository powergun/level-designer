import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { PREPARE_INPUT_FILES } from "../../../../../sec-111/tools/level-prep/src/index.js";

/** The sibling sec-111 repository root. */
const SEC111: string = join(import.meta.dir, "../../../../../sec-111");

/** Read the base stage GLB from the place sec-111's level preparation names. */
export async function readBaseStage(): Promise<Uint8Array> {
  return new Uint8Array(await readFile(join(SEC111, PREPARE_INPUT_FILES.stage)));
}
