import { WallModel } from "@level-designer/destruction-gateway";
import type { Slab } from "@level-designer/level-format";

/**
 * The shared builder: the destruction lib wall model of a slab at core's default
 * configuration. The inner colour is the slab's colour, so its edges never show destruction
 * lib's default tan. The model lives in the slab's frame; the slab's pose places it.
 */
export function buildSlabModel(slab: Slab): WallModel {
  const [width, height, thickness] = slab.size;
  return new WallModel({
    width,
    height,
    thickness,
    materialId: slab.material,
    color: slab.color,
    innerColor: slab.color,
  });
}
