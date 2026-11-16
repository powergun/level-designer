import type { Finding, Lane, NamedSpawn, RampZone } from "@level-designer/level-rules";
import type { PreparedLevel } from "@level-designer/sec111-gateway";

/** The hall facts of the prepared static level, which open the report. */
interface HallFacts {
  readonly interior: PreparedLevel["metrics"]["interior"];
  readonly floors: PreparedLevel["metrics"]["floorHeights"];
  readonly ramp: RampZone | null;
  readonly spawns: readonly NamedSpawn[];
}

/** A count beside the cap, limit or budget it is compared with. */
interface Measure {
  readonly count: number;
  readonly limit: number;
}

/**
 * The summary: triangles against the triangle cap, point lights against the point-light cap,
 * body boxes against sec-111's limit, each lane beside the width it keeps, and slabs and props
 * against the first-pass budget, which never rejects.
 */
interface Summary {
  readonly triangles: Measure;
  readonly points: Measure;
  readonly bodyBoxes: Measure;
  readonly lanes: readonly Lane[];
  readonly slabs: Measure;
  readonly props: Measure;
}

/** The validator's report: the hall facts, the findings, the summary and the verdict. */
export interface Report {
  readonly hall: HallFacts;
  readonly findings: readonly Finding[];
  readonly summary: Summary;
  readonly accepted: boolean;
}
