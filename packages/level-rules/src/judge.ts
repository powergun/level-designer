import type { Description, Level } from "@level-designer/level-format";
import type { GlbInspection } from "@level-designer/level-glb";
import type { PreparedLevel } from "@level-designer/sec111-gateway";
import { footprints, gap, lane, namedSpawns, spawn, staticObstacles } from "./clearance/index.js";
import type { Lane } from "./clearance/index.js";
import type { Finding } from "./finding/index.js";
import { footings } from "./footing/index.js";
import { lightFloor, lightInside, material, texture, triangles } from "./owner/index.js";
import {
  floor,
  interior,
  lowTop,
  overlap,
  ramp,
  rampZone,
  seal,
  support,
} from "./placement/index.js";
import type { RampZone } from "./placement/index.js";
import { destructible, proxies } from "./proof/index.js";
import { scale } from "./scale.js";

/**
 * The five facts of a built level that the rules judge: the typed description, the typed
 * level, the inspection of the level GLB, the base stage's image count and the prepared static
 * level. From the description the rules read only `base.scale`, the seals and each prop's `at`.
 */
export interface LevelFacts {
  readonly description: Description;
  readonly level: Level;
  readonly inspection: GlbInspection;
  readonly baseImages: number;
  readonly prepared: PreparedLevel;
}

/**
 * The validator's judgement: every finding in rule order and, within a rule, in description
 * order; the ramp zone; and each minion spawn's main lane with the width it keeps.
 */
export interface Judgement {
  readonly findings: readonly Finding[];
  readonly ramp: RampZone | null;
  readonly lanes: readonly Lane[];
}

/**
 * Judges a built level by every check of the level format. It is asynchronous because
 * destruction lib's Rapier backend loads that way; see @packages/level-rules/docs/KNOWLEDGE.md.
 */
export async function judgeLevel(facts: LevelFacts): Promise<Judgement> {
  const { description, level, inspection, prepared } = facts;
  const footing = footings(description, level, prepared);
  const zone = rampZone(prepared);
  const obstacles = staticObstacles(prepared);
  const spawns = namedSpawns(prepared);
  const lanes = lane(prepared, obstacles, footing, spawns);
  const standing = footprints(footing);
  const points = level.lighting.points;
  const findings = [
    ...scale(description.base.scale, prepared),
    ...triangles(inspection),
    ...lightInside(points, prepared),
    ...lightFloor(points, prepared),
    ...material(inspection),
    ...texture(inspection, facts.baseImages),
    ...interior(footing, prepared),
    ...support(footing),
    ...floor(footing),
    ...ramp(footing, zone),
    ...lowTop(footing),
    ...overlap(footing),
    ...seal(description.seals, prepared),
    ...gap(standing, obstacles),
    ...spawn(standing, spawns),
    ...lanes.findings,
    ...destructible(level),
    ...(await proxies(level)),
  ];
  return { findings, ramp: zone, lanes: lanes.lanes };
}
