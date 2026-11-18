import { keyPath } from "@level-designer/level-format";
import { admitParams, paramProblem, range, seed } from "../admit/index.js";
import type {
  ColorSpec,
  ParamContext,
  ParamRefusal,
  ParamTable,
  ParamValues,
  PropProblem,
} from "../admit/index.js";
import type { Role } from "../frame/index.js";

/** The parameters every kind takes after its own: `wear` and `seed`. */
const COMMON_PARAMS = {
  wear: range(0, 1, 0.3),
  seed: seed(),
};

/** What a generator returns: the prop's slab roles in slab order and the glow of a glowing prop. */
export interface KindShape {
  readonly roles: readonly Role[];
  readonly glow?: string;
}

/**
 * The outcome of shaping a prop by its kind: its roles, its glow, its wear and its stated seed,
 * or its problems. A seed left out is nothing; the expansion hashes the prop's id for it.
 */
type Shaping =
  | (KindShape & { readonly ok: true; readonly wear: number; readonly seed?: number })
  | { readonly ok: false; readonly problems: readonly PropProblem[] };

/** One prop kind: its name, its parameter table and the shaping of a prop's raw parameters. */
export interface Kind {
  readonly name: string;
  readonly params: ParamTable;
  shapeOf(raw: ReadonlyMap<string, unknown>, context: ParamContext): Shaping;
}

/**
 * A kind from its own parameter table, its generator and, optionally, its limits across
 * parameters. Its table gains `wear` and `seed` after its own parameters. The kind admits the
 * raw parameters once into the table's typed value; the limits judge that value once every
 * parameter passes, and the generator trusts it.
 */
export function defineKind<T extends ParamTable & { readonly color: ColorSpec<true> }>(
  name: string,
  own: T,
  generate: (values: ParamValues<T>) => KindShape,
  limits?: (values: ParamValues<T>) => readonly ParamRefusal[],
): Kind {
  const params = { ...own, ...COMMON_PARAMS };
  return {
    name,
    params,
    shapeOf(raw: ReadonlyMap<string, unknown>, context: ParamContext): Shaping {
      const admission = admitParams(name, params, raw, context);
      if (!admission.ok) {
        return admission;
      }
      const values = admission.value;
      const refusals = limits?.(values) ?? [];
      if (refusals.length > 0) {
        const paramsPath = keyPath(context.path, "params");
        return {
          ok: false,
          problems: refusals.map((refusal) => paramProblem(paramsPath, name, refusal)),
        };
      }
      const shape = generate(values);
      const stated = values.seed === undefined ? {} : { seed: values.seed };
      return { ok: true, ...shape, wear: values.wear, ...stated };
    },
  };
}
