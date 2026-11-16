import type { PreparedLevel } from "@level-designer/sec111-gateway";
import { floorHeightAt } from "@level-designer/sec111-gateway";
import { under } from "../finding/index.js";
import { HANG_HEIGHT } from "../footing/index.js";
import type { PlanPoint, PlanRect } from "../plan/index.js";

/** The minion spawn names, in sec-111's order of its minion spawns. */
const MINION_NAMES = ["+x+z", "-x+z", "+x-z", "-x-z"] as const;

/** A spawn of the prepared level by its name, with its feet position as sec-111 returns it. */
export interface NamedSpawn {
  readonly name: string;
  readonly position: PreparedLevel["spawns"]["player"];
}

/** The player spawn, named `player`, then the minion spawns by their names, in sec-111's order. */
export function namedSpawns(prepared: PreparedLevel): readonly NamedSpawn[] {
  const { player, minions } = prepared.spawns;
  const named = minions.map((position, i) => ({ name: MINION_NAMES[i]!, position }));
  return [{ name: "player", position: player }, ...named];
}

/** The plan point `[x, z]` of a spawn. */
export function planOf(spawn: NamedSpawn): PlanPoint {
  return [spawn.position[0], spawn.position[2]];
}

/**
 * The plan rectangles of the static standing obstacles: the obstacle and enclosure boxes of
 * the prepared body world that start less than 2.17 m above the floor under their centre.
 */
export function staticObstacles(prepared: PreparedLevel): readonly PlanRect[] {
  const boxes = [...prepared.bodies.obstacles, ...prepared.bodies.enclosure];
  return boxes
    .filter((box) => {
      const x = (box.min[0] + box.max[0]) / 2;
      const z = (box.min[2] + box.max[2]) / 2;
      return under(box.min[1] - floorHeightAt(prepared, x, z), HANG_HEIGHT);
    })
    .map((box) => ({ minX: box.min[0], minZ: box.min[2], maxX: box.max[0], maxZ: box.max[2] }));
}
