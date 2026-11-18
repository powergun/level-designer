import { describeValue, isSurfaceColor, keyPath } from "@level-designer/level-format";
import { paramProblem } from "./problem.js";
import type { PropProblem } from "./problem.js";
import type { NumberSpec, ParamSpec, ParamTable, ParamValues, SeedSpec } from "./spec.js";
import { listed } from "./text.js";

/** Where a prop's parameters are judged: the prop's path and the glow names of the description. */
export interface ParamContext {
  readonly path: string;
  readonly glows: ReadonlySet<string>;
}

/** One read of a parameter: its admitted value, or the range or type it missed. */
type Read =
  | { readonly ok: true; readonly value: unknown }
  | { readonly ok: false; readonly takes: string };

/** The admission outcome of a kind's parameters. */
export type ParamAdmission<T extends ParamTable> =
  | { readonly ok: true; readonly value: ParamValues<T> }
  | { readonly ok: false; readonly problems: readonly PropProblem[] };

/** What a glow parameter takes: a name that `glows` holds. */
function glowTakes(name: string, glows: ReadonlySet<string>): string {
  const names = [...glows].map(describeValue);
  return names.length === 0
    ? `${name} as a glow name, and glows holds none`
    : `${name} as one of the glows ${listed(names, "or")}`;
}

/** What a parameter takes, as its range or type. */
function takes(name: string, spec: ParamSpec, glows: ReadonlySet<string>): string {
  if (spec.type === "number") {
    return `${name} ${spec.min} to ${spec.max}`;
  }
  if (spec.type === "color") {
    return `${name} as #rrggbb text`;
  }
  if (spec.type === "material" || spec.type === "choice") {
    return `${name} ${listed(spec.choices, "or")}`;
  }
  if (spec.type === "seed") {
    return `${name} as a whole number ${spec.min} to ${spec.max}`;
  }
  if (spec.type === "boolean") {
    return `${name} as true or false`;
  }
  if (spec.type === "finish") {
    return `${name} as finish/role text`;
  }
  return glowTakes(name, glows);
}

/** Whether `value` is a number in the spec's range, and a whole one for a seed. */
function admitsNumber(spec: NumberSpec | SeedSpec, value: unknown): boolean {
  const whole = spec.type === "number" || Number.isInteger(value);
  return whole && typeof value === "number" && value >= spec.min && value <= spec.max;
}

/** Whether `value` is an admitted value of `spec`, which has been given. */
function admits(spec: ParamSpec, value: unknown, glows: ReadonlySet<string>): boolean {
  if (spec.type === "number" || spec.type === "seed") {
    return admitsNumber(spec, value);
  }
  if (spec.type === "color") {
    return isSurfaceColor(value);
  }
  if (spec.type === "material" || spec.type === "choice") {
    return spec.choices.some((choice) => choice === value);
  }
  if (spec.type === "boolean") {
    return typeof value === "boolean";
  }
  if (spec.type === "finish") {
    return typeof value === "string";
  }
  return typeof value === "string" && glows.has(value);
}

/** The default of an omitted parameter, or nothing when the parameter is required. */
function fallback(spec: ParamSpec): Read | undefined {
  if (spec.type === "number") {
    return spec.default === undefined ? undefined : { ok: true, value: spec.default };
  }
  if (spec.type === "material" || spec.type === "choice" || spec.type === "boolean") {
    return { ok: true, value: spec.default };
  }
  if (spec.type === "seed" || spec.type === "finish") {
    return { ok: true, value: undefined };
  }
  return spec.required ? undefined : { ok: true, value: undefined };
}

/**
 * Whether the record holds every parameter of the table, which is what makes it the table's
 * typed value: each held value passed its spec or is its spec's default.
 */
function holdsEvery<T extends ParamTable>(
  table: T,
  value: Readonly<Record<string, unknown>>,
): value is ParamValues<T> {
  return Object.keys(table).every((name) => Object.hasOwn(value, name));
}

/** One parameter read from the raw map. */
function read(name: string, spec: ParamSpec, value: unknown, glows: ReadonlySet<string>): Read {
  const omitted = value === undefined ? fallback(spec) : undefined;
  if (omitted !== undefined) {
    return omitted;
  }
  return admits(spec, value, glows)
    ? { ok: true, value }
    : { ok: false, takes: takes(name, spec, glows) };
}

/**
 * Admits a prop's untrusted `params` map into the kind's typed parameter value, defaults
 * filled in, or returns every `param` problem: unknown keys first, in map order, then each
 * parameter in table order.
 */
export function admitParams<T extends ParamTable>(
  kind: string,
  table: T,
  raw: ReadonlyMap<string, unknown>,
  context: ParamContext,
): ParamAdmission<T> {
  const paramsPath = keyPath(context.path, "params");
  const names = Object.keys(table);
  const problems: PropProblem[] = [...raw.keys()]
    .filter((key) => !Object.hasOwn(table, key))
    .map((key) =>
      paramProblem(paramsPath, kind, {
        name: key,
        takes: `only ${listed(names, "and")}`,
        got: key,
      }),
    );
  const value: Record<string, unknown> = {};
  for (const [name, spec] of Object.entries(table)) {
    const given = raw.get(name);
    const outcome = read(name, spec, given, context.glows);
    if (outcome.ok) {
      value[name] = outcome.value;
    } else {
      problems.push(paramProblem(paramsPath, kind, { name, takes: outcome.takes, got: given }));
    }
  }
  if (problems.length > 0) {
    return { ok: false, problems };
  }
  if (!holdsEvery(table, value)) {
    throw new Error(`a ${kind} parameter was neither admitted nor reported`);
  }
  return { ok: true, value };
}
