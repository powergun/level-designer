import { seedOfId } from "../finish/index.js";
import { readOptional } from "../shape/index.js";
import type { ShapeNode } from "../shape/index.js";
import { MAX_NUMBER, MAX_SEED } from "../slab/index.js";
import type { BoxPaint } from "./description.js";

/** A box's default wear. */
const DEFAULT_WEAR = 0.3;

/**
 * A box's paint keys beside its admitted finish path, on a record whose keys the caller has
 * checked. The seed defaults to the hash of the box's id; the glow's name is read as text,
 * and `judgeGlow` judges it against `glows`.
 */
export function readBoxPaint(node: ShapeNode, id: string, finish: string): BoxPaint {
  const number = readOptional(node, "number", (n) => n.integerIn(0, MAX_NUMBER), 0);
  const wear = readOptional(node, "wear", (n) => n.numberIn(0, 1), DEFAULT_WEAR);
  const seed = readOptional(node, "seed", (n) => n.integerIn(0, MAX_SEED), seedOfId(id));
  const glow = node.optionalField("glow")?.string();
  return { finish, number, wear, seed, ...(glow === undefined ? {} : { glow }) };
}

/**
 * Records a box's `glow` whose name `glows` lacks. It judges nothing when `glows` is unknown,
 * because the map itself failed its shape, or when the value is no text.
 */
export function judgeGlow(node: ShapeNode, glows: ReadonlySet<string> | undefined): void {
  const glow = node.optionalField("glow");
  if (glow === undefined || glows === undefined || typeof glow.value !== "string") {
    return;
  }
  if (!glows.has(glow.value)) {
    glow.fail("a name of glows");
  }
}
