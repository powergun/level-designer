import { LENGTH_SLACK, readFinishPath, readHexColor, readOptional } from "../shape/index.js";
import type { IdClaims, ShapeNode } from "../shape/index.js";
import type { StaticObject } from "./description.js";
import { judgeGlow, readBoxPaint } from "./paint.js";

/** The shortest side of a static object, in metres. */
const MIN_SIDE = 0.02;

/** A static object's required keys, and its optional ones with the paint keys. */
const REQUIRED_KEYS = ["id", "at", "size", "color", "finish"] as const;
const OPTIONAL_KEYS = ["yaw", "lift", "on", "number", "wear", "seed", "glow"] as const;

/** One side of a box, at least the shortest side within the length slack. */
function readSide(node: ShapeNode): number {
  const side = node.number();
  if (side < MIN_SIDE - LENGTH_SLACK) {
    node.fail(`a side of at least ${MIN_SIDE} m`);
  }
  return side;
}

/** A string that `known` holds; `requirement` names what it must be. */
function readKnown(node: ShapeNode, known: ReadonlySet<string>, requirement: string): string {
  const name = node.string();
  if (typeof node.value === "string" && !known.has(name)) {
    node.fail(requirement);
  }
  return name;
}

/** A lift of at least 0, or 0 when absent; any stated lift beside an `on` is refused. */
function readLift(node: ShapeNode | undefined, besideOn: boolean): number {
  if (node === undefined) {
    return 0;
  }
  if (besideOn) {
    node.fail("no lift beside on");
    return 0;
  }
  return node.numberAtLeast(0);
}

/**
 * One static object with every default filled. An `on` names one of `props`, and a stated
 * `lift` beside it is refused, even 0. A `glow` names one of `glows`, unknown when that map
 * failed.
 */
export function readStatic(
  node: ShapeNode,
  ids: IdClaims,
  glows: ReadonlySet<string> | undefined,
  props: ReadonlySet<string>,
): StaticObject {
  node.record(REQUIRED_KEYS, OPTIONAL_KEYS);
  const id = ids.claim(node.field("id"));
  const [x = Number.NaN, z = Number.NaN] = node
    .field("at")
    .tuple(2)
    .map((n) => n.number());
  const yaw = readOptional(node, "yaw", (n) => n.number(), 0);
  const [width = Number.NaN, height = Number.NaN, length = Number.NaN] = node
    .field("size")
    .tuple(3)
    .map(readSide);
  const onNode = node.optionalField("on");
  const lift = readLift(node.optionalField("lift"), onNode !== undefined);
  const on = onNode === undefined ? undefined : readKnown(onNode, props, "the id of a prop");
  const color = readHexColor(node.field("color"));
  const paint = readBoxPaint(node, id, readFinishPath(node.field("finish")));
  judgeGlow(node, glows);
  const pose = { id, at: [x, z] as const, yaw, size: [width, height, length] as const, lift };
  return { ...pose, ...(on === undefined ? {} : { on }), color, ...paint };
}
