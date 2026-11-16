import type { GlbInspection } from "@level-designer/level-glb";
import type { Finding } from "../finding/index.js";
import { count } from "../finding/index.js";

/** The owner's cap on the triangles of the whole level GLB. */
export const TRIANGLE_CAP = 300_000;

/** `triangles`: the level GLB holds at most the owner's triangle cap. */
export function triangles(inspection: GlbInspection): Finding[] {
  if (inspection.triangles <= TRIANGLE_CAP) {
    return [];
  }
  const message = `the level has ${count(inspection.triangles)} triangles; the cap is ${count(TRIANGLE_CAP)}`;
  return [{ rule: "triangles", subject: "level", message }];
}

/** `material`: every primitive of the level GLB has a material, one finding per primitive. */
export function material(inspection: GlbInspection): Finding[] {
  return inspection.primitivesWithoutMaterial.map((mesh) => ({
    rule: "material",
    subject: mesh,
    message: `mesh "${mesh}" has a primitive without a material`,
  }));
}

/** `texture`: the level GLB holds no image beyond the base stage's while no texture owner exists. */
export function texture(inspection: GlbInspection, baseImages: number): Finding[] {
  const extra = inspection.images - baseImages;
  if (extra <= 0) {
    return [];
  }
  const message = `the GLB holds ${count(extra)} images beyond the base stage's; add the 1024 px check with the first texture owner`;
  return [{ rule: "texture", subject: "level", message }];
}
