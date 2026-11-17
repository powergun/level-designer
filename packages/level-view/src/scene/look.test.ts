import { expect, test } from "bun:test";
import type { Lighting } from "@level-designer/level-format";
import { GAME_VALUES } from "@level-designer/sec111-gateway";
import { levelLook } from "./look.js";

test("the look is the game's with the level's haze and exposure", () => {
  const lighting: Lighting = {
    environment: { intensity: 0.2, ambient: [0, 0, 0], overhead: [0, 0, 0] },
    points: [],
    haze: { density: 0.021, color: [0.01, 0.03, 0.08], glow: 1.4 },
    exposure: 0.7,
  };
  const look = levelLook(lighting);
  const { hazeDensity, hazeColor, hazeGlow, exposure, ...rest } = look;
  expect({ hazeDensity, hazeColor, hazeGlow, exposure }).toEqual({
    hazeDensity: 0.021,
    hazeColor: [0.01, 0.03, 0.08],
    hazeGlow: 1.4,
    exposure: 0.7,
  });
  const {
    hazeDensity: _d,
    hazeColor: _c,
    hazeGlow: _g,
    exposure: _e,
    ...gameRest
  } = GAME_VALUES.look;
  expect(rest).toEqual(gameRest);
});
