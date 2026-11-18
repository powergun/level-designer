import type { BuiltLevel } from "@level-designer/level-pipeline";
import { listKinds } from "@level-designer/prop-kit";
import type { FinishSwatch } from "@level-designer/snapshot-render";
import type { CustomView } from "../command-line/index.js";
import { kindLines } from "../text/index.js";
import type { OutputFile } from "./files.js";
import { clearDirectory, writeFiles } from "./files.js";
import { finishSwatches } from "./finish-swatches.js";
import { hallSwatches } from "./hall-swatches.js";
import { judge, readAndBuild } from "./level.js";
import type { ExitStatus, Pipeline, Streams } from "./pipeline.js";
import { snapshotInput } from "./snapshot-input.js";

/** The line that says why a writing command wrote nothing after a blocked build. */
const BLOCKED = "nothing written: the build is blocked";

/** `kinds`: prints every prop kind with its parameters; reads no description. */
export function kinds(streams: Streams): ExitStatus {
  for (const line of kindLines(listKinds())) streams.out(line);
  return 0;
}

/** `validate`: builds in memory and prints the report or the blocked build; writes nothing. */
export async function validate(
  description: string,
  pipeline: Pipeline,
  streams: Streams,
): Promise<ExitStatus> {
  const judged = await judge(description, pipeline, streams);
  if (!judged.ok) return judged.status;
  return judged.value.report.accepted ? 0 : 2;
}

/**
 * `build`: validates, then writes `level/<name>.glb` and `level/<name>.json` under the work
 * directory only when the validator accepts.
 */
export async function build(
  description: string,
  workdir: string,
  pipeline: Pipeline,
  streams: Streams,
): Promise<ExitStatus> {
  const judged = await judge(description, pipeline, streams);
  if (!judged.ok) {
    if (judged.status === 2) streams.err(BLOCKED);
    return judged.status;
  }
  const { built, report } = judged.value;
  if (!report.accepted) {
    streams.err("nothing written: the level is rejected");
    return 2;
  }
  const name = built.description.name;
  return writeFiles(
    workdir,
    [
      { path: ["level", `${name}.glb`], data: built.glb },
      { path: ["level", `${name}.json`], data: built.json },
    ],
    streams,
  );
}

/** The path segments of the finish pages' directory under the work directory. */
const FINISH_PAGES = ["snapshots", "finish"] as const;

/**
 * The swatch of every finish page: the slab pages, then the hall pages. A path that both a
 * slab and a base override name gets its hall page only, so each file is written once.
 */
function pageSwatches(built: BuiltLevel): readonly FinishSwatch[] {
  const hall = hallSwatches(built);
  const hallPaths = new Set(hall.map((swatch) => swatch.label));
  const slabs = finishSwatches(built.level).filter((swatch) => !hallPaths.has(swatch.label));
  return [...slabs, ...hall];
}

/**
 * `snapshot`: builds without judging and writes `snapshots/plan.png`, `section.png` and
 * `view.png` under the work directory, `custom.png` for a custom view, and one page per
 * finish path in use, a slab's or a hall finish's, as `snapshots/finish/<finish>.<role>.png`,
 * into a directory it first empties.
 */
export async function snapshot(
  description: string,
  workdir: string,
  custom: CustomView | undefined,
  pipeline: Pipeline,
  streams: Streams,
): Promise<ExitStatus> {
  const built = await readAndBuild(description, pipeline, streams);
  if (!built.ok) {
    if (built.status === 2) streams.err(BLOCKED);
    return built.status;
  }
  const cleared = await clearDirectory(workdir, FINISH_PAGES, streams);
  if (cleared !== 0) return cleared;
  const sheets = pipeline.renderSheets(built.value.glb, snapshotInput(built.value, custom));
  const files: OutputFile[] = [
    { path: ["snapshots", "plan.png"], data: sheets.plan },
    { path: ["snapshots", "section.png"], data: sheets.section },
    { path: ["snapshots", "view.png"], data: sheets.view },
  ];
  if (sheets.custom !== undefined) {
    files.push({ path: ["snapshots", "custom.png"], data: sheets.custom });
  }
  for (const swatch of pageSwatches(built.value)) {
    const name = `${swatch.label.replace("/", ".")}.png`;
    files.push({ path: [...FINISH_PAGES, name], data: pipeline.renderFinishSheet(swatch) });
  }
  return writeFiles(workdir, files, streams);
}
