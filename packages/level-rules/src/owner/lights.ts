import { formatLength } from "@level-designer/level-format";
import type { PointLight } from "@level-designer/level-format";
import type { PreparedLevel } from "@level-designer/sec111-gateway";
import { floorHeightAt } from "@level-designer/sec111-gateway";
import type { Finding } from "../finding/index.js";
import { over, point, under } from "../finding/index.js";

/** True when the point lies in the interior's plan and not above its ceiling. */
function inside(prepared: PreparedLevel, position: PointLight["position"]): boolean {
  const { min, max } = prepared.metrics.interior;
  const [x, y, z] = position;
  return !(
    under(x, min[0]) ||
    over(x, max[0]) ||
    under(z, min[2]) ||
    over(z, max[2]) ||
    over(y, max[1])
  );
}

/** `light-inside`: every point light lies in the interior's plan and under its ceiling. */
export function lightInside(points: readonly PointLight[], prepared: PreparedLevel): Finding[] {
  return points.flatMap((light, i): Finding[] => {
    if (inside(prepared, light.position)) {
      return [];
    }
    const subject = `lighting.points[${i}]`;
    const message = `${subject} at ${point(light.position)} lies outside the interior`;
    return [{ rule: "light-inside", subject, message }];
  });
}

/** `light-floor`: no point light sits under the floor beneath it. */
export function lightFloor(points: readonly PointLight[], prepared: PreparedLevel): Finding[] {
  return points.flatMap((light, i): Finding[] => {
    const [x, y, z] = light.position;
    const floor = floorHeightAt(prepared, x, z);
    if (!under(y, floor)) {
      return [];
    }
    const subject = `lighting.points[${i}]`;
    const message = `${subject} sits ${formatLength(floor - y)} m under the floor at ${point([x, z])}`;
    return [{ rule: "light-floor", subject, message }];
  });
}
