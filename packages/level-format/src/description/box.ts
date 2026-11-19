import { orientedBox } from "../slab/index.js";
import type { SlabBox } from "../slab/index.js";
import type { StaticClass, StaticObject } from "./description.js";

/** Radians per degree. */
const RADIANS = Math.PI / 180;

/**
 * Reads a static object's `at`, `yaw` and `size` as an oriented box whose underside lies at
 * the height `underside`. Its frame is the level's turned by `yaw` about +Y, as a prop's, so
 * a positive yaw turns the length (+Z) toward +X.
 */
export function staticBox(object: StaticObject, underside: number): SlabBox {
  const half = (object.yaw * RADIANS) / 2;
  const [x, z] = object.at;
  return orientedBox([x, underside, z], [0, Math.sin(half), 0, Math.cos(half)], object.size);
}

/**
 * The class a static object's keys name: `on` makes litter on a prop, a positive `lift` an
 * overhead object, and neither floor litter.
 */
export function staticClass(object: StaticObject): StaticClass {
  if (object.on !== undefined) {
    return "prop";
  }
  return object.lift > 0 ? "overhead" : "floor";
}
