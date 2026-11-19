import { recipeAt } from "@level-designer/level-format";
import type { BoxPaint, PaintedSeal, StaticObject, Vec3 } from "@level-designer/level-format";
import type { BuiltLevel } from "@level-designer/level-pipeline";
import type { FinishSwatch } from "@level-designer/snapshot-render";
import { largestByPath } from "./finish-swatches.js";

/** The look a box's page takes: its paint keys and its `#rrggbb` tint. */
type BoxLook = BoxPaint & { readonly color: string };

/**
 * The swatch of a box drawn as a slab of `size`, `[width, height, thickness]`, with the box's
 * colour text, seed and wear. The build has proved every path against the table, so a missing
 * one is a defect.
 */
function boxSwatch(built: BuiltLevel, box: BoxLook, size: Vec3): FinishSwatch {
  const recipe = recipeAt(built.level.finishes, box.finish);
  if (recipe === undefined) throw new Error(`no finish "${box.finish}" in a built level's table`);
  return {
    label: box.finish,
    recipe,
    tint: box.color,
    subject: { kind: "slab", size, seed: box.seed, wear: box.wear },
  };
}

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
 * placement.
 */
export function boxSwatches(built: BuiltLevel): readonly FinishSwatch[] {
  const largest = largestByPath(built.description.statics, shownArea);
  return [...largest.values()].map((box) => boxSwatch(built, box, box.size));
}

/**
 * A seal's size as a slab's, `[width, height, thickness]`: a seal has no yaw, so its longer
 * plan extent is the width, X on a tie, and the shorter the thickness.
 */
function sealSize(seal: PaintedSeal): Vec3 {
  const dx = seal.max[0] - seal.min[0];
  const dy = seal.max[1] - seal.min[1];
  const dz = seal.max[2] - seal.min[2];
  return [Math.max(dx, dz), dy, Math.min(dx, dz)];
}

/** The area of a seal's large side: its longer plan extent times its height. */
function sideArea(seal: PaintedSeal): number {
  const [width, height] = sealSize(seal);
  return width * height;
}

/**
 * One seal page's swatch per finish path that a painted seal names, in the paths' first use in
 * description order, on the seal with the path's largest side: the seal drawn as a slab of its
 * longer plan extent, its height and its shorter extent, with its colour text, seed and wear.
 */
export function sealSwatches(built: BuiltLevel): readonly FinishSwatch[] {
  const painted = built.description.seals.filter(
    (seal): seal is PaintedSeal => seal.finish !== undefined,
  );
  const largest = largestByPath(painted, sideArea);
  return [...largest.values()].map((seal) => boxSwatch(built, seal, sealSize(seal)));
}
