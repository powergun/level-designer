import { readGlb } from "../container/index.js";
import type { PropMeshes, SlabLooks, SlabMesh } from "./inputs.js";
import { slabMaterial } from "./materials.js";
import { SceneBuilder } from "./scene-builder.js";

/** The key of a slab's material: its finish, or its finish and glow. */
function lookKey(slab: SlabMesh): string {
  return slab.glow === undefined ? slab.finish : `${slab.finish}\n${slab.glow}`;
}

/**
 * Append the slab materials in use: one per finish used without a glow, then one per pair of
 * finish and glow, each in order of first use. Returns the lookup of a slab's material index.
 */
function addSlabMaterials(
  builder: SceneBuilder,
  slabs: readonly SlabMesh[],
  looks: SlabLooks,
): (slab: SlabMesh) => number {
  const indices = new Map<string, number>();
  const materialOf = (slab: SlabMesh): number => {
    const key = lookKey(slab);
    const known = indices.get(key);
    if (known !== undefined) return known;
    const index = builder.addMaterial(slabMaterial(slab, looks));
    indices.set(key, index);
    return index;
  };
  const plain = slabs.filter((slab) => slab.glow === undefined);
  const glowing = slabs.filter((slab) => slab.glow !== undefined);
  for (const slab of [...plain, ...glowing]) materialOf(slab);
  return materialOf;
}

/**
 * Assemble the level scene from the static scene's GLB: one `destructible` object per prop,
 * in the given order, with one mesh node per slab in slab order.
 */
export function assembleLevelScene(
  staticScene: Uint8Array,
  props: readonly PropMeshes[],
  looks: SlabLooks,
): Uint8Array {
  const { document, bin } = readGlb(staticScene);
  const roots = document.scenes[document.scene ?? 0]?.nodes ?? [];
  const builder = new SceneBuilder(document, bin, roots);
  const materialOf = addSlabMaterials(
    builder,
    props.flatMap((prop) => prop.slabs),
    looks,
  );
  for (const prop of props) {
    const primitives = prop.slabs.map((slab) => builder.primitive(slab, materialOf(slab)));
    builder.addObject(prop.id, { role: "destructible", prop: prop.id }, primitives);
  }
  return builder.write();
}
