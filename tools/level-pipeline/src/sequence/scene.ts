import { assembleLevelScene } from "@level-designer/level-glb";
import type { PropMeshes, StaticBox } from "@level-designer/level-glb";
import { recipeAt } from "@level-designer/level-format";
import type { Body, Description } from "@level-designer/level-format";
import { meshSlab } from "@level-designer/slab-model";
import type { ExpandedProp } from "./props.js";
import type { Placement } from "./statics.js";

/**
 * The body of every finish path the slabs and the static objects use, read with the format's
 * `recipeAt`. The props step and the admission have proved every path against the table, so
 * a missing one is a defect.
 */
function bodiesInUse(
  paths: readonly string[],
  description: Description,
): ReadonlyMap<string, Body> {
  const bodies = new Map<string, Body>();
  for (const path of paths) {
    if (bodies.has(path)) continue;
    const recipe = recipeAt(description.finishes, path);
    if (recipe === undefined) throw new Error(`no finish "${path}" after the admission`);
    bodies.set(path, recipe.body);
  }
  return bodies;
}

/** A placed static object as `level-glb` draws it: its box, tint, paint and support. */
function staticBox({ object, box, support }: Placement): StaticBox {
  const drawn = { id: object.id, box, color: object.color, paint: object };
  return support === undefined ? drawn : { ...drawn, support };
}

/**
 * Meshes every rounded slab with destruction lib's mesher and appends to the static scene one
 * object per static object, then one per prop. Each slab and box draws with the material of
 * its finish path and optional glow.
 */
export function levelScene(
  staticGlb: Uint8Array,
  props: readonly ExpandedProp[],
  placements: readonly Placement[],
  description: Description,
): Uint8Array {
  const meshes: PropMeshes[] = props.map((prop) => ({
    id: prop.id,
    slabs: prop.slabs.map(({ slab, glow }) => {
      const mesh = { ...meshSlab(slab), finish: slab.finish };
      return glow === undefined ? mesh : { ...mesh, glow };
    }),
  }));
  const paths = [
    ...props.flatMap((prop) => prop.slabs.map(({ slab }) => slab.finish)),
    ...placements.map(({ object }) => object.finish),
  ];
  const looks = { bodies: bodiesInUse(paths, description), glows: description.glows };
  return assembleLevelScene(staticGlb, meshes, looks, placements.map(staticBox));
}
