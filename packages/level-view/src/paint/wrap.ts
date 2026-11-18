import {
  type HallBox,
  hallFace,
  paintFace,
  type Rgb,
  type Shade,
  type Vec3,
} from "@level-designer/finish-paint";
import type { DrawnRecipe } from "@level-designer/level-format";
import { materialColor, materialMetalness, materialRoughness, vec3 } from "three/tsl";
import type { MeshStandardMaterial } from "three/webgpu";
import { type FloatNode, nodeArithmetic as a } from "./node-arithmetic.js";
import { StaticNodeMaterial } from "./static-material.js";
import { footprintNode, hallVertexNodes } from "./surface.js";

/** What a wrap draws: the hall finish's drawn recipe and the linear colour `"glow"` takes. */
export interface WrapLook {
  readonly recipe: DrawnRecipe;
  readonly light: Rgb<number>;
}

/** Three numbers lifted to constant scalars. */
function constantVec3([x, y, z]: Vec3<number>): Vec3<FloatNode> {
  return [a.constant(x), a.constant(y), a.constant(z)];
}

/** A box of plain numbers lifted to constant scalars. */
function constantBox(box: HallBox<number>): HallBox<FloatNode> {
  return { low: constantVec3(box.low), size: constantVec3(box.size) };
}

/**
 * The stage material's own look as the painter's base shade: its colour factor times its map
 * as the albedo, which is also the tint, and its metalness and roughness with their maps.
 */
function sourceShade(): Shade<FloatNode> {
  const color = vec3(materialColor);
  return {
    albedo: [color.x, color.y, color.z],
    metalness: materialMetalness,
    roughness: materialRoughness,
    emission: a.constant(0),
  };
}

/**
 * The stage wrap of a stage material that names a hall finish: the source as three's scene pass
 * converts it, as a static material, with the role's layers mixed over its own colour,
 * metalness and roughness on the hall's frame. Uncovered, it shades as its source; its other
 * slots stay the source's, and its colour is opaque; see @packages/level-view/docs/KNOWLEDGE.md.
 */
export function stageWrap(
  source: MeshStandardMaterial,
  look: WrapLook,
  interior: HallBox<number>,
): StaticNodeMaterial {
  const wrap = new StaticNodeMaterial();
  for (const key in source) Reflect.set(wrap, key, Reflect.get(source, key));
  const { position, normal } = hallVertexNodes();
  const face = hallFace(a, position, normal, constantBox(interior));
  const base = sourceShade();
  const surface = {
    face,
    tint: base.albedo,
    light: constantVec3(look.light),
    footprint: footprintNode(face.x, face.y),
  };
  const shade = paintFace(a, look.recipe, base, surface);
  wrap.colorNode = vec3(...shade.albedo);
  wrap.metalnessNode = shade.metalness;
  wrap.roughnessNode = shade.roughness;
  return wrap;
}
