/** Items joined as prose: `a`, `a or b`, `a, b or c` with the given last conjunction. */
export function listed(items: readonly string[], conjunction: "and" | "or"): string {
  const head = items.slice(0, -1);
  const last = items.at(-1) ?? "";
  return head.length === 0 ? last : `${head.join(", ")} ${conjunction} ${last}`;
}
