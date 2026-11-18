import { isUnit, readFinishPath, readHexColor, readVec3 } from "../shape/index.js";
import type { ShapeNode, Vec3 } from "../shape/index.js";

/** The four destruction lib materials, in the format's order. */
export const SLAB_MATERIALS = ["wood", "brick", "concrete", "metal"] as const;

/** One destruction lib material. */
export type SlabMaterial = (typeof SLAB_MATERIALS)[number];

/** The highest seed: seeds lie from 0 to 4,095, the range the lattice hash keeps apart. */
export const MAX_SEED = 4095;

/** The highest number a slab carries for a legend's six digits. */
const MAX_NUMBER = 999_999;

/** A slab's four finish keys: its finish path, its number, its seed and its wear. */
export interface SlabFinish {
  readonly finish: string;
  readonly number: number;
  readonly seed: number;
  readonly wear: number;
}

/** A unit quaternion `[x, y, z, w]`, local to world. */
export type Quaternion = readonly [number, number, number, number];

/**
 * One destruction lib wall model: a box of `[width, height, thickness]` with one material,
 * one `#rrggbb` colour, one rigid pose and its four finish keys. `position` is the world
 * position of the base centre; `rotation` turns the slab's frame into the level frame.
 */
export interface Slab extends SlabFinish {
  readonly size: Vec3;
  readonly material: SlabMaterial;
  readonly color: string;
  readonly position: Vec3;
  readonly rotation: Quaternion;
}

/** The keys of a slab record, in the canonical order of the level `.json`. */
const SLAB_KEYS = [
  "size",
  "material",
  "color",
  "position",
  "rotation",
  "finish",
  "number",
  "seed",
  "wear",
] as const;

/** A unit quaternion `[x, y, z, w]`. */
function readRotation(node: ShapeNode): Quaternion {
  const read = node.tuple(4).map((n) => n.number());
  const [x = Number.NaN, y = Number.NaN, z = Number.NaN, w = Number.NaN] = read;
  if (read.every((component) => !Number.isNaN(component)) && !isUnit(read)) {
    node.fail("a unit quaternion [x, y, z, w]");
  }
  return [x, y, z, w];
}

/**
 * The shape of one slab record; the slab admission owns the size limits, and the decoder
 * judges the finish path against the level's table.
 */
export function readSlab(node: ShapeNode): Slab {
  node.record(SLAB_KEYS);
  return {
    size: readVec3(node.field("size")),
    material: node.field("material").oneOf(SLAB_MATERIALS),
    color: readHexColor(node.field("color")),
    position: readVec3(node.field("position")),
    rotation: readRotation(node.field("rotation")),
    finish: readFinishPath(node.field("finish")),
    number: node.field("number").integerIn(0, MAX_NUMBER),
    seed: node.field("seed").integerIn(0, MAX_SEED),
    wear: node.field("wear").numberIn(0, 1),
  };
}

/** The slab with its keys in the canonical order of the level `.json`. */
export function canonicalSlab(slab: Slab): Slab {
  const { size, material, color, position, rotation, finish, number, seed, wear } = slab;
  return { size, material, color, position, rotation, finish, number, seed, wear };
}
