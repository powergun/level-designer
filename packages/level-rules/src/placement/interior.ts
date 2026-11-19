import { formatLength } from "@level-designer/level-format";
import type { Seal, SlabBox, Vec3 } from "@level-designer/level-format";
import type { PreparedLevel } from "@level-designer/sec111-gateway";
import type { Finding } from "../finding/index.js";
import { over, point, under } from "../finding/index.js";
import type { PropFooting } from "../footing/index.js";
import type { PlacedStatic } from "./static.js";

/** The least depth a seal reaches into the interior on every axis, so sec-111 sees it. */
const SEAL_REACH = 0.02;

/** How far a point lies outside an axis-aligned box; 0 inside it. */
function outside(p: Vec3, min: Vec3, max: Vec3): number {
  const excess = p.map((v, axis) => Math.max(min[axis]! - v, v - max[axis]!, 0));
  return Math.hypot(...excess);
}

/** How a box leaves the interior: `by ... m at (...)` for its farthest corner, or null inside. */
function leaving(box: SlabBox, prepared: PreparedLevel): string | null {
  const { min, max } = prepared.metrics.interior;
  const reaches = box.corners.map((corner) => outside(corner, min, max));
  const far = Math.max(...reaches);
  if (!over(far, 0)) {
    return null;
  }
  return `by ${formatLength(far)} m at ${point(box.corners[reaches.indexOf(far)]!)}`;
}

/**
 * `interior`: no slab and no placed static object leaves the interior box; a finding names
 * the corner farthest outside. The static objects follow the props.
 */
export function interior(
  footing: readonly PropFooting[],
  placed: readonly PlacedStatic[],
  prepared: PreparedLevel,
): Finding[] {
  const slabs = footing.flatMap((prop) =>
    prop.boxes.flatMap((box, k): Finding[] => {
      const away = leaving(box, prepared);
      return away === null
        ? []
        : [
            {
              rule: "interior",
              subject: prop.id,
              message: `prop ${prop.id} slab ${k} leaves the interior ${away}`,
            },
          ];
    }),
  );
  const statics = placed.flatMap(({ object, box }): Finding[] => {
    const away = leaving(box, prepared);
    return away === null
      ? []
      : [
          {
            rule: "interior",
            subject: object.id,
            message: `static ${object.id} leaves the interior ${away}`,
          },
        ];
  });
  return [...slabs, ...statics];
}

/** `seal`: the part of every seal inside the interior box is at least 0.02 m thick on each axis. */
export function seal(seals: readonly Seal[], prepared: PreparedLevel): Finding[] {
  const { min, max } = prepared.metrics.interior;
  return seals.flatMap((s): Finding[] => {
    const depths = [0, 1, 2].map(
      (axis) => Math.min(s.max[axis]!, max[axis]!) - Math.max(s.min[axis]!, min[axis]!),
    );
    if (!depths.some((depth) => under(depth, SEAL_REACH))) {
      return [];
    }
    const message = `seal ${s.id} reaches less than ${formatLength(SEAL_REACH)} m into the interior, so sec-111 cannot see it`;
    return [{ rule: "seal", subject: s.id, message }];
  });
}
