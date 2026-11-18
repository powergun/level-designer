import { assembleLevelScene } from "@level-designer/level-glb";
import type { PropMeshes } from "@level-designer/level-glb";
import { recipeAt } from "@level-designer/level-format";
import type { Body, Description } from "@level-designer/level-format";
import { meshSlab } from "@level-designer/slab-model";
import type { ExpandedProp } from "./props.js";

/**
 * The body of every finish path the slabs use, read with the format's `recipeAt`. The props
 * step has proved every path against the table, so a missing one is a defect.
 */
function bodiesInUse(
  props: readonly ExpandedProp[],
  description: Description,
): ReadonlyMap<string, Body> {
  const bodies = new Map<string, Body>();
  for (const prop of props) {
    for (const { slab } of prop.slabs) {
      if (bodies.has(slab.finish)) continue;
      const recipe = recipeAt(description.finishes, slab.finish);
      if (recipe === undefined) throw new Error(`no finish "${slab.finish}" after the props step`);
      bodies.set(slab.finish, recipe.body);
    }
  }
  return bodies;
}

/**
 * Meshes every rounded slab with destruction lib's mesher and appends one object per prop to
 * the static scene. Each slab draws with the material of its finish path and optional glow.
 */
export function levelScene(
  staticGlb: Uint8Array,
  props: readonly ExpandedProp[],
  description: Description,
): Uint8Array {
  const meshes: PropMeshes[] = props.map((prop) => ({
    id: prop.id,
    slabs: prop.slabs.map(({ slab, glow }) => {
      const mesh = { ...meshSlab(slab), finish: slab.finish };
      return glow === undefined ? mesh : { ...mesh, glow };
    }),
  }));
  const looks = { bodies: bodiesInUse(props, description), glows: description.glows };
  return assembleLevelScene(staticGlb, meshes, looks);
}
