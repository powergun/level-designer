import { readGlb } from "../container/index.js";
import { applyBaseLook, baseNameErrors } from "./base-look.js";
import { addFinishMaterials } from "./finish-materials.js";
import type { BaseLook, BoxPaint, SealBox, SlabLooks, StaticScene } from "./inputs.js";
import { sealMaterial } from "./materials.js";
import { SceneBuilder } from "../builder/index.js";
import { sealGeometry } from "./seal-box.js";

/** The column-major matrix of a uniform scale. */
function scaleMatrix(scale: number): number[] {
  return [scale, 0, 0, 0, 0, scale, 0, 0, 0, 0, scale, 0, 0, 0, 0, 1];
}

/** A seal with its material's index. */
interface DrawnSeal {
  readonly seal: SealBox;
  readonly material: number;
}

/**
 * Append the seals' materials: `seal/<id>` per flat seal in input order, then the shared finish
 * materials of the painted seals. Returns each seal with its material, in input order.
 */
function addSealMaterials(
  builder: SceneBuilder,
  seals: readonly SealBox[],
  looks: SlabLooks,
): readonly DrawnSeal[] {
  // A flat seal's look is its own material's index, a painted seal's its paint.
  const drafts = seals.map((seal) => ({
    seal,
    look: seal.paint === undefined ? builder.addMaterial(sealMaterial(seal)) : seal.paint,
  }));
  const paints = drafts.flatMap(({ look }): BoxPaint[] => (typeof look === "number" ? [] : [look]));
  const materialOf = addFinishMaterials(builder, paints, looks, new Map());
  return drafts.map(({ seal, look }) => ({
    seal,
    material: typeof look === "number" ? look : materialOf(look),
  }));
}

/**
 * Assemble the static scene from the base stage GLB: the root `stage` scaled by `base.scale`
 * over the base stage's own roots, the base look, then one `seal` object per seal. A painted
 * seal draws with the shared material of its finish path and glow, whose body `looks` holds. A
 * base name the stage does not hold returns the `base` errors instead.
 */
export function assembleStaticScene(
  baseStage: Uint8Array,
  look: BaseLook,
  seals: readonly SealBox[],
  looks: SlabLooks,
): StaticScene {
  const { document, bin } = readGlb(baseStage);
  const errors = baseNameErrors(document, look);
  if (errors.length > 0) return { ok: false, errors };
  const looked = applyBaseLook(document, look);
  const builder = new SceneBuilder({ ...document, ...looked }, bin, []);
  const baseRoots = document.scenes[document.scene ?? 0]?.nodes ?? [];
  builder.addRoot({ name: "stage", matrix: scaleMatrix(look.scale), children: [...baseRoots] });
  for (const { seal, material } of addSealMaterials(builder, seals, looks)) {
    builder.addObject(seal.id, { role: "seal" }, [builder.primitive(sealGeometry(seal), material)]);
  }
  return { ok: true, glb: builder.write() };
}
