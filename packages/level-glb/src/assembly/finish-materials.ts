import type { GltfDocument } from "../container/index.js";
import type { SlabLooks } from "./inputs.js";
import type { FinishUse } from "./materials.js";
import { finishMaterial } from "./materials.js";
import type { SceneBuilder } from "../builder/index.js";

/** The key of a finish material: its finish path, or its finish path and glow. */
function lookKey(use: FinishUse): string {
  return use.glow === undefined ? use.finish : `${use.finish}\n${use.glow}`;
}

/**
 * Append the finish materials in use that `known` lacks: one per finish path used without a
 * glow, then one per pair of path and glow, each in order of first use. `known` maps a use's
 * key to the material a scene already holds. Returns the lookup of a use's material.
 */
export function addFinishMaterials(
  builder: SceneBuilder,
  uses: readonly FinishUse[],
  looks: SlabLooks,
  known: ReadonlyMap<string, number>,
): (use: FinishUse) => number {
  const indices = new Map(known);
  const materialOf = (use: FinishUse): number => {
    const key = lookKey(use);
    const found = indices.get(key);
    if (found !== undefined) return found;
    const index = builder.addMaterial(finishMaterial(use, looks));
    indices.set(key, index);
    return index;
  };
  const plain = uses.filter((use) => use.glow === undefined);
  const glowing = uses.filter((use) => use.glow !== undefined);
  for (const use of [...plain, ...glowing]) materialOf(use);
  return materialOf;
}

/** The finish use a written finish material's `extras` name, or none for any other material. */
function finishUseOf(extras: Readonly<Record<string, unknown>> | undefined): FinishUse | undefined {
  const finish = extras?.finish;
  if (typeof finish !== "string") return undefined;
  const glow = extras?.glow;
  return typeof glow === "string" ? { finish, glow } : { finish };
}

/** The material of a mesh node's first primitive. */
function meshNodeMaterial(document: GltfDocument, node: number): number | undefined {
  const mesh = document.nodes[node]?.mesh;
  return mesh === undefined ? undefined : document.meshes?.[mesh]?.primitives[0]?.material;
}

/** The material of a root's one mesh node when the root is a `seal` object, else none. */
function sealMaterialAt(document: GltfDocument, root: number): number | undefined {
  const node = document.nodes[root];
  const child = node?.children?.[0];
  if (node?.extras?.role !== "seal" || child === undefined) return undefined;
  return meshNodeMaterial(document, child);
}

/**
 * The finish materials of the painted seals in a static scene, by use key. It reads the roots
 * with the role `seal` and their mesh's material, never a name, so a stage material that carries
 * a hall finish's path is never taken.
 */
export function sealFinishMaterials(document: GltfDocument): ReadonlyMap<string, number> {
  const known = new Map<string, number>();
  for (const root of document.scenes[document.scene ?? 0]?.nodes ?? []) {
    const material = sealMaterialAt(document, root);
    const use = finishUseOf(document.materials?.[material ?? -1]?.extras);
    if (material !== undefined && use !== undefined) known.set(lookKey(use), material);
  }
  return known;
}
