import { MAX_POINT_LIGHTS } from "@level-designer/level-format";
import { inspectGlb } from "@level-designer/level-glb";
import { judgeLevel, namedSpawns, TRIANGLE_CAP } from "@level-designer/level-rules";
import { BODY_BOX_LIMIT } from "@level-designer/sec111-gateway";
import type { BuiltLevel } from "../sequence/index.js";
import type { Report } from "./report.js";

/** The first-pass budget of slabs, which the report prints and never enforces. */
const BUDGET_SLABS = 800;

/** The first-pass budget of props, which the report prints and never enforces. */
const BUDGET_PROPS = 200;

/**
 * Validates a built level: inspects its GLB, runs every check of `level-rules` and shapes the
 * report. The level is accepted when the report holds no finding.
 */
export async function validateLevel(built: BuiltLevel): Promise<Report> {
  const prepared = built.prepared.level;
  const inspection = inspectGlb(built.glb);
  const judgement = await judgeLevel({
    description: built.description,
    level: built.level,
    inspection,
    baseImages: built.baseImages,
    prepared,
  });
  const { floors, obstacles, enclosure } = prepared.bodies;
  const slabs = built.level.props.reduce((sum, prop) => sum + prop.slabs.length, 0);
  return {
    hall: {
      interior: prepared.metrics.interior,
      floors: prepared.metrics.floorHeights,
      ramp: judgement.ramp,
      spawns: namedSpawns(prepared),
    },
    findings: judgement.findings,
    summary: {
      triangles: { count: inspection.triangles, limit: TRIANGLE_CAP },
      points: { count: built.level.lighting.points.length, limit: MAX_POINT_LIGHTS },
      bodyBoxes: {
        count: floors.length + obstacles.length + enclosure.length,
        limit: BODY_BOX_LIMIT,
      },
      lanes: judgement.lanes,
      slabs: { count: slabs, limit: BUDGET_SLABS },
      props: { count: built.level.props.length, limit: BUDGET_PROPS },
    },
    accepted: judgement.findings.length === 0,
  };
}
