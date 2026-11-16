import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { ExitStatus, Streams } from "./pipeline.js";

/** One file a command writes: its path segments under the work directory and its content. */
export interface OutputFile {
  readonly path: readonly string[];
  readonly data: Uint8Array | string;
}

/**
 * Writes each file under the absolute work directory and announces it on `err` as
 * `wrote <absolute path>`. The first file that cannot be written ends the writes with a file
 * error that names it.
 */
export async function writeFiles(
  workdir: string,
  files: readonly OutputFile[],
  streams: Streams,
): Promise<ExitStatus> {
  for (const file of files) {
    const path = join(workdir, ...file.path);
    try {
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, file.data);
    } catch (error) {
      streams.err(
        `cannot write ${path}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return 3;
    }
    streams.err(`wrote ${path}`);
  }
  return 0;
}
