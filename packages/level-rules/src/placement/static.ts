import { formatLength, staticClass } from "@level-designer/level-format";
import type { SlabBox, StaticObject } from "@level-designer/level-format";
import type { PreparedLevel } from "@level-designer/sec111-gateway";
import type { Finding } from "../finding/index.js";
import { over, under } from "../finding/index.js";
import { floorsUnder, HANG_HEIGHT } from "../footing/index.js";
import { outline } from "../plan/index.js";
import { entersZone } from "./standing.js";
import type { RampZone } from "./standing.js";

/** The highest a litter stands, 0.15 m: a pallet, the tallest flat thing of the references. */
const LITTER_HEIGHT = 0.15;

/** The longest plan side of a litter, 1.5 m: about a pallet's. */
const LITTER_LENGTH = 1.5;

/** A static object of the description with the box where `level-pipeline` placed it. */
export interface PlacedStatic {
  readonly object: StaticObject;
  readonly box: SlabBox;
}

/** The two litter limits of one placed box: its height and its longer plan side. */
function litterLimits(id: string, box: SlabBox): string[] {
  const [hx, hy, hz] = box.halfExtents;
  const height = 2 * hy;
  const length = 2 * Math.max(hx, hz);
  const messages: string[] = [];
  if (over(height, LITTER_HEIGHT)) {
    messages.push(
      `static ${id} is ${formatLength(height)} m high; litter is ${formatLength(LITTER_HEIGHT)} m high or lower`,
    );
  }
  if (over(length, LITTER_LENGTH)) {
    messages.push(
      `static ${id} measures ${formatLength(length)} m in plan; litter measures ${formatLength(LITTER_LENGTH)} m or less`,
    );
  }
  return messages;
}

/** Floor litter's ground: one floor level under its plan corners, and off the ramp zone. */
function groundLimits(
  id: string,
  box: SlabBox,
  prepared: PreparedLevel,
  zone: RampZone | null,
): string[] {
  const [low, high] = floorsUnder(prepared, box);
  const messages: string[] = [];
  if (over(high - low, 0)) {
    messages.push(
      `static ${id} spans the floor levels ${formatLength(low)} and ${formatLength(high)}; keep floor litter on one level`,
    );
  }
  if (zone !== null && entersZone(outline(box), zone)) {
    messages.push(
      `static ${id} stands on the ramp, z ${formatLength(zone.from)} to ${formatLength(zone.to)}`,
    );
  }
  return messages;
}

/** An overhead object's start above the hall's highest floor, wherever it hangs. */
function hangLimit(id: string, box: SlabBox, prepared: PreparedLevel): string[] {
  const highest = Math.max(...prepared.metrics.floorHeights);
  const start = Math.min(...box.corners.map((corner) => corner[1])) - highest;
  if (!under(start, HANG_HEIGHT)) {
    return [];
  }
  return [
    `static ${id} starts ${formatLength(start)} m above the hall's highest floor; an overhead object starts ${formatLength(HANG_HEIGHT)} m or higher`,
  ];
}

/**
 * `static`: the limits of each placed static object's class, in description order. Litter is
 * low and short; floor litter also keeps one floor level and the ramp's side; an overhead
 * object starts at the hang height above the hall's highest floor.
 */
export function staticLimits(
  placed: readonly PlacedStatic[],
  prepared: PreparedLevel,
  zone: RampZone | null,
): Finding[] {
  return placed.flatMap(({ object, box }): Finding[] => {
    const kind = staticClass(object);
    const messages =
      kind === "overhead"
        ? hangLimit(object.id, box, prepared)
        : [
            ...litterLimits(object.id, box),
            ...(kind === "floor" ? groundLimits(object.id, box, prepared, zone) : []),
          ];
    return messages.map((message) => ({ rule: "static", subject: object.id, message }));
  });
}
