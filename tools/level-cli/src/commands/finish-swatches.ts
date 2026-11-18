import { recipeAt } from "@level-designer/level-format";
import type { Level, Slab } from "@level-designer/level-format";
import type { FinishSwatch } from "@level-designer/snapshot-render";

/** The area of a slab's outside face, its width times its height. */
function outsideArea(slab: Slab): number {
  return slab.size[0] * slab.size[1];
}

/**
 * The slab with the largest outside face of each finish path in use, in order of first use:
 * props in level order, slabs in slab order. A later slab takes a path only with a strictly
 * larger face, so on a tie the first slab keeps it.
 */
function largestByPath(level: Level): ReadonlyMap<string, Slab> {
  const largest = new Map<string, Slab>();
  for (const prop of level.props) {
    for (const slab of prop.slabs) {
      const kept = largest.get(slab.finish);
      if (kept === undefined || outsideArea(slab) > outsideArea(kept)) {
        largest.set(slab.finish, slab);
      }
    }
  }
  return largest;
}

/**
 * One finish page's swatch per finish path in use: the path, its drawn recipe from the level's
 * table, and the slab of its largest outside face with that slab's colour text, size, seed
 * and wear. The build has proved every path against the table, so a missing one is a defect.
 */
export function finishSwatches(level: Level): readonly FinishSwatch[] {
  return [...largestByPath(level)].map(([path, slab]) => {
    const recipe = recipeAt(level.finishes, path);
    if (recipe === undefined) throw new Error(`no finish "${path}" in a built level's table`);
    return {
      label: path,
      recipe,
      tint: slab.color,
      subject: { kind: "slab", size: slab.size, seed: slab.seed, wear: slab.wear },
    };
  });
}
