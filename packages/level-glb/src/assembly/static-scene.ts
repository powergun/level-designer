import { readGlb } from "../container/index.js";
import { applyBaseLook, baseNameErrors } from "./base-look.js";
import type { BaseLook, SealBox, StaticScene } from "./inputs.js";
import { sealMaterial } from "./materials.js";
import { SceneBuilder } from "../builder/index.js";
import { sealGeometry } from "./seal-box.js";

/** The column-major matrix of a uniform scale. */
function scaleMatrix(scale: number): number[] {
  return [scale, 0, 0, 0, 0, scale, 0, 0, 0, 0, scale, 0, 0, 0, 0, 1];
}

/**
 * Assemble the static scene from the base stage GLB: the root `stage` scaled by `base.scale`
 * over the base stage's own roots, the base look, then one `seal` object per seal. A base
 * name the stage does not hold returns the `base` errors instead.
 */
export function assembleStaticScene(
  baseStage: Uint8Array,
  look: BaseLook,
  seals: readonly SealBox[],
): StaticScene {
  const { document, bin } = readGlb(baseStage);
  const errors = baseNameErrors(document, look);
  if (errors.length > 0) return { ok: false, errors };
  const looked = applyBaseLook(document, look);
  const builder = new SceneBuilder({ ...document, ...looked }, bin, []);
  const baseRoots = document.scenes[document.scene ?? 0]?.nodes ?? [];
  builder.addRoot({ name: "stage", matrix: scaleMatrix(look.scale), children: [...baseRoots] });
  for (const seal of seals) {
    const material = builder.addMaterial(sealMaterial(seal));
    builder.addObject(seal.id, { role: "seal" }, [builder.primitive(sealGeometry(seal), material)]);
  }
  return { ok: true, glb: builder.write() };
}
