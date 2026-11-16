import type { SlabMaterial } from "@level-designer/level-format";

/** A number parameter from `min` to `max`; without a default it is required. */
export interface NumberSpec {
  readonly type: "number";
  readonly min: number;
  readonly max: number;
  readonly default?: number;
}

/** The required `#rrggbb` surface colour every kind takes. */
export interface ColorSpec {
  readonly type: "color";
}

/** A slab material out of `choices`, with its default. */
export interface MaterialSpec<M extends SlabMaterial = SlabMaterial> {
  readonly type: "material";
  readonly choices: readonly M[];
  readonly default: M;
}

/** A glow name that the description's `glows` holds; optional unless `required`. */
export interface GlowSpec<R extends boolean = boolean> {
  readonly type: "glow";
  readonly required: R;
}

/** The spec of one kind parameter, discriminated by `type`. */
export type ParamSpec = NumberSpec | ColorSpec | MaterialSpec | GlowSpec;

/** A kind's parameter table: each parameter's spec, keyed by its name, in listing order. */
export type ParamTable = Readonly<Record<string, ParamSpec>>;

/** The admitted value type of one spec. */
type ValueOf<S extends ParamSpec> = S extends NumberSpec
  ? number
  : S extends ColorSpec
    ? string
    : S extends MaterialSpec<infer M>
      ? M
      : S extends GlowSpec<true>
        ? string
        : string | undefined;

/** The typed parameter value of a kind: every parameter admitted, defaults filled in. */
export type ParamValues<T extends ParamTable> = { readonly [K in keyof T]: ValueOf<T[K]> };

/** A number parameter from `min` to `max`, required unless a default is given. */
export function range(min: number, max: number, fallback?: number): NumberSpec {
  return fallback === undefined
    ? { type: "number", min, max }
    : { type: "number", min, max, default: fallback };
}

/** The colour parameter. */
export const COLOR: ColorSpec = { type: "color" };

/** A material parameter out of `choices`, with its default. */
export function material<M extends SlabMaterial>(
  choices: readonly M[],
  fallback: M,
): MaterialSpec<M> {
  return { type: "material", choices, default: fallback };
}

/** A glow parameter; a required glow has no default. */
export function glow<R extends boolean>(required: R): GlowSpec<R> {
  return { type: "glow", required };
}
