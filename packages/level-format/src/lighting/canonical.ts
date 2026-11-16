import type { KeyLight, Lighting } from "./lighting.js";

/** The lighting section with its keys in the canonical order of the level `.json`. */
export function canonicalLighting(lighting: Lighting): Lighting {
  const { environment: env, key, haze } = lighting;
  return {
    environment: { intensity: env.intensity, ambient: env.ambient, overhead: env.overhead },
    ...(key === undefined ? {} : { key: canonicalKey(key) }),
    points: lighting.points.map((point) => ({
      position: point.position,
      color: point.color,
      intensity: point.intensity,
      range: point.range,
    })),
    haze: { density: haze.density, color: haze.color, glow: haze.glow },
    exposure: lighting.exposure,
  };
}

/** The key light with its keys in canonical order. */
function canonicalKey(key: KeyLight): KeyLight {
  const { mapSize, bias, normalBias, radius } = key.shadow;
  return {
    color: key.color,
    intensity: key.intensity,
    direction: key.direction,
    shadow: { mapSize, bias, normalBias, radius },
  };
}
