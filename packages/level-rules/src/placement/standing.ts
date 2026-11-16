import { formatLength } from "@level-designer/level-format";
import type { PreparedLevel } from "@level-designer/sec111-gateway";
import type { Finding } from "../finding/index.js";
import { over, under } from "../finding/index.js";
import type { PropFooting } from "../footing/index.js";
import { HANG_HEIGHT } from "../footing/index.js";
import { bounds } from "../plan/index.js";

/** The least top height of a standing slab above the floor, 0.5 m; the capsule climbs 0.30 m. */
const LEAST_TOP = 0.5;

/** The z extent of the ramp: the step floors of the prepared body world. */
export interface RampZone {
  readonly from: number;
  readonly to: number;
}

/**
 * The ramp zone: the z extent of the body world's floors after the base floor and the raised
 * slab. A hall without step floors has none.
 */
export function rampZone(prepared: PreparedLevel): RampZone | null {
  const steps = prepared.bodies.floors.slice(2);
  if (steps.length === 0) {
    return null;
  }
  return {
    from: Math.min(...steps.map((step) => step.min[2])),
    to: Math.max(...steps.map((step) => step.max[2])),
  };
}

/**
 * `support`: every prop stands on the floor under `at` or hangs at 2.17 m or higher. The
 * message gives the lowest point above the floor the hang reads, the highest under the slabs.
 */
export function support(footing: readonly PropFooting[]): Finding[] {
  return footing.flatMap((prop): Finding[] => {
    if (prop.stands || prop.hangs) {
      return [];
    }
    const height = formatLength(prop.lowest - prop.highestFloor);
    const message = `prop ${prop.id} neither stands nor hangs: its lowest point is ${height} m above the floor; stand it on the floor or hang it at ${formatLength(HANG_HEIGHT)} m or higher`;
    return [{ rule: "support", subject: prop.id, message }];
  });
}

/** `floor`: a standing prop's standing slabs all stand on one floor level. */
export function floor(footing: readonly PropFooting[]): Finding[] {
  return footing.flatMap((prop): Finding[] => {
    if (prop.standing.length === 0) {
      return [];
    }
    const low = Math.min(...prop.standing.map((slab) => slab.lowFloor));
    const high = Math.max(...prop.standing.map((slab) => slab.highFloor));
    if (!over(high - low, 0)) {
      return [];
    }
    const message = `prop ${prop.id} spans the floor levels ${formatLength(low)} and ${formatLength(high)}; keep a standing prop on one level`;
    return [{ rule: "floor", subject: prop.id, message }];
  });
}

/** `ramp`: no standing footprint reaches into the ramp zone. */
export function ramp(footing: readonly PropFooting[], zone: RampZone | null): Finding[] {
  if (zone === null) {
    return [];
  }
  return footing.flatMap((prop): Finding[] => {
    const reaches = prop.standing.some((slab) => {
      const extent = bounds(slab.outline);
      return over(extent.maxZ, zone.from) && under(extent.minZ, zone.to);
    });
    if (!reaches) {
      return [];
    }
    const message = `prop ${prop.id} stands on the ramp, z ${formatLength(zone.from)} to ${formatLength(zone.to)}`;
    return [{ rule: "ramp", subject: prop.id, message }];
  });
}

/** `low-top`: every standing slab tops out 0.5 m or higher above the floor under `at`. */
export function lowTop(footing: readonly PropFooting[]): Finding[] {
  return footing.flatMap((prop) =>
    prop.standing.flatMap((slab): Finding[] => {
      const top = Math.max(...slab.box.corners.map((corner) => corner[1])) - prop.floor;
      if (!under(top, LEAST_TOP)) {
        return [];
      }
      const message = `prop ${prop.id} slab ${slab.index} tops out ${formatLength(top)} m above the floor; a standing slab reaches ${formatLength(LEAST_TOP)} m or higher`;
      return [{ rule: "low-top", subject: prop.id, message }];
    }),
  );
}
