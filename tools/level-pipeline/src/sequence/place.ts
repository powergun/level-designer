import { formatLength, LENGTH_SLACK } from "@level-designer/level-format";
import type { Prop } from "@level-designer/level-format";
import type { BuildError, PreparedStatic } from "./built.js";

/** Whether `value` lies from `low` to `high`, with the format's length slack. */
function within(value: number, low: number, high: number): boolean {
  return value >= low - LENGTH_SLACK && value <= high + LENGTH_SLACK;
}

/** Whether the plan point lies inside the interior's plan, with the format's slack. */
export function insideInterior(prepared: PreparedStatic, [x, z]: Prop["at"]): boolean {
  const { min, max } = prepared.level.metrics.interior;
  return within(x, min[0], max[0]) && within(z, min[2], max[2]);
}

/** The `place` error at `atPath` of a plan point `at`, stated with the format's lengths. */
export function placeError(atPath: string, [x, z]: Prop["at"], reason: string): BuildError {
  const message = `${atPath}: (${formatLength(x)}, ${formatLength(z)}) ${reason}`;
  return { rule: "place", path: atPath, message };
}

/** The reason of a `place` error whose plan point lies outside the interior. */
export const OUTSIDE = "lies outside the interior";
