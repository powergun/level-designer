import type { Lighting } from "@level-designer/level-format";
import { GAME_VALUES } from "@level-designer/sec111-gateway";
import { Color, type Scene } from "three/webgpu";
import { createKeyLight, createPointLight, type InteriorBox } from "./lights.js";

/** The clear colour: the game's near-black constant, or a loud one that shows an opening. */
export type ClearColorChoice = "game" | "leak";

/** Linear clear colours by choice: the game's own, and this component's loud magenta. */
const CLEAR_COLORS = {
  game: GAME_VALUES.page.clearColor,
  leak: [1, 0, 1],
} as const;

/**
 * Dress the scene by the lighting mapping rules: the clear colour, the environment intensity
 * and the complete light set. The set is final here; nothing adds or removes a light later.
 */
export function dressScene(
  scene: Scene,
  lighting: Lighting,
  interior: InteriorBox,
  clearColor: ClearColorChoice,
): void {
  scene.background = new Color(...CLEAR_COLORS[clearColor]);
  scene.environmentIntensity = lighting.environment.intensity;
  if (lighting.key !== undefined) {
    const key = createKeyLight(lighting.key, interior);
    scene.add(key, key.target);
  }
  for (const point of lighting.points) scene.add(createPointLight(point));
}
