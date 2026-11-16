import { readGlb } from "../container/index.js";
import { trianglesOf } from "./accessors.js";

/** The three facts the validator's `triangles`, `material` and `texture` rules read. */
export interface GlbInspection {
  /** Triangles over every primitive of the file. */
  readonly triangles: number;
  /** The mesh name of each primitive without a material, one entry per primitive. */
  readonly primitivesWithoutMaterial: readonly string[];
  /** The number of images the file holds. */
  readonly images: number;
}

/** Inspect a GLB: its triangle count, its primitives without a material and its image count. */
export function inspectGlb(glb: Uint8Array): GlbInspection {
  const { document } = readGlb(glb);
  let triangles = 0;
  const primitivesWithoutMaterial: string[] = [];
  for (const mesh of document.meshes ?? []) {
    for (const primitive of mesh.primitives) {
      triangles += trianglesOf(document, primitive);
      if (primitive.material === undefined) primitivesWithoutMaterial.push(mesh.name ?? "");
    }
  }
  return { triangles, primitivesWithoutMaterial, images: document.images?.length ?? 0 };
}
