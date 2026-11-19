import { expect } from "bun:test";
import { decodeLevel, encodeLevel } from "@level-designer/level-format";
import type {
  Admission,
  FormatProblem,
  Level,
  Lighting,
  PointLight,
  Slab,
  Vec3,
} from "@level-designer/level-format";
import { finishesDocument, finishTable, SLAB_FINISH } from "./finishes.ts";

/** A JSON document as tests build it; only the admission under test reads its shape. */
type Document = unknown;

/** A valid point light. */
export function validPoint(): PointLight {
  return { position: [0, 6, 10], color: [0.2, 0.8, 1], intensity: 40, range: 12 };
}

/** A valid lighting section with a key and one point light. */
function validLighting(): Lighting {
  return {
    environment: { intensity: 0.4, ambient: [0.02, 0.03, 0.05], overhead: [0.1, 0.1, 0.12] },
    key: {
      color: [0.9, 0.95, 1],
      intensity: 2,
      direction: [0, 1, 0],
      shadow: { mapSize: 4096, bias: -0.0005, normalBias: 0.02, radius: 2 },
    },
    points: [validPoint()],
    haze: { density: 0.012, color: [0.006, 0.01, 0.017], glow: 0.9 },
    exposure: 1,
  };
}

/** A valid seal record with the given id, 0.3 m thick along z. */
export function validSeal(id = "end-wall"): Record<string, unknown> {
  return { id, min: [0, 0, 0], max: [2, 3, 0.3], color: "#20242a", metalness: 0, roughness: 0.9 };
}

/** A valid prop record with the given id. */
export function validProp(id = "line-a-conveyor-03"): Record<string, unknown> {
  const params = { length: 8, color: "#3b4046", glow: "cyan" };
  return { id, kind: "conveyor", at: [-4, 12.5], yaw: 0, params };
}

/** A valid description with two overrides, one seal, one glow and one prop. */
export function validDescription(): Record<string, unknown> {
  return {
    schema: "level-designer-description/1",
    name: "dark-factory",
    base: {
      scale: 3.89956,
      materials: {
        Steel_Dark: { tint: [0.5, 0.5, 0.6], metalness: 0.8, roughness: 0.4 },
        Lamp: { emissive: { color: [1, 0.9, 0.7], strength: 2 } },
      },
      doubleSided: ["Fence_01"],
    },
    seals: [validSeal()],
    finishes: finishesDocument(),
    glows: { cyan: { color: [0.2, 0.8, 1], strength: 6 } },
    props: [validProp()],
    lighting: validLighting(),
  };
}

/** A floor litter record with the given id that states only its required keys. */
export function validStatic(id = "sheet-12"): Record<string, unknown> {
  return {
    id,
    at: [-4.3, -2.1],
    size: [0.6, 0.02, 0.4],
    color: "#8b9097",
    finish: SLAB_FINISH.finish,
  };
}

/** The valid description with the given static objects. */
export function staticsDescription(statics: readonly unknown[]): Record<string, unknown> {
  return { ...validDescription(), statics };
}

/** A slab on the grid: a metal panel of `size`, yawed by a 3-4-5 turn, lifted 0.3241 m. */
export function gridSlab(size: Vec3 = [2, 1.2, 0.3]): Slab {
  return {
    size,
    material: "metal",
    color: "#3b4046",
    position: [-4.0125, 0.3241, 12.5],
    rotation: [0, 0.6, 0, 0.8],
    ...SLAB_FINISH,
  };
}

/** A rounded level of two props whose slabs are `first` and `second`. */
export function gridLevel(first: readonly Slab[], second: readonly Slab[]): Level {
  const props = [
    { id: "crate-a", slabs: first },
    { id: "crate-b", slabs: second },
  ];
  return { finishes: finishTable(), props, lighting: validLighting() };
}

/** Whether a value can hold keys or items. */
function isContainer(value: unknown): value is object {
  return typeof value === "object" && value !== null;
}

/** The path segments of a shown path such as `props[0].at[1]` or `a["b.c"]`. */
function segments(shown: string): (string | number)[] {
  const parts = shown.matchAll(/\["([^"]*)"\]|\[(\d+)\]|([^.[\]]+)/g);
  return [...parts].map(
    ([, quoted, index, plain]) => quoted ?? (index === undefined ? (plain ?? "") : Number(index)),
  );
}

/** A deep copy of `document` with the value at `shown` set, or deleted when `value` is absent. */
export function changed(document: Document, shown: string, value?: unknown): Document {
  const copy = structuredClone(document);
  const path = segments(shown);
  const last = path.pop() ?? "";
  const parent = path.reduce<unknown>(
    (node, key) => (isContainer(node) ? Reflect.get(node, key) : undefined),
    copy,
  );
  if (!isContainer(parent)) {
    throw new Error(`the fixture has no container at ${shown}`);
  }
  if (value === undefined) {
    Reflect.deleteProperty(parent, last);
  } else {
    Reflect.set(parent, last, value);
  }
  return copy;
}

/** The problems of an admission; none when it admitted the text. */
export function problemsOf<T>(admission: Admission<T>): readonly FormatProblem[] {
  return admission.ok ? [] : admission.problems;
}

/** Asserts that encoding then decoding `level` returns the same level, with no problem. */
export function expectRoundTrip(level: Level): void {
  const decoded = decodeLevel(encodeLevel(level));
  expect(problemsOf(decoded)).toEqual([]);
  expect(decoded.ok ? decoded.value : undefined).toEqual(level);
}

/** The rule and path of each problem, the structured outcome most tests assert. */
export function rulePaths<T>(admission: Admission<T>): [string, string][] {
  return problemsOf(admission).map((problem) => [problem.rule, problem.path]);
}

/**
 * One limit probe: a value's path, a value at its limit, the first value beyond it and, when
 * it differs from the value's path, the path of the record that the problem names.
 */
export type LimitCase = readonly [path: string, at: unknown, beyond: unknown, failsAt?: string];

/** The two probes of a closed range from `min` to `max`, one step of `step` beyond each end. */
export function closedRange(path: string, min: number, max: number, step = 0.0001): LimitCase[] {
  return [
    [path, min, min - step],
    [path, max, max + step],
  ];
}

/**
 * Asserts that `admit` accepts the document with the value at its limit and refuses it one
 * step beyond with exactly one `shape` problem at its path.
 */
export function expectLimit<T>(
  admit: (text: string) => Admission<T>,
  document: Document,
  probe: LimitCase,
): void {
  const [path, at, beyond, failsAt = path] = probe;
  expect(rulePaths(admit(JSON.stringify(changed(document, path, at))))).toEqual([]);
  expect(rulePaths(admit(JSON.stringify(changed(document, path, beyond))))).toEqual([
    ["shape", failsAt],
  ]);
}
