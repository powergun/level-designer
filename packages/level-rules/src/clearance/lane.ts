import { formatLength } from "@level-designer/level-format";
import type { PreparedLevel } from "@level-designer/sec111-gateway";
import type { Finding } from "../finding/index.js";
import { point, under } from "../finding/index.js";
import type { PropFooting } from "../footing/index.js";
import type { PlanRect } from "../plan/index.js";
import { planOf } from "./hall.js";
import type { NamedSpawn } from "./hall.js";
import { staticGrid, withOutlines } from "./lane-grid.js";
import { widestRoutes } from "./lane-width.js";

/** The width a main lane keeps with the dressing, 3 m, the wall gap proven in QA. */
const LANE_WIDTH = 3;

/** The main lane from one minion spawn: its width with the standing footprints, and what it keeps. */
export interface Lane {
  readonly spawn: string;
  readonly width: number;
  readonly keeps: number;
}

/** The lanes with their `lane` findings, in minion spawn order. */
export interface LaneJudgement {
  readonly lanes: readonly Lane[];
  readonly findings: readonly Finding[];
}

/**
 * `lane`: each minion spawn's main lane, measured on the static scene and again with the
 * standing footprints, keeps 3 m with them, or its static width where that is narrower.
 */
export function lane(
  prepared: PreparedLevel,
  obstacles: readonly PlanRect[],
  footing: readonly PropFooting[],
  spawns: readonly NamedSpawn[],
): LaneJudgement {
  const [player, ...minions] = spawns;
  const points = minions.map(planOf);
  const hall = staticGrid(prepared, obstacles);
  const outlines = footing.flatMap((prop) => prop.standing.map((slab) => slab.outline));
  const bare = widestRoutes(hall, planOf(player!), points);
  const dressed =
    outlines.length === 0
      ? bare
      : widestRoutes(withOutlines(hall, outlines), planOf(player!), points);
  const lanes = minions.map((s, i) => ({
    spawn: s.name,
    width: dressed[i]!.width,
    keeps: Math.min(LANE_WIDTH, bare[i]!.width),
  }));
  const findings = lanes.flatMap((l, i): Finding[] => {
    if (!under(l.width, l.keeps)) {
      return [];
    }
    const near = point(dressed[i]!.narrowest);
    const message = `the main lane from the ${l.spawn} minion spawn narrows to ${formatLength(l.width)} m near ${near}; it needs ${formatLength(l.keeps)} m`;
    return [{ rule: "lane", subject: l.spawn, message }];
  });
  return { lanes, findings };
}
