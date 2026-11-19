import type { Description, Level, SlabBox, Vec3 } from "@level-designer/level-format";
import { LENGTH_SLACK, slabBox } from "@level-designer/level-format";
import type { PreparedLevel } from "@level-designer/sec111-gateway";
import { floorHeightAt } from "@level-designer/sec111-gateway";
import { over, under } from "../finding/index.js";
import { outline } from "../plan/index.js";
import type { Polygon } from "../plan/index.js";

/**
 * The height of the standing band, 2.17 m: a part that starts lower stands, and one that starts
 * at it or higher hangs. sec-111's player capsule passes under an underside at this height.
 */
export const HANG_HEIGHT = 2.17;

/** How near the floor under `at` a standing prop's lowest point lies, 0.01 m. */
const STAND_TOLERANCE = 0.01;

/** A standing slab: its slab index, its box, its plan outline and the floors under it. */
interface StandingSlab {
  readonly index: number;
  readonly box: SlabBox;
  readonly outline: Polygon;
  readonly lowFloor: number;
  readonly highFloor: number;
}

/**
 * How one prop meets the floor: the floor under `at`, the highest floor under its slabs, its
 * lowest point, the box of every slab, whether it stands or hangs, and its standing slabs,
 * whose outlines make its footprint.
 */
export interface PropFooting {
  readonly id: string;
  readonly floor: number;
  readonly highestFloor: number;
  readonly lowest: number;
  readonly boxes: readonly SlabBox[];
  readonly stands: boolean;
  readonly hangs: boolean;
  readonly standing: readonly StandingSlab[];
}

/** The floor under a corner, read 0.05 mm toward the box centre in plan. */
function floorUnder(prepared: PreparedLevel, corner: Vec3, center: Vec3): number {
  const dx = center[0] - corner[0];
  const dz = center[2] - corner[2];
  const length = Math.hypot(dx, dz);
  const step = length === 0 ? 0 : LENGTH_SLACK / length;
  return floorHeightAt(prepared, corner[0] + dx * step, corner[2] + dz * step);
}

/** The lowest and highest floor under a box's corners, each read 0.05 mm toward its centre. */
export function floorsUnder(prepared: PreparedLevel, box: SlabBox): readonly [number, number] {
  const floors = box.corners.map((corner) => floorUnder(prepared, corner, box.center));
  return [Math.min(...floors), Math.max(...floors)];
}

/** The lowest corner height of a box. */
function bottom(box: SlabBox): number {
  return Math.min(...box.corners.map((corner) => corner[1]));
}

/** The footing of one prop from its slab boxes and the plan point `at` of its origin. */
function footingOf(
  prepared: PreparedLevel,
  id: string,
  boxes: readonly SlabBox[],
  at: readonly [number, number],
): PropFooting {
  const floor = floorHeightAt(prepared, at[0], at[1]);
  const floors = boxes.map((box) => floorsUnder(prepared, box));
  const lowest = Math.min(...boxes.map(bottom));
  const highestFloor = Math.max(...floors.map((pair) => pair[1]));
  const stands = !over(Math.abs(lowest - floor), STAND_TOLERANCE);
  const hangs = !under(lowest - highestFloor, HANG_HEIGHT);
  const standing = boxes.flatMap((box, index): StandingSlab[] => {
    const [lowFloor, highFloor] = floors[index]!;
    return stands && under(bottom(box) - floor, HANG_HEIGHT)
      ? [{ index, box, outline: outline(box), lowFloor, highFloor }]
      : [];
  });
  return { id, floor, highestFloor, lowest, boxes, stands, hangs, standing };
}

/** The footing of every prop; the level lists its props in description order. */
export function footings(
  description: Description,
  level: Level,
  prepared: PreparedLevel,
): readonly PropFooting[] {
  return level.props.map((prop, i) =>
    footingOf(prepared, prop.id, prop.slabs.map(slabBox), description.props[i]!.at),
  );
}
