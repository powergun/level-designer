import { keyPath, roundSlab } from "@level-designer/level-format";
import type { Description, Slab } from "@level-designer/level-format";
import { expandProp } from "@level-designer/prop-kit";
import { floorHeightAt } from "@level-designer/sec111-gateway";
import type { BuildError, PreparedStatic } from "./built.js";
import { insideInterior, OUTSIDE, placeError } from "./place.js";

/** One rounded slab of a prop, with the glow name of a glowing slab. */
interface RoundedSlab {
  readonly slab: Slab;
  readonly glow?: string;
}

/** One prop's rounded slabs in slab order. */
export interface ExpandedProp {
  readonly id: string;
  readonly slabs: readonly RoundedSlab[];
}

/** The props step's outcome: every prop's rounded slabs, or every error of the step. */
export type PropsStep =
  | { readonly ok: true; readonly props: readonly ExpandedProp[] }
  | { readonly ok: false; readonly errors: readonly BuildError[] };

/**
 * Places and expands every prop on the floor under its `at` with the description's glows and
 * finish table, then rounds each slab once with the format's rounding. A prop outside the
 * interior yields `place` and is not expanded; every error of the step is returned in
 * description order.
 */
export function expandProps(description: Description, prepared: PreparedStatic): PropsStep {
  const context = { glows: new Set(description.glows.keys()), finishes: description.finishes };
  const errors: BuildError[] = [];
  const props: ExpandedProp[] = [];
  description.props.forEach((prop, index) => {
    const path = `${keyPath("", "props")}[${index}]`;
    if (!insideInterior(prepared, prop.at)) {
      errors.push(placeError(keyPath(path, "at"), prop.at, OUTSIDE));
      return;
    }
    const floor = floorHeightAt(prepared.level, prop.at[0], prop.at[1]);
    const expansion = expandProp(prop, path, floor, context);
    if (!expansion.ok) {
      errors.push(...expansion.problems);
      return;
    }
    const slabs = expansion.slabs.map(({ slab, glow }) =>
      glow === undefined ? { slab: roundSlab(slab) } : { slab: roundSlab(slab), glow },
    );
    props.push({ id: prop.id, slabs });
  });
  return errors.length > 0 ? { ok: false, errors } : { ok: true, props };
}
