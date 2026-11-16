import { isUnit, readHexColor, readVec3 } from "../shape/index.js";
import type { ShapeNode, Vec3 } from "../shape/index.js";

/** The four destruction lib materials, in the format's order. */
export const SLAB_MATERIALS = ["wood", "brick", "concrete", "metal"] as const;

/** One destruction lib material. */
export type SlabMaterial = (typeof SLAB_MATERIALS)[number];

/** A unit quaternion `[x, y, z, w]`, local to world. */
export type Quaternion = readonly [number, number, number, number];

/**
 * One destruction lib wall model: a box of `[width, height, thickness]` with one material,
 * one `#rrggbb` colour and one rigid pose. `position` is the world position of the base
 * centre; `rotation` turns the slab's frame into the level frame.
 */
export interface Slab {
  readonly size: Vec3;
  readonly material: SlabMaterial;
  readonly color: string;
  readonly position: Vec3;
  readonly rotation: Quaternion;
}

/** A unit quaternion `[x, y, z, w]`. */
function readRotation(node: ShapeNode): Quaternion {
  const read = node.tuple(4).map((n) => n.number());
  const [x = Number.NaN, y = Number.NaN, z = Number.NaN, w = Number.NaN] = read;
  if (read.every((component) => !Number.isNaN(component)) && !isUnit(read)) {
    node.fail("a unit quaternion [x, y, z, w]");
  }
  return [x, y, z, w];
}

/** The shape of one slab record; the slab admission owns the size limits. */
export function readSlab(node: ShapeNode): Slab {
  node.record(["size", "material", "color", "position", "rotation"]);
  return {
    size: readVec3(node.field("size")),
    material: node.field("material").oneOf(SLAB_MATERIALS),
    color: readHexColor(node.field("color")),
    position: readVec3(node.field("position")),
    rotation: readRotation(node.field("rotation")),
  };
}

/** The slab with its keys in the canonical order of the level `.json`. */
export function canonicalSlab(slab: Slab): Slab {
  const { size, material, color, position, rotation } = slab;
  return { size, material, color, position, rotation };
}
