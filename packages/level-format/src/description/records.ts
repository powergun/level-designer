import { readFinishPath, readLinearRgb } from "../shape/index.js";
import type { IdClaims, ShapeNode } from "../shape/index.js";
import type { Glow, MaterialOverride, Prop } from "./description.js";

/** A colour with a strength from 0 to 100. */
export function readGlow(node: ShapeNode): Glow {
  node.record(["color", "strength"]);
  return {
    color: readLinearRgb(node.field("color")),
    strength: node.field("strength").numberIn(0, 100),
  };
}

/** A base material override; each key is optional, and a `finish` is a path's form. */
export function readOverride(node: ShapeNode): MaterialOverride {
  node.record([], ["tint", "metalness", "roughness", "emissive", "finish"]);
  const tint = node.optionalField("tint");
  const metalness = node.optionalField("metalness");
  const roughness = node.optionalField("roughness");
  const emissive = node.optionalField("emissive");
  const finish = node.optionalField("finish");
  return {
    ...(tint === undefined ? {} : { tint: readLinearRgb(tint) }),
    ...(metalness === undefined ? {} : { metalness: metalness.numberIn(0, 1) }),
    ...(roughness === undefined ? {} : { roughness: roughness.numberIn(0, 1) }),
    ...(emissive === undefined ? {} : { emissive: readGlow(emissive) }),
    ...(finish === undefined ? {} : { finish: readFinishPath(finish) }),
  };
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
