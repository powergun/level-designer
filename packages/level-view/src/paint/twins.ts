import { type HallBox, linearFromSrgbHex } from "@level-designer/finish-paint";
import { type DrawnRecipe, type FinishTable, recipeAt } from "@level-designer/level-format";
import { type Material, Mesh, MeshStandardMaterial, type Object3D } from "three/webgpu";
import { paintedTwin, type TwinGlow, type TwinLook } from "./twin.js";
import { stageWrap } from "./wrap.js";

/** What a material's `extras` say about its paint: its finish path, and its glow's strength. */
interface PaintExtras {
  readonly finish: string;
  readonly glowStrength?: number;
}

/**
 * Read a loaded material's `extras` (three's `userData`) once: a painted material names its
 * finish path, and one with a glow its unscaled strength. A material without a path is
 * unpainted. The GLB is persisted data, so a wrong shape fails loudly.
 */
function paintExtras(material: Material): PaintExtras | undefined {
  const { finish, glowStrength } = material.userData;
  if (finish === undefined) return undefined;
  if (typeof finish !== "string")
    throw new Error(`material "${material.name}": finish is not text`);
  if (glowStrength !== undefined && typeof glowStrength !== "number") {
    throw new Error(`material "${material.name}": glowStrength is not a number`);
  }
  return glowStrength === undefined ? { finish } : { finish, glowStrength };
}

/** The drawn recipe a painted material names; a path the level's table lacks throws. */
function recipeOf(source: Material, extras: PaintExtras, table: FinishTable): DrawnRecipe {
  const recipe = recipeAt(table, extras.finish);
  if (recipe === undefined) {
    throw new Error(
      `material "${source.name}" names the finish "${extras.finish}", which the level's table lacks`,
    );
  }
  return recipe;
}

/** The look of a painted slab or box material: its recipe, its glow from the emissive factor. */
function lookOf(source: MeshStandardMaterial, recipe: DrawnRecipe, extras: PaintExtras): TwinLook {
  if (extras.glowStrength === undefined) {
    return { recipe, light: linearFromSrgbHex(recipe.light) };
  }
  const { r, g, b } = source.emissive;
  const glow: TwinGlow = { color: [r, g, b], strength: extras.glowStrength };
  return { recipe, light: glow.color, glow };
}

/**
 * True when a slab's recipe draws what the GLB's fallback cannot: a layer, or a body shade
 * other than 1. The fallback already holds a plain body's metalness, roughness and glow.
 */
function drawsBeyondFallback(recipe: DrawnRecipe): boolean {
  return recipe.layers.length > 0 || recipe.body.shade !== 1;
}

/** The level facts a painted material draws by: the finish table and the interior box. */
interface PaintFacts {
  readonly finishes: FinishTable;
  readonly interior: HallBox<number>;
}

/**
 * The material a mesh draws with, decided once per source on its first mesh. A mesh with the
 * slab data (`_slab`) takes the painted twin of a recipe beyond the fallback; any other mesh
 * is the stage's and takes the stage wrap of a hall finish with a layer. Else the source.
 */
function drawnWith(mesh: Mesh, source: Material, facts: PaintFacts): Material {
  const extras = paintExtras(source);
  if (extras === undefined) return source;
  if (!(source instanceof MeshStandardMaterial)) {
    throw new Error(`material "${source.name}" is painted but not a standard material`);
  }
  const recipe = recipeOf(source, extras, facts.finishes);
  if (mesh.geometry.hasAttribute("_slab")) {
    return drawsBeyondFallback(recipe)
      ? paintedTwin(source, lookOf(source, recipe, extras))
      : source;
  }
  if (recipe.layers.length === 0) return source;
  return stageWrap(source, { recipe, light: linearFromSrgbHex(recipe.light) }, facts.interior);
}

/**
 * Paint a loaded level: every mesh whose material names a finish path draws with its painted
 * twin or its stage wrap, one per source material, shared by its meshes. A plain slab path at
 * shade 1, a hall path without a layer and an unpainted material keep the GLB's material. A
 * path the level's table lacks throws, naming the material.
 */
export function paintLevel(root: Object3D, finishes: FinishTable, interior: HallBox<number>): void {
  const facts = { finishes, interior };
  const drawn = new Map<Material, Material>();
  root.traverse((object) => {
    if (!(object instanceof Mesh) || Array.isArray(object.material)) return;
    const source = object.material;
    const material = drawn.get(source) ?? drawnWith(object, source, facts);
    drawn.set(source, material);
    object.material = material;
  });
}
