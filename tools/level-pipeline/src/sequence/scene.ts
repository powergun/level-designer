import { assembleLevelScene } from "@level-designer/level-glb";
import type { PropMeshes, StaticBox } from "@level-designer/level-glb";
import type { Description } from "@level-designer/level-format";
import { meshSlab } from "@level-designer/slab-model";
import { bodiesInUse } from "./looks.js";
import type { ExpandedProp } from "./props.js";
import type { Placement } from "./statics.js";

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
    slabs: prop.slabs.map((slab) => {
      const mesh = { ...meshSlab(slab), finish: slab.finish };
      return prop.glow === undefined ? mesh : { ...mesh, glow: prop.glow };
    }),
  }));
  const paths = [
    ...props.flatMap((prop) => prop.slabs.map((slab) => slab.finish)),
    ...placements.map(({ object }) => object.finish),
  ];
  const looks = { bodies: bodiesInUse(paths, description), glows: description.glows };
  return assembleLevelScene(staticGlb, meshes, looks, placements.map(staticBox));
}
