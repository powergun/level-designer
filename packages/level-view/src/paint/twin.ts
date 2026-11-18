import { bodyShade, paintFace, type Rgb, slabFace } from "@level-designer/finish-paint";
import type { DrawnRecipe } from "@level-designer/level-format";
import { vec3, vertexColor } from "three/tsl";
import type { Color, MeshStandardMaterial } from "three/webgpu";
import { type FloatNode, nodeArithmetic as a } from "./node-arithmetic.js";
import { StaticNodeMaterial } from "./static-material.js";
import { footprintNode, slabVertexNodes } from "./surface.js";

/** A glow as a painted material carries it: its linear colour and its unscaled strength. */
export interface TwinGlow {
  readonly color: Rgb<number>;
  readonly strength: number;
}

/** What a twin draws: the drawn recipe, the linear colour `"glow"` takes, and the glow. */
export interface TwinLook {
  readonly recipe: DrawnRecipe;
  readonly light: Rgb<number>;
  readonly glow?: TwinGlow;
}

/** Three numbers lifted to constant scalars. */
function constantRgb(rgb: Rgb<number>): Rgb<FloatNode> {
  return [a.constant(rgb[0]), a.constant(rgb[1]), a.constant(rgb[2])];
}

/** The tint: the vertex colour, read once, times the material's colour as constants. */
function tintNodes(color: Color): Rgb<FloatNode> {
  const tint = vertexColor().xyz.mul(vec3(color.r, color.g, color.b));
  return [tint.x, tint.y, tint.z];
}

/**
 * The painted twin of a GLB material: a static node material that keeps the source's colour,
 * side and shadow side and draws the recipe on the slab vertex data. The vertex colour enters
 * the tint once, the normal stays the surface's own, and a glow emits its colour times its
 * strength times the painter's emission.
 */
export function paintedTwin(source: MeshStandardMaterial, look: TwinLook): StaticNodeMaterial {
  const twin = new StaticNodeMaterial();
  twin.name = source.name;
  twin.color.copy(source.color);
  twin.side = source.side;
  twin.shadowSide = source.shadowSide;
  twin.vertexColors = false;
  const tint = tintNodes(twin.color);
  const face = slabFace(a, slabVertexNodes());
  const surface = {
    face,
    tint,
    light: constantRgb(look.light),
    footprint: footprintNode(face.x, face.y),
  };
  const shade = paintFace(a, look.recipe, bodyShade(a, look.recipe.body, tint), surface);
  twin.colorNode = vec3(...shade.albedo);
  twin.metalnessNode = shade.metalness;
  twin.roughnessNode = shade.roughness;
  if (look.glow !== undefined) {
    const [r, g, b] = look.glow.color;
    const { strength } = look.glow;
    twin.emissiveNode = vec3(r * strength, g * strength, b * strength).mul(shade.emission);
  }
  return twin;
}
