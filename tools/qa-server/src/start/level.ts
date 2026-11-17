import type {
  BuildError,
  BuildInputs,
  BuildOutcome,
  BuiltLevel,
  ReadOutcome,
  Report,
} from "@level-designer/level-pipeline";
import type { StartLine, StepOutcome } from "./step.js";
import { failure, messageOf } from "./step.js";

/**
 * The level pipeline's read, build and validation with its committed description, as the
 * program file loads them with a dynamic import; tests inject a fake.
 */
export interface Pipeline {
  readonly COMMITTED_DESCRIPTION: string;
  readonly readInputs: (path: string) => Promise<ReadOutcome>;
  readonly buildLevel: (inputs: BuildInputs) => Promise<BuildOutcome>;
  readonly validateLevel: (built: BuiltLevel) => Promise<Report>;
}

/** What the server serves: a built level with its report, or a blocked build's errors. */
export type LevelState =
  | { readonly kind: "built"; readonly built: BuiltLevel; readonly report: Report }
  | { readonly kind: "blocked"; readonly errors: readonly BuildError[] };

/** The lines of a blocked build: the count, then one line per error. */
function blockedLines(errors: readonly BuildError[]): StartLine[] {
  const count: StartLine = { level: "warn", text: `build blocked: ${errors.length} errors` };
  return [
    count,
    ...errors.map(
      (e): StartLine => ({ level: "warn", text: `build error ${e.rule} ${e.path}: ${e.message}` }),
    ),
  ];
}

/** The lines of a judged level: its name, hash and verdict, then one line per finding. */
function verdictLines(built: BuiltLevel, report: Report): StartLine[] {
  const level = `level ${built.description.name} ${built.hash}`;
  if (report.accepted) return [{ level: "info", text: `${level} accepted` }];
  const head: StartLine = {
    level: "warn",
    text: `${level} rejected: ${report.findings.length} findings`,
  };
  return [
    head,
    ...report.findings.map(
      (f): StartLine => ({ level: "warn", text: `finding ${f.rule} ${f.subject}: ${f.message}` }),
    ),
  ];
}

/** Builds and judges the read inputs; a throw names the phase that raised it. */
async function buildAndJudge(
  pipeline: Pipeline,
  inputs: BuildInputs,
  lines: StartLine[],
): Promise<StepOutcome<LevelState>> {
  let phase = "build";
  try {
    const outcome = await pipeline.buildLevel(inputs);
    if (!outcome.ok) {
      lines.push(...blockedLines(outcome.errors));
      return { ok: true, lines, value: { kind: "blocked", errors: outcome.errors } };
    }
    phase = "validation";
    const report = await pipeline.validateLevel(outcome.built);
    lines.push(...verdictLines(outcome.built, report));
    return { ok: true, lines, value: { kind: "built", built: outcome.built, report } };
  } catch (error) {
    return {
      ok: false,
      lines,
      failure: failure(`the level step failed at ${phase}: ${messageOf(error)}`, error),
    };
  }
}

/**
 * Loads the pipeline, reads the committed description and the base stage, then builds and
 * validates. A blocked build and a rejected level are outcomes; a loader that rejects, an
 * unreadable description and any throw are failures.
 */
export async function buildForQa(load: () => Promise<Pipeline>): Promise<StepOutcome<LevelState>> {
  const lines: StartLine[] = [];
  let pipeline: Pipeline;
  try {
    pipeline = await load();
  } catch (error) {
    return {
      ok: false,
      lines,
      failure: failure(`the level pipeline failed to load: ${messageOf(error)}`, error),
    };
  }
  const path = pipeline.COMMITTED_DESCRIPTION;
  lines.push({ level: "info", text: `description ${path}` });
  let read: ReadOutcome;
  try {
    read = await pipeline.readInputs(path);
  } catch (error) {
    return {
      ok: false,
      lines,
      failure: failure(`the level step failed at read: ${messageOf(error)}`, error),
    };
  }
  if (!read.ok) {
    return {
      ok: false,
      lines,
      failure: failure(`cannot read the description ${read.path}: ${read.reason}`),
    };
  }
  return buildAndJudge(pipeline, read.inputs, lines);
}
