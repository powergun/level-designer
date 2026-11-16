import type { BuiltLevel, Report } from "@level-designer/level-pipeline";
import { blockedLines, reportLines } from "../text/index.js";
import type { ExitStatus, Pipeline, Streams } from "./pipeline.js";

/** A step that either continues with its value or ends the command with an exit status. */
export type Step<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly status: ExitStatus };

/**
 * Reads the description at `path` and builds it. A description that cannot be read ends with
 * a file error on `err`; a blocked build prints its error lines on `out` and ends with 2.
 */
export async function readAndBuild(
  path: string,
  pipeline: Pipeline,
  streams: Streams,
): Promise<Step<BuiltLevel>> {
  const read = await pipeline.readInputs(path);
  if (!read.ok) {
    streams.err(`cannot read ${read.path}: ${read.reason}`);
    return { ok: false, status: 3 };
  }
  const outcome = await pipeline.buildLevel(read.inputs);
  if (!outcome.ok) {
    for (const line of blockedLines(outcome.errors)) streams.out(line);
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
