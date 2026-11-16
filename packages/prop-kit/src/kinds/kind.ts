import { admitParams } from "../admit/index.js";
import type {
  ColorSpec,
  ParamContext,
  ParamTable,
  ParamValues,
  PropProblem,
} from "../admit/index.js";
import type { Role } from "../frame/index.js";

/** A kind's prop in its own frame: the colour every slab takes and the slab roles in slab order. */
export interface Shape {
  readonly color: string;
  readonly roles: readonly Role[];
}

/** The outcome of shaping a prop by its kind. */
type Shaping =
  | { readonly ok: true; readonly shape: Shape }
  | { readonly ok: false; readonly problems: readonly PropProblem[] };

/** One prop kind: its name, its parameter table and the shaping of a prop's raw parameters. */
export interface Kind {
  readonly name: string;
  readonly params: ParamTable;
  shapeOf(raw: ReadonlyMap<string, unknown>, context: ParamContext): Shaping;
}

/**
 * A kind from its parameter table and its generator. The kind admits the raw parameters once
 * into the table's typed value, and the generator trusts that value.
 */
export function defineKind<T extends ParamTable & { readonly color: ColorSpec }>(
  name: string,
  params: T,
  generate: (values: ParamValues<T>) => Shape,
): Kind {
  return {
    name,
    params,
    shapeOf(raw: ReadonlyMap<string, unknown>, context: ParamContext): Shaping {
      const admission = admitParams(name, params, raw, context);
      return admission.ok
        ? { ok: true, shape: generate(admission.value) }
        : { ok: false, problems: admission.problems };
    },
  };
}
