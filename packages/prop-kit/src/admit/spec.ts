import { MAX_SEED } from "@level-designer/level-format";
import type { SlabMaterial } from "@level-designer/level-format";

/** A number parameter from `min` to `max`; without a default it is required. */
export interface NumberSpec {
  readonly type: "number";
  readonly min: number;
  readonly max: number;
  readonly default?: number;
}

/** A `#rrggbb` surface colour; every kind requires `color`, and a kind may take an optional one. */
export interface ColorSpec<R extends boolean = boolean> {
  readonly type: "color";
  readonly required: R;
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

/**
 * A prop's seed: a whole number from `min` to `max`. Omitted, it admits as nothing and the kit
 * takes the hash of the prop's id, a default that no constant can state.
 */
export interface SeedSpec {
  readonly type: "seed";
  readonly min: number;
  readonly max: number;
}

/** One text out of `choices`, with its default. */
export interface ChoiceSpec<C extends string = string> {
  readonly type: "choice";
  readonly choices: readonly C[];
  readonly default: C;
}

/** A switch: true or false, with its default. */
export interface BooleanSpec {
  readonly type: "boolean";
  readonly default: boolean;
}

/**
 * A finish path as text, which the description's finish table must hold. Omitted, it admits as
 * nothing and the kind takes the path of its material in `byMaterial`.
 */
export interface FinishSpec {
  readonly type: "finish";
  readonly byMaterial: Readonly<Record<SlabMaterial, string>>;
}

/** The spec of one kind parameter, discriminated by `type`. */
export type ParamSpec =
  | NumberSpec
  | ColorSpec
  | MaterialSpec
  | GlowSpec
  | SeedSpec
  | ChoiceSpec
  | BooleanSpec
  | FinishSpec;

/** A kind's parameter table: each parameter's spec, keyed by its name, in listing order. */
export type ParamTable = Readonly<Record<string, ParamSpec>>;

/** The admitted value type of one spec. */
type ValueOf<S extends ParamSpec> = S extends NumberSpec
  ? number
  : S extends ColorSpec<true>
    ? string
    : S extends ColorSpec
      ? string | undefined
      : S extends MaterialSpec<infer M>
        ? M
        : S extends ChoiceSpec<infer C>
          ? C
          : S extends BooleanSpec
            ? boolean
            : S extends GlowSpec<true>
              ? string
              : S extends SeedSpec
                ? number | undefined
                : string | undefined;

/** The typed parameter value of a kind: every parameter admitted, defaults filled in. */
export type ParamValues<T extends ParamTable> = { readonly [K in keyof T]: ValueOf<T[K]> };

/** A number parameter from `min` to `max`, required unless a default is given. */
export function range(min: number, max: number, fallback?: number): NumberSpec {
  return fallback === undefined
    ? { type: "number", min, max }
    : { type: "number", min, max, default: fallback };
}

/** A colour parameter; an optional colour has no default and admits as nothing. */
export function color<R extends boolean>(required: R): ColorSpec<R> {
  return { type: "color", required };
}

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

/** The seed parameter: a whole number in the lattice hash's range, 0 to `MAX_SEED`. */
export function seed(): SeedSpec {
  return { type: "seed", min: 0, max: MAX_SEED };
}

/** A choice parameter out of `choices`, with its default. */
export function choice<const C extends string>(choices: readonly C[], fallback: C): ChoiceSpec<C> {
  return { type: "choice", choices, default: fallback };
}

/** A switch parameter, true or false, with its default. */
export function flag(fallback: boolean): BooleanSpec {
  return { type: "boolean", default: fallback };
}

/** A finish path parameter whose default is the path of the prop's material. */
export function finishPath(byMaterial: Readonly<Record<SlabMaterial, string>>): FinishSpec {
  return { type: "finish", byMaterial };
}
