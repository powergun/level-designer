/** A seeded generator of numbers in [0, 1): mulberry32, so every run draws the same sample. */
export function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A value of the range: its minimum a quarter of the time, its maximum a quarter, else uniform. */
export function edgeBiased(next: () => number, [min, max]: readonly [number, number]): number {
  const pick = next();
  if (pick < 0.25) return min;
  if (pick < 0.5) return max;
  return min + (max - min) * next();
}
