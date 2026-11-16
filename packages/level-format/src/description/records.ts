import { LENGTH_SLACK, readHexColor, readLinearRgb, readVec3 } from "../shape/index.js";
import type { IdClaims, ShapeNode } from "../shape/index.js";
import type { Finish, Glow, MaterialOverride, Prop, Seal } from "./description.js";

/** The thinnest a seal may be along any axis, in metres. */
const MIN_SEAL_THICKNESS = 0.05;

/** A colour with a strength from 0 to 100. */
export function readGlow(node: ShapeNode): Glow {
  node.record(["color", "strength"]);
  return {
    color: readLinearRgb(node.field("color")),
    strength: node.field("strength").numberIn(0, 100),
  };
}

/** A metalness and a roughness, each from 0 to 1. */
export function readFinish(node: ShapeNode): Finish {
  node.record(["metalness", "roughness"]);
  return {
    metalness: node.field("metalness").numberIn(0, 1),
    roughness: node.field("roughness").numberIn(0, 1),
  };
}

/** A base material override; each key is optional. */
export function readOverride(node: ShapeNode): MaterialOverride {
  node.record([], ["tint", "metalness", "roughness", "emissive"]);
  const tint = node.optionalField("tint");
  const metalness = node.optionalField("metalness");
  const roughness = node.optionalField("roughness");
  const emissive = node.optionalField("emissive");
  return {
    ...(tint === undefined ? {} : { tint: readLinearRgb(tint) }),
    ...(metalness === undefined ? {} : { metalness: metalness.numberIn(0, 1) }),
    ...(roughness === undefined ? {} : { roughness: roughness.numberIn(0, 1) }),
    ...(emissive === undefined ? {} : { emissive: readGlow(emissive) }),
  };
}

/** Records a seal whose box is thinner than the minimum along an axis. */
function checkThickness(node: ShapeNode, seal: Seal): void {
  const extents = seal.max.map((value, axis) => value - (seal.min[axis] ?? Number.NaN));
  if (extents.some(Number.isNaN) || extents.every((e) => e >= MIN_SEAL_THICKNESS - LENGTH_SLACK)) {
    return;
  }
  const shown = extents.map((extent) => Number(extent.toFixed(4))).join(", ");
  node.fail(`max - min of at least ${MIN_SEAL_THICKNESS} m on each axis`, `[${shown}]`);
}

/** One seal: an axis-aligned box with a unique id and a flat look. */
export function readSeal(node: ShapeNode, ids: IdClaims): Seal {
  node.record(["id", "min", "max", "color", "metalness", "roughness"]);
  const seal: Seal = {
    id: ids.claim(node.field("id")),
    min: readVec3(node.field("min")),
    max: readVec3(node.field("max")),
    color: readHexColor(node.field("color")),
    metalness: node.field("metalness").numberIn(0, 1),
    roughness: node.field("roughness").numberIn(0, 1),
  };
  checkThickness(node, seal);
  return seal;
}

/** One prop; its kind and parameters are left to `prop-kit`. */
export function readProp(node: ShapeNode, ids: IdClaims): Prop {
  node.record(["id", "kind", "at", "yaw", "params"]);
  const id = ids.claim(node.field("id"));
  const kind = node.field("kind").string();
  const [x = Number.NaN, z = Number.NaN] = node
    .field("at")
    .tuple(2)
    .map((n) => n.number());
  const yaw = node.field("yaw").number();
  const params = node.field("params").entries();
  return { id, kind, at: [x, z], yaw, params: new Map(params.map(([k, n]) => [k, n.value])) };
}
