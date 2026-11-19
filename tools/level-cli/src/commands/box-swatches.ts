import { recipeAt } from "@level-designer/level-format";
import type { StaticObject } from "@level-designer/level-format";
import type { BuiltLevel } from "@level-designer/level-pipeline";
import type { FinishSwatch } from "@level-designer/snapshot-render";
import { largestByPath } from "./finish-swatches.js";

/**
 * The area of a static object's largest shown face: its width times the larger of its height
 * and its length. The page shows its upper face and its sides along the width.
 */
function shownArea(box: StaticObject): number {
  const [width, height, length] = box.size;
  return width * Math.max(height, length);
}

/**
 * One box page's swatch per finish path that a static object names, in the paths' first use
 * in description order: the box drawn as a slab, its width, height and length as the
 * thickness, with its colour text, seed and wear. It reads the description alone, never the
 * placement. The build has proved every path against the table, so a missing one is a defect.
 */
export function boxSwatches(built: BuiltLevel): readonly FinishSwatch[] {
  return [...largestByPath(built.description.statics, shownArea)].map(([path, box]) => {
    const recipe = recipeAt(built.level.finishes, path);
    if (recipe === undefined) throw new Error(`no finish "${path}" in a built level's table`);
    return {
      label: path,
      recipe,
      tint: box.color,
      subject: { kind: "slab", size: box.size, seed: box.seed, wear: box.wear },
    };
  });
}
