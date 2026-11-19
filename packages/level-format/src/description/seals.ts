import { LENGTH_SLACK, readFinishPath, readHexColor, readVec3 } from "../shape/index.js";
import type { IdClaims, ShapeNode, Vec3 } from "../shape/index.js";
import { formatLength } from "../slab/index.js";
import type { Seal } from "./description.js";
import { readBoxPaint } from "./paint.js";

/** The thinnest a seal may be along any axis, in metres. */
const MIN_SEAL_THICKNESS = 0.05;

/** The keys of a flat seal, all required. */
const FLAT_KEYS = ["id", "min", "max", "color", "metalness", "roughness"] as const;

/** The required keys of a painted seal, and its optional paint keys. */
const PAINTED_KEYS = ["id", "min", "max", "color", "finish"] as const;
const PAINT_KEYS = ["number", "wear", "seed", "glow"] as const;

/** Records a seal whose box is thinner than the minimum along an axis. */
function checkThickness(node: ShapeNode, min: Vec3, max: Vec3): void {
  const extents = max.map((value, axis) => value - (min[axis] ?? Number.NaN));
  if (extents.some(Number.isNaN) || extents.every((e) => e >= MIN_SEAL_THICKNESS - LENGTH_SLACK)) {
    return;
  }
  const shown = extents.map(formatLength).join(", ");
  node.fail(`max - min of at least ${MIN_SEAL_THICKNESS} m on each axis`, `[${shown}]`);
}

/**
 * One seal: an axis-aligned box with a unique id. A stated `finish` makes it a painted box
 * with the paint keys, and its absence a flat one with `metalness` and `roughness`; each key
 * of the other look is an unknown key. The glow's name is judged once `glows` is read.
 */
export function readSeal(node: ShapeNode, ids: IdClaims): Seal {
  const finishNode = node.optionalField("finish");
  if (finishNode === undefined) {
    node.record(FLAT_KEYS);
  } else {
    node.record(PAINTED_KEYS, PAINT_KEYS);
  }
  const id = ids.claim(node.field("id"));
  const min = readVec3(node.field("min"));
  const max = readVec3(node.field("max"));
  const color = readHexColor(node.field("color"));
  const seal: Seal =
    finishNode === undefined
      ? {
          id,
          min,
          max,
          color,
          metalness: node.field("metalness").numberIn(0, 1),
          roughness: node.field("roughness").numberIn(0, 1),
        }
      : { id, min, max, color, ...readBoxPaint(node, id, readFinishPath(finishNode)) };
  checkThickness(node, min, max);
  return seal;
}
