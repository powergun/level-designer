import { describe, expect, test } from "bun:test";
import type { Lighting, PointLight as LevelPoint, Vec3 } from "@level-designer/level-format";
import { DirectionalLight, PointLight, Scene, Vector3 } from "three/webgpu";
import { GAME_VALUES } from "@level-designer/sec111-gateway";
import { dressScene } from "./dress.js";
import type { InteriorBox } from "./lights.js";

/** A hall-sized interior, off the origin so a centre mistake shows. */
const INTERIOR: InteriorBox = { min: [-16.6, 0.2, -70.4], max: [17.4, 18.9, 49.6] };

/** One of today's four practicals, at plan point `(x, z)`. */
function practical(x: number, z: number): LevelPoint {
  return { position: [x, 15.79, z], color: [0.8, 0.9, 1.0], intensity: 395.4, range: 46.8 };
}

/** The baseline lighting: today's game values, with the key toward `direction`. */
function baseline(direction: Vec3): Lighting {
  return {
    environment: { intensity: 0.5, ambient: [0.06, 0.066, 0.08], overhead: [0.08, 0.086, 0.098] },
    key: {
      color: [0.72, 0.82, 1.0],
      intensity: 3,
      direction,
      shadow: { mapSize: 4096, bias: -0.0003, normalBias: 0.039, radius: 3 },
    },
    points: [
      practical(9.83, 16.73),
      practical(0.55, -10.45),
      practical(-8.77, -37.63),
      practical(0.55, -64.77),
    ],
    haze: { density: 0.0077, color: [0.006, 0.01, 0.017], glow: 0.9 },
    exposure: 1,
  };
}

/** The scene dressed with the lighting, its matrices updated as the renderer updates them. */
function dressed(lighting: Lighting, clear: "game" | "leak" = "game"): Scene {
  const scene = new Scene();
  dressScene(scene, lighting, INTERIOR, clear);
  scene.updateMatrixWorld(true);
  return scene;
}

/** Every object of the scene of one light class. */
function lightsOf<T>(scene: Scene, kind: new (...args: never[]) => T): T[] {
  const found: T[] = [];
  scene.traverse((object) => {
    if (object instanceof kind) found.push(object);
  });
  return found;
}

/** The one key of the dressed scene; the test fails when there is not exactly one. */
function theKey(direction: Vec3): DirectionalLight {
  const keys = lightsOf(dressed(baseline(direction)), DirectionalLight);
  expect(keys).toHaveLength(1);
  const [key] = keys;
  if (key === undefined) throw new Error("no key light");
  return key;
}

/** The interior corners in the shadow camera's view, after three's own shadow update. */
function cornersInShadowView(key: DirectionalLight): Vector3[] {
  key.shadow.updateMatrices(key);
  const view = key.shadow.camera.matrixWorldInverse;
  const { min, max } = INTERIOR;
  const corners: Vector3[] = [];
  for (const x of [min[0], max[0]]) {
    for (const y of [min[1], max[1]]) {
      for (const z of [min[2], max[2]]) corners.push(new Vector3(x, y, z).applyMatrix4(view));
    }
  }
  return corners;
}

/** The components of a vector as a plain list. */
function list(vector: Vector3): number[] {
  return Array.from(vector.toArray());
}

describe("the key", () => {
  for (const direction of [[0, 1, 0] as const, [0.6, 0.8, 0] as const]) {
    test(`toward ${direction.join(", ")} aims at the interior centre`, () => {
      const key = theKey(direction);
      const target = key.target.getWorldPosition(new Vector3());
      expect(list(target)).toEqual([0.4, 9.55, -10.4].map((v) => expect.closeTo(v, 9)));
      const toward = key.getWorldPosition(new Vector3()).sub(target).normalize();
      expect(list(toward)).toEqual(direction.map((v) => expect.closeTo(v, 9)));
    });

    test(`toward ${direction.join(", ")} fits its shadow volume to the interior box`, () => {
      const key = theKey(direction);
      const camera = key.shadow.camera;
      const corners = cornersInShadowView(key);
      const xs = corners.map((c) => c.x);
      const ys = corners.map((c) => c.y);
      const depths = corners.map((c) => -c.z);
      expect(Math.min(...xs)).toBeCloseTo(camera.left, 9);
      expect(Math.max(...xs)).toBeCloseTo(camera.right, 9);
      expect(Math.min(...ys)).toBeCloseTo(camera.bottom, 9);
      expect(Math.max(...ys)).toBeCloseTo(camera.top, 9);
      expect(Math.min(...depths)).toBeCloseTo(camera.near, 9);
      expect(Math.max(...depths)).toBeCloseTo(camera.far, 9);
      expect(camera.near).toBeGreaterThan(-1e-9);
    });
  }

  test("casts the stored static PCF shadow, rendered once", () => {
    const key = theKey([0, 1, 0]);
    const shadow = key.shadow;
    expect(key.castShadow).toBe(true);
    expect(key.intensity).toBe(3);
    expect(key.color.toArray()).toEqual([0.72, 0.82, 1.0]);
    expect(shadow.mapSize.toArray()).toEqual([4096, 4096]);
    expect([shadow.bias, shadow.normalBias, shadow.radius]).toEqual([-0.0003, 0.039, 3]);
    expect([shadow.autoUpdate, shadow.needsUpdate]).toEqual([false, true]);
  });

  test("is absent when the lighting has none", () => {
    const { key: _key, ...keyless } = baseline([0, 1, 0]);
    expect(lightsOf(dressed(keyless), DirectionalLight)).toHaveLength(0);
  });
});

test("each point becomes an unshadowed point light with decay 2", () => {
  const lighting = baseline([0, 1, 0]);
  const lights = lightsOf(dressed(lighting), PointLight);
  const seen = lights.map((light) => ({
    decay: light.decay,
    castShadow: light.castShadow,
    intensity: light.intensity,
    range: light.distance,
    color: Array.from(light.color.toArray()),
    position: list(light.position),
  }));
  const expected = lighting.points.map((point) => ({
    decay: 2,
    castShadow: false,
    intensity: point.intensity,
    range: point.range,
    color: [...point.color],
    position: [...point.position],
  }));
  expect(seen).toEqual(expected);
});

test("the scene takes the environment intensity and the chosen clear colour", () => {
  const game = dressed(baseline([0, 1, 0]), "game");
  expect(game.environmentIntensity).toBe(0.5);
  const [r, g, b] = GAME_VALUES.page.clearColor;
  expect(game.background).toMatchObject({ r, g, b });
  expect(dressed(baseline([0, 1, 0]), "leak").background).toMatchObject({ r: 1, g: 0, b: 1 });
});
