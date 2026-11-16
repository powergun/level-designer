import type { GltfDocument, GltfMaterial, GltfMesh, GltfPbr } from "../container/index.js";
import type { BaseLook, BaseNameError, MaterialOverride } from "./inputs.js";
import { emission } from "./materials.js";

/** The path of a base material override: its name JSON-quoted in brackets. */
function materialPath(name: string): string {
  return `base.materials[${JSON.stringify(name)}]`;
}

/** The `base` error at a path for a material or mesh name the base stage does not hold. */
function missing(path: string, kind: "material" | "mesh", name: string): BaseNameError {
  const message = `${path}: the base stage has no ${kind} named ${JSON.stringify(name)}`;
  return { path, message };
}

/** Every base name of the look that the base stage does not hold, in description order. */
export function baseNameErrors(document: GltfDocument, look: BaseLook): readonly BaseNameError[] {
  const materials = new Set((document.materials ?? []).map((material) => material.name));
  const meshes = new Set((document.meshes ?? []).map((mesh) => mesh.name));
  const missingMaterials = [...look.materials.keys()]
    .filter((name) => !materials.has(name))
    .map((name) => missing(materialPath(name), "material", name));
  const missingMeshes = look.doubleSided.flatMap((name, index) =>
    meshes.has(name) ? [] : [missing(`base.doubleSided[${index}]`, "mesh", name)],
  );
  return [...missingMaterials, ...missingMeshes];
}

/** The base colour factor multiplied by a linear tint; alpha is kept. */
function tinted(factor: readonly number[] | undefined, tint: readonly number[]): number[] {
  const [r = 1, g = 1, b = 1, a = 1] = factor ?? [];
  return [r * (tint[0] ?? 1), g * (tint[1] ?? 1), b * (tint[2] ?? 1), a];
}

/** A base material with its override applied, made single-sided. */
function overridden(material: GltfMaterial, override: MaterialOverride | undefined): GltfMaterial {
  const pbr: GltfPbr = material.pbrMetallicRoughness ?? {};
  const { tint, metalness, roughness, emissive } = override ?? {};
  const pbrMetallicRoughness: GltfPbr = {
    ...pbr,
    ...(tint === undefined ? {} : { baseColorFactor: tinted(pbr.baseColorFactor, tint) }),
    ...(metalness === undefined ? {} : { metallicFactor: metalness }),
    ...(roughness === undefined ? {} : { roughnessFactor: roughness }),
  };
  const glow = emissive === undefined ? {} : emission(emissive);
  const extensions =
    material.extensions === undefined && glow.extensions === undefined
      ? {}
      : { extensions: { ...material.extensions, ...glow.extensions } };
  return { ...material, ...glow, ...extensions, pbrMetallicRoughness, doubleSided: false };
}

/** The base materials and meshes after the look: overrides, sidedness and double-sided twins. */
export interface LookedBase {
  readonly materials: readonly GltfMaterial[];
  readonly meshes: readonly GltfMesh[];
}

/**
 * Apply the look to the base stage. Base materials keep their indices, take their overrides
 * and become single-sided. A mesh listed as double-sided points to a double-sided twin of its
 * material; twins are appended in order of first need.
 */
export function applyBaseLook(document: GltfDocument, look: BaseLook): LookedBase {
  const materials = (document.materials ?? []).map((material) =>
    overridden(
      material,
      material.name === undefined ? undefined : look.materials.get(material.name),
    ),
  );
  const twins = new Map<number, number>();
  const twinOf = (index: number): number => {
    const known = twins.get(index);
    if (known !== undefined) return known;
    materials.push({ ...materials[index], doubleSided: true });
    twins.set(index, materials.length - 1);
    return materials.length - 1;
  };
  const doubleSided = new Set(look.doubleSided);
  const meshes = (document.meshes ?? []).map((mesh) => {
    if (mesh.name === undefined || !doubleSided.has(mesh.name)) return mesh;
    const primitives = mesh.primitives.map((primitive) =>
      primitive.material === undefined
        ? primitive
        : { ...primitive, material: twinOf(primitive.material) },
    );
    return { ...mesh, primitives };
  });
  return { materials, meshes };
}
