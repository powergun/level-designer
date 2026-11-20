import type { Lighting } from "@level-designer/level-format";
import type { PostConfig } from "@level-designer/render-gateway";
import { GAME_VALUES } from "@level-designer/sec111-gateway";

/** The authoring bloom and lens dirt over the game's grade, with the level's haze and exposure. */
export function levelLook(lighting: Lighting): PostConfig {
  return {
    ...GAME_VALUES.look,
    lensDirt: 2.3,
    bloomStrength: 0.7,
    bloomRadius: 0.6,
    bloomThreshold: 0.75,
    bloomKnee: 0.35,
    bloomTints: [
      [1, 1, 1],
      [0.97, 1, 1.03],
      [0.9, 0.97, 1.08],
      [0.82, 0.94, 1.14],
      [0.75, 0.9, 1.2],
    ],
    hazeDensity: lighting.haze.density,
    hazeColor: lighting.haze.color,
    hazeGlow: lighting.haze.glow,
    exposure: lighting.exposure,
  };
}
