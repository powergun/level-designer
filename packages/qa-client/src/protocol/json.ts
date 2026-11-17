import type { Point } from "./shapes.js";
import { ShapeMiss } from "./shape-miss.js";

/** A parsed JSON object, read only by key. */
export type JsonObject = Readonly<Record<string, unknown>>;

/** The outcome of one shape read: the typed value, or the first miss. */
export type ShapeRead<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly miss: ShapeMiss };

/** Run a reader that throws `ShapeMiss` and return its outcome; any other throw passes on. */
export function readShape<T>(read: () => T): ShapeRead<T> {
  try {
    return { ok: true, value: read() };
  } catch (thrown) {
    if (thrown instanceof ShapeMiss) return { ok: false, miss: thrown };
    throw thrown;
  }
}

/** Whether the value is a plain JSON object, not null and not a list. */
function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** The value as a plain JSON object. */
export function objectAt(value: unknown, path: string): JsonObject {
  if (!isJsonObject(value)) throw new ShapeMiss(path, "an object");
  return value;
}

/** The value as a JSON object with exactly the listed keys. */
export function recordAt(value: unknown, path: string, keys: readonly string[]): JsonObject {
  const record = objectAt(value, path);
  for (const key of Object.keys(record)) {
    if (!keys.includes(key)) throw new ShapeMiss(`${path}.${key}`, "no such key");
  }
  for (const key of keys) {
    if (!Object.hasOwn(record, key)) throw new ShapeMiss(`${path}.${key}`, "a value");
  }
  return record;
}

/** The value as a string. */
export function stringAt(value: unknown, path: string): string {
  if (typeof value !== "string") throw new ShapeMiss(path, "a string");
  return value;
}

/** The value as a string or null. */
export function nullableStringAt(value: unknown, path: string): string | null {
  return value === null ? null : stringAt(value, path);
}

/** The value as a finite number. */
export function numberAt(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new ShapeMiss(path, "a finite number");
  }
  return value;
}

/** The value as a whole number from `min` on. */
export function countAt(value: unknown, path: string, min: number): number {
  const count = numberAt(value, path);
  if (!Number.isInteger(count) || count < min)
    throw new ShapeMiss(path, `a whole number >= ${min}`);
  return count;
}

/** The value as a list. */
export function listAt(value: unknown, path: string): readonly unknown[] {
  if (!Array.isArray(value)) throw new ShapeMiss(path, "a list");
  return value;
}

/** The value as one of the listed strings. */
export function oneOfAt<T extends string>(value: unknown, path: string, options: readonly T[]): T {
  const found = options.find((option) => option === value);
  if (found === undefined) throw new ShapeMiss(path, `one of ${options.join(", ")}`);
  return found;
}

/** The value as a point of three finite numbers. */
export function pointAt(value: unknown, path: string): Point {
  const list = listAt(value, path);
  if (list.length !== 3) throw new ShapeMiss(path, "three numbers");
  return [
    numberAt(list[0], `${path}[0]`),
    numberAt(list[1], `${path}[1]`),
    numberAt(list[2], `${path}[2]`),
  ];
}
