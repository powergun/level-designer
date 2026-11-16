import { assembleLevelScene } from "@level-designer/level-glb";
import type { PropMeshes } from "@level-designer/level-glb";
import type { Description } from "@level-designer/level-format";
import { meshSlab } from "@level-designer/slab-model";
import type { ExpandedProp } from "./props.js";

/**
 * Meshes every rounded slab with destruction lib's mesher and appends one object per prop to
 * the static scene. Each slab takes its material's finish and its optional glow.
 */
export function levelScene(
  staticGlb: Uint8Array,
  props: readonly ExpandedProp[],
  description: Description,
): Uint8Array {
  const meshes: PropMeshes[] = props.map((prop) => ({
    id: prop.id,
    slabs: prop.slabs.map(({ slab, glow }) => {
      const mesh = { ...meshSlab(slab), finish: slab.material };
      return glow === undefined ? mesh : { ...mesh, glow };
    }),
  }));
  return assembleLevelScene(staticGlb, meshes, {
    finishes: description.finishes,
    glows: description.glows,
  });
}
