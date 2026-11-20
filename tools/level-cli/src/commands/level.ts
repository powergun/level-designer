import type { BuildError, BuildInputs, BuiltLevel, Report } from "@level-designer/level-pipeline";
import { blockedLines, reportLines } from "../text/index.js";
import type { ExitStatus, Pipeline, Streams } from "./pipeline.js";

/** A step that either continues with its value or ends the command with an exit status. */
export type Step<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly status: ExitStatus };

/** Read the two build inputs or report the file error on the error stream. */
export async function load(
  path: string,
  pipeline: Pipeline,
  streams: Streams,
): Promise<Step<BuildInputs>> {
  const read = await pipeline.readInputs(path);
  if (!read.ok) {
    streams.err(`cannot read ${read.path}: ${read.reason}`);
    return { ok: false, status: 3 };
  }
  return { ok: true, value: read.inputs };
}

/** Print the build problems from any step through placement or meshing. */
export function reportBlocked(errors: readonly BuildError[], streams: Streams): void {
  for (const line of blockedLines(errors)) streams.out(line);
}

/** Build the level pair in memory and report file errors or a blocked build. */
export async function readAndBuild(
  path: string,
  pipeline: Pipeline,
  streams: Streams,
): Promise<Step<BuiltLevel>> {
  const read = await load(path, pipeline, streams);
  if (!read.ok) return read;
  const outcome = await pipeline.buildLevel(read.value);
  if (!outcome.ok) {
    reportBlocked(outcome.errors, streams);
    return { ok: false, status: 2 };
  }
  return { ok: true, value: outcome.built };
}

/** Reads, builds and validates the description, and prints the report on `out`. */
export async function judge(
  path: string,
  pipeline: Pipeline,
  streams: Streams,
): Promise<Step<{ readonly built: BuiltLevel; readonly report: Report }>> {
  const built = await readAndBuild(path, pipeline, streams);
  if (!built.ok) return built;
  const report = await pipeline.validateLevel(built.value);
  for (const line of reportLines(report)) streams.out(line);
  return { ok: true, value: { built: built.value, report } };
}
