import { keyPath, staticBox, staticClass } from "@level-designer/level-format";
import type { Description, StaticObject } from "@level-designer/level-format";
import { floorHeightAt } from "@level-designer/sec111-gateway";
import type { BuildError, PreparedStatic, PlacedStatic } from "./built.js";
import { insideInterior, OUTSIDE, placeError } from "./place.js";
import type { ExpandedProp } from "./props.js";
import { topUnder } from "./tops.js";

/** A placed static object with the support of a litter on a prop: its prop and slab index. */
export interface Placement extends PlacedStatic {
  readonly support?: { readonly prop: string; readonly slab: number };
}

/** The statics step's outcome: every placement in description order, or every `place` error. */
export type StaticsStep =
  | { readonly ok: true; readonly placements: readonly Placement[] }
  | { readonly ok: false; readonly errors: readonly BuildError[] };

/** One static object's placement, or its `place` error. */
type Placed =
  | { readonly ok: true; readonly placement: Placement }
  | { readonly ok: false; readonly error: BuildError };

/** The rounded slabs of the prop that a litter names; the admission proved the id. */
function slabsOf(props: ReadonlyMap<string, ExpandedProp>, id: string): ExpandedProp["slabs"] {
  const prop = props.get(id);
  if (prop === undefined) throw new Error(`no expanded prop "${id}" for a litter`);
  return prop.slabs;
}

/**
 * The placement of one static object inside the interior, or its `place` error: floor litter
 * and an overhead object over the floor under `at` raised by the lift, a litter on a prop on
 * the highest top of that prop under `at`.
 */
function place(
  object: StaticObject,
  atPath: string,
  props: ReadonlyMap<string, ExpandedProp>,
  prepared: PreparedStatic,
): Placed {
  const on = staticClass(object) === "prop" ? object.on : undefined;
  if (on === undefined) {
    const floor = floorHeightAt(prepared.level, object.at[0], object.at[1]);
    return { ok: true, placement: { object, box: staticBox(object, floor + object.lift) } };
  }
  const slabs = slabsOf(props, on).map(({ slab }) => slab);
  const top = topUnder(slabs, object.at);
  if (top === undefined) {
    return { ok: false, error: placeError(atPath, object.at, `lies over no top of prop ${on}`) };
  }
  const support = { prop: on, slab: top.slab };
  return { ok: true, placement: { object, box: staticBox(object, top.height), support } };
}

/**
 * Places every static object once, in description order, on the admitted rounded slabs. An
 * object outside the interior yields `place` and is not placed further; so does a litter whose
 * `at` lies over no top of its prop. Every error of the step is returned.
 */
export function placeStatics(
  description: Description,
  props: readonly ExpandedProp[],
  prepared: PreparedStatic,
): StaticsStep {
  const byId = new Map(props.map((prop) => [prop.id, prop]));
  const errors: BuildError[] = [];
  const placements: Placement[] = [];
  description.statics.forEach((object, index) => {
    const atPath = keyPath(`${keyPath("", "statics")}[${index}]`, "at");
    if (!insideInterior(prepared, object.at)) {
      errors.push(placeError(atPath, object.at, OUTSIDE));
      return;
    }
    const placed = place(object, atPath, byId, prepared);
    if (placed.ok) placements.push(placed.placement);
    else errors.push(placed.error);
  });
  return errors.length > 0 ? { ok: false, errors } : { ok: true, placements };
}
