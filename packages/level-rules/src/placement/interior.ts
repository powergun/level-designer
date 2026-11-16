import { formatLength } from "@level-designer/level-format";
import type { Seal, Vec3 } from "@level-designer/level-format";
import type { PreparedLevel } from "@level-designer/sec111-gateway";
import type { Finding } from "../finding/index.js";
import { over, point, under } from "../finding/index.js";
import type { PropFooting } from "../footing/index.js";

/** The least depth a seal reaches into the interior on every axis, so sec-111 sees it. */
const SEAL_REACH = 0.02;

/** How far a point lies outside an axis-aligned box; 0 inside it. */
function outside(p: Vec3, min: Vec3, max: Vec3): number {
  const excess = p.map((v, axis) => Math.max(min[axis]! - v, v - max[axis]!, 0));
  return Math.hypot(...excess);
}

/** `interior`: no slab leaves the interior box; a finding names the corner farthest outside. */
export function interior(footing: readonly PropFooting[], prepared: PreparedLevel): Finding[] {
  const { min, max } = prepared.metrics.interior;
  return footing.flatMap((prop) =>
    prop.boxes.flatMap((box, k): Finding[] => {
      const reaches = box.corners.map((corner) => outside(corner, min, max));
      const far = Math.max(...reaches);
      if (!over(far, 0)) {
        return [];
      }
      const corner = box.corners[reaches.indexOf(far)]!;
      const message = `prop ${prop.id} slab ${k} leaves the interior by ${formatLength(far)} m at ${point(corner)}`;
      return [{ rule: "interior", subject: prop.id, message }];
    }),
  );
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
