/** A count with its noun, singular for exactly one: `1 error`, `2 errors`. */
export function counted(count: number, noun: string): string {
  return count === 1 ? `1 ${noun}` : `${count} ${noun}s`;
}
