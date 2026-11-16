import { formatLength } from "@level-designer/level-format";
import { counted } from "./count.js";
import type { Report } from "@level-designer/level-pipeline";

/** A point as the tool prints and reads it: its lengths joined by commas, `x,y,z`. */
function pointText(point: readonly number[]): string {
  return point.map(formatLength).join(",");
}

/** The hall fact lines: `interior`, `floors`, `ramp` and one `spawn` per spawn. */
function hallLines(hall: Report["hall"]): readonly string[] {
  const ramp = hall.ramp === null ? ["none"] : [hall.ramp.from, hall.ramp.to].map(formatLength);
  return [
    ["interior", pointText(hall.interior.min), pointText(hall.interior.max)].join("\t"),
    ["floors", ...hall.floors.map(formatLength)].join("\t"),
    ["ramp", ...ramp].join("\t"),
    ...hall.spawns.map((spawn) => ["spawn", spawn.name, pointText(spawn.position)].join("\t")),
  ];
}

/** One summary line: the fact's name, then its count beside its cap, limit or budget. */
function measure(name: string, { count, limit }: Report["summary"]["triangles"]): string {
  return [name, String(count), String(limit)].join("\t");
}

/** The summary lines, each count or width beside its cap, budget or kept width. */
function summaryLines(summary: Report["summary"]): readonly string[] {
  return [
    measure("triangles", summary.triangles),
    measure("points", summary.points),
    measure("body-boxes", summary.bodyBoxes),
    ...summary.lanes.map((lane) =>
      ["lane", lane.spawn, formatLength(lane.width), formatLength(lane.keeps)].join("\t"),
    ),
    measure("slabs", summary.slabs),
    measure("props", summary.props),
  ];
}

/**
 * The printed report of the level format: one tab-separated line per fact, each starting with
 * the fact's name; the hall facts, one line per finding, the summary, then the verdict.
 */
export function reportLines(report: Report): readonly string[] {
  const findings = report.findings.map((finding) =>
    [finding.rule, finding.subject, finding.message].join("\t"),
  );
  const verdict = report.accepted
    ? "accepted"
    : `rejected: ${counted(report.findings.length, "finding")}`;
  return [...hallLines(report.hall), ...findings, ...summaryLines(report.summary), verdict];
}
