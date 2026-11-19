import { recipeAt } from "@level-designer/level-format";
import type { Body, Description, Seal } from "@level-designer/level-format";
import type { SealBox, SlabLooks } from "@level-designer/level-glb";

/**
 * The body of every given finish path, read with the format's `recipeAt`. The admission and
 * the props step have proved every path against the table, so a missing one is a defect.
 */
export function bodiesInUse(
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

/** A seal as `level-glb` draws it: a flat seal as it is, a painted one with its paint keys. */
function sealBox(seal: Seal): SealBox {
  if (seal.finish === undefined) return seal;
  const { id, min, max, color } = seal;
  return { id, min, max, color, paint: seal };
}

/** The static scene's seals and looks: the body of every painted seal's path, and the glows. */
export function sealLooks(description: Description): {
  readonly seals: readonly SealBox[];
  readonly looks: SlabLooks;
} {
  const paths = description.seals.flatMap((seal) =>
    seal.finish === undefined ? [] : [seal.finish],
  );
  const looks = { bodies: bodiesInUse(paths, description), glows: description.glows };
  return { seals: description.seals.map(sealBox), looks };
}
