import { recipeAt } from "@level-designer/level-format";
import type { Level, Slab } from "@level-designer/level-format";
import type { FinishSwatch } from "@level-designer/snapshot-render";

/** The area of a slab's outside face, its width times its height. */
function outsideArea(slab: Slab): number {
  return slab.size[0] * slab.size[1];
}

/**
 * The item with the largest face of each finish path, in order of the paths' first use. A
 * later item takes a path only with a strictly larger face, so on a tie the first keeps it
 * and the same level gives the same pages.
 */
export function largestByPath<T extends { readonly finish: string }>(
  items: Iterable<T>,
  area: (item: T) => number,
): ReadonlyMap<string, T> {
  const largest = new Map<string, T>();
  for (const item of items) {
    const kept = largest.get(item.finish);
    if (kept === undefined || area(item) > area(kept)) largest.set(item.finish, item);
  }
  return largest;
}

/**
 * One finish page's swatch per finish path in use, on the slab of its largest outside face,
 * with that slab's colour text, size, seed and wear; props in level order, slabs in slab
 * order. The build has proved every path against the table, so a missing one is a defect.
 */
export function finishSwatches(level: Level): readonly FinishSwatch[] {
  const slabs = level.props.flatMap((prop) => prop.slabs);
  return [...largestByPath(slabs, outsideArea)].map(([path, slab]) => {
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
