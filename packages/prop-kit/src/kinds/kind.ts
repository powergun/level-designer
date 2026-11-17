import { keyPath } from "@level-designer/level-format";
import { admitParams, paramProblem } from "../admit/index.js";
import type {
  ColorSpec,
  ParamContext,
  ParamRefusal,
  ParamTable,
  ParamValues,
  PropProblem,
} from "../admit/index.js";
import type { Role } from "../frame/index.js";

/** The outcome of shaping a prop by its kind: its slab roles in slab order, or its problems. */
type Shaping =
  | { readonly ok: true; readonly roles: readonly Role[] }
  | { readonly ok: false; readonly problems: readonly PropProblem[] };

/** One prop kind: its name, its parameter table and the shaping of a prop's raw parameters. */
export interface Kind {
  readonly name: string;
  readonly params: ParamTable;
  shapeOf(raw: ReadonlyMap<string, unknown>, context: ParamContext): Shaping;
}

/**
 * A kind from its parameter table, its generator and, optionally, its limits across parameters.
 * The kind admits the raw parameters once into the table's typed value; the limits judge that
 * value once every parameter passes, and the generator trusts it.
 */
export function defineKind<T extends ParamTable & { readonly color: ColorSpec<true> }>(
  name: string,
  params: T,
  generate: (values: ParamValues<T>) => readonly Role[],
  limits?: (values: ParamValues<T>) => readonly ParamRefusal[],
): Kind {
  return {
    name,
    params,
    shapeOf(raw: ReadonlyMap<string, unknown>, context: ParamContext): Shaping {
      const admission = admitParams(name, params, raw, context);
      if (!admission.ok) {
        return admission;
      }
      const refusals = limits?.(admission.value) ?? [];
      if (refusals.length > 0) {
        const paramsPath = keyPath(context.path, "params");
        return {
          ok: false,
          problems: refusals.map((refusal) => paramProblem(paramsPath, name, refusal)),
        };
      }
      return { ok: true, roles: generate(admission.value) };
    },
  };
}
