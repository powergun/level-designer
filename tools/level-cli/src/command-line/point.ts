/** A point in the level frame, metres. */
export type Point = readonly [number, number, number];

/** The number that one coordinate text names, or `undefined` for a blank or non-finite one. */
function coordinate(text: string | undefined): number | undefined {
  if (text === undefined || text.trim() === "") return undefined;
  const value = Number(text);
  return Number.isFinite(value) ? value : undefined;
}

/** The point that an option value `x,y,z` names, or `undefined` unless it holds three numbers. */
export function parsePoint(text: string): Point | undefined {
  const parts = text.split(",");
  if (parts.length !== 3) return undefined;
  const [x, y, z] = parts.map(coordinate);
  if (x === undefined || y === undefined || z === undefined) return undefined;
  return [x, y, z];
}
