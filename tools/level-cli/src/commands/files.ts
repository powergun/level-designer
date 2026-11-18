import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { ExitStatus, Streams } from "./pipeline.js";

/** One file a command writes: its path segments under the work directory and its content. */
export interface OutputFile {
  readonly path: readonly string[];
  readonly data: Uint8Array | string;
}

/** The file error line of `path`, which names it and the reason. */
function cannotWrite(path: string, error: unknown): string {
  return `cannot write ${path}: ${error instanceof Error ? error.message : String(error)}`;
}

/**
 * Removes the directory at the path segments under the work directory with everything in it,
 * so a command's output there holds only what it writes next. A missing directory is fine;
 * a removal that fails ends with a file error that names it.
 */
export async function clearDirectory(
  workdir: string,
  segments: readonly string[],
  streams: Streams,
): Promise<ExitStatus> {
  const path = join(workdir, ...segments);
  try {
    await rm(path, { recursive: true, force: true });
  } catch (error) {
    streams.err(cannotWrite(path, error));
    return 3;
  }
  return 0;
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
      streams.err(cannotWrite(path, error));
      return 3;
    }
    streams.err(`wrote ${path}`);
  }
  return 0;
}
