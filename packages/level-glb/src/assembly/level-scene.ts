import { readGlb } from "../container/index.js";
import type { GltfNode } from "../container/index.js";
import type { PropMeshes, SlabLooks, StaticBox } from "./inputs.js";
import type { FinishUse } from "./materials.js";
import { finishMaterial } from "./materials.js";
import { paintedBoxGeometry } from "./painted-box.js";
import { SceneBuilder } from "../builder/index.js";

/** The key of a finish material: its finish path, or its finish path and glow. */
function lookKey(use: FinishUse): string {
  return use.glow === undefined ? use.finish : `${use.finish}\n${use.glow}`;
}

/**
 * Append the finish materials in use: one per finish path used without a glow, then one per
 * pair of path and glow, each in order of first use. Returns the lookup of a use's material.
 */
function addFinishMaterials(
  builder: SceneBuilder,
  uses: readonly FinishUse[],
  looks: SlabLooks,
): (use: FinishUse) => number {
  const indices = new Map<string, number>();
  const materialOf = (use: FinishUse): number => {
    const key = lookKey(use);
    const known = indices.get(key);
    if (known !== undefined) return known;
    const index = builder.addMaterial(finishMaterial(use, looks));
    indices.set(key, index);
    return index;
  };
  const plain = uses.filter((use) => use.glow === undefined);
  const glowing = uses.filter((use) => use.glow !== undefined);
  for (const use of [...plain, ...glowing]) materialOf(use);
  return materialOf;
}

/** A static object's node `extras`: its role, and a litter's support as a mesh node name. */
function staticExtras(object: StaticBox): GltfNode["extras"] {
  const { support } = object;
  if (support === undefined) return { role: "static" };
  return { role: "static", support: `${support.prop}/${support.slab}` };
}

/**
 * Assemble the level scene from the static scene's GLB: one `static` object per static object,
 * then one `destructible` object per prop, each in the given order. A prop has one mesh node
 * per slab in slab order; a static object has one painted box. Both draw with the shared
 * material of their finish path and glow.
 */
export function assembleLevelScene(
  staticScene: Uint8Array,
  props: readonly PropMeshes[],
  looks: SlabLooks,
  statics: readonly StaticBox[],
): Uint8Array {
  const { document, bin } = readGlb(staticScene);
  const roots = document.scenes[document.scene ?? 0]?.nodes ?? [];
  const builder = new SceneBuilder(document, bin, roots);
  const uses = [...statics.map((object) => object.paint), ...props.flatMap((prop) => prop.slabs)];
  const materialOf = addFinishMaterials(builder, uses, looks);
  for (const object of statics) {
    const geometry = paintedBoxGeometry(object.box, object.color, object.paint);
    const primitive = builder.primitive(geometry, materialOf(object.paint));
    builder.addObject(object.id, staticExtras(object), [primitive]);
  }
  for (const prop of props) {
    const primitives = prop.slabs.map((slab) =>
      builder.primitive({ ...slab, paint: slab }, materialOf(slab)),
    );
    builder.addObject(prop.id, { role: "destructible", prop: prop.id }, primitives);
  }
  return builder.write();
}
