import { expect, test } from "bun:test";
import type { Lighting } from "@level-designer/level-format";
import { GAME_VALUES } from "@level-designer/sec111-gateway";
import { levelLook } from "./look.js";

test("the authoring look combines the game grade, preview bloom and level lighting", () => {
  const lighting: Lighting = {
    environment: { intensity: 0.2, ambient: [0, 0, 0], overhead: [0, 0, 0] },
    points: [],
    haze: { density: 0.021, color: [0.01, 0.03, 0.08], glow: 1.4 },
    exposure: 0.7,
  };
  const look = levelLook(lighting);
  expect(look.hazeDensity).toBe(lighting.haze.density);
  expect(look.hazeColor).toEqual(lighting.haze.color);
  expect(look.hazeGlow).toBe(lighting.haze.glow);
  expect(look.exposure).toBe(lighting.exposure);
  expect(look.lensDirt).toBe(2.3);
  expect(look.bloomStrength).toBe(0.7);
  expect(look.bloomRadius).toBe(0.6);
  expect(look.bloomThreshold).toBe(0.75);
  expect(look.bloomKnee).toBe(0.35);
  expect(look.bloomTints).toHaveLength(5);
  expect(look.bloomTints?.at(-1)).toEqual([0.75, 0.9, 1.2]);
  expect(look.contrast).toBe(GAME_VALUES.look.contrast);
  expect(look.shadowTint).toEqual(GAME_VALUES.look.shadowTint);
});
