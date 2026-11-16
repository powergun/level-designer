import { LENGTH_SLACK } from "@level-designer/level-format";

/** True when a length falls short of a lower limit by more than the format's length slack. */
export function under(value: number, limit: number): boolean {
  return value < limit - LENGTH_SLACK;
}

/** True when a length passes an upper limit by more than the format's length slack. */
export function over(value: number, limit: number): boolean {
  return value > limit + LENGTH_SLACK;
}
