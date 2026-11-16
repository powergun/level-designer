import type { BuiltLevel } from "@level-designer/level-pipeline";
import { HANG_HEIGHT } from "@level-designer/level-rules";
import { floorHeightAt, GAME_VALUES, PLAYER_BODY } from "@level-designer/sec111-gateway";
import type { SnapshotInput } from "@level-designer/snapshot-render";
import type { CustomView } from "../command-line/index.js";

/**
 * The heights above each floor that the section tiles mark: `level-rules`' hang height, where
 * a hanging prop starts. The tool holds no height of its own.
 */
const CLEARANCES: readonly number[] = [HANG_HEIGHT];

/**
 * The snapshot input of a built level: the hall facts of its prepared static level, each
 * prop's origin on the floor under its `at`, the game's lens, and the eye and figure heights
 * of the player's body.
 */
export function snapshotInput(built: BuiltLevel, custom: CustomView | undefined): SnapshotInput {
  const prepared = built.prepared.level;
  const props = built.description.props.map(({ at: [x, z] }) => {
    const point: readonly [number, number, number] = [x, floorHeightAt(prepared, x, z), z];
    return point;
  });
  const input: SnapshotInput = {
    interior: prepared.metrics.interior,
    floors: prepared.metrics.floorHeights,
    clearances: CLEARANCES,
    playerSpawn: prepared.spawns.player,
    minionSpawns: prepared.spawns.minions,
    props,
    lens: GAME_VALUES.lens,
    eyeHeight: PLAYER_BODY.height * GAME_VALUES.player.eyeRatio,
    figureHeight: PLAYER_BODY.height,
  };
  return custom === undefined ? input : { ...input, custom };
}
