import type { Lighting } from "@level-designer/level-format";
import type { PostConfig } from "@level-designer/render-gateway";
import { GAME_VALUES } from "@level-designer/sec111-gateway";

/** The game's post configuration with the level's haze and exposure written over it. */
export function levelLook(lighting: Lighting): PostConfig {
  return {
    ...GAME_VALUES.look,
    hazeDensity: lighting.haze.density,
    hazeColor: lighting.haze.color,
    hazeGlow: lighting.haze.glow,
    exposure: lighting.exposure,
  };
}
