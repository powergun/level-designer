import { formatLength } from "@level-designer/level-format";

/** A whole count with thousands separators, such as `300,000`. */
export function count(value: number): string {
  return value.toLocaleString("en-US");
}

/** A point of lengths in parentheses, such as `(1.5, 0, -2)`. */
export function point(values: readonly number[]): string {
  return `(${values.map(formatLength).join(", ")})`;
}
