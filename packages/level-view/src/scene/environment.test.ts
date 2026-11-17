import { describe, expect, test } from "bun:test";
import type { Environment } from "@level-designer/level-format";
import { BackSide, Mesh, MeshBasicNodeMaterial, SphereGeometry } from "three/webgpu";
import { buildEnvironmentScene, environmentColor } from "./environment.js";

/** Distinct channels, so a swapped colour or channel shows. */
const ENVIRONMENT: Environment = {
  intensity: 0.5,
  ambient: [0.1, 0.2, 0.4],
  overhead: [0.3, 0.05, 0.6],
};

describe("the environment formula", () => {
  // Hand-computed: smoothstep(-0.7, 0.05, 0) = 0.98726, smoothstep(-0.1, 0.9, 0) = 0.028.
  const cases = [
    { name: "straight up", y: 1, floor: 1, sky: 1 },
    { name: "straight down", y: -1, floor: 0.4, sky: 0 },
    { name: "the horizon", y: 0, floor: 0.4 + 0.6 * 0.987259259, sky: 0.028 },
  ];
  for (const { name, y, floor, sky } of cases) {
    test(`colours ${name} as ambient times ${floor.toFixed(4)} plus overhead times ${sky}`, () => {
      const { ambient, overhead } = ENVIRONMENT;
      const expected = ambient.map((channel, c) => channel * floor + (overhead[c] ?? NaN) * sky);
      const color = environmentColor(ENVIRONMENT, y);
      expect([...color]).toEqual(expected.map((v) => expect.closeTo(v, 8)));
    });
  }
});

test("the bake reads a back-faced sphere of radius 10 coloured by the formula per vertex", () => {
  const meshes = buildEnvironmentScene(ENVIRONMENT).children.filter((o) => o instanceof Mesh);
  expect(meshes).toHaveLength(1);
  const [sphere] = meshes;
  if (sphere === undefined) throw new Error("no sphere");
  expect(sphere.geometry).toBeInstanceOf(SphereGeometry);
  expect(sphere.geometry.parameters.radius).toBe(10);
  expect(sphere.material).toBeInstanceOf(MeshBasicNodeMaterial);
  expect(sphere.material).toMatchObject({ side: BackSide, vertexColors: true });
  const positions = sphere.geometry.getAttribute("position");
  const colors = sphere.geometry.getAttribute("color");
  expect(colors.count).toBe(positions.count);
  for (let index = 0; index < positions.count; index += 1) {
    const expected = environmentColor(ENVIRONMENT, positions.getY(index) / 10);
    const color = [colors.getX(index), colors.getY(index), colors.getZ(index)];
    expect(color).toEqual(expected.map((v) => expect.closeTo(v, 6)));
  }
});
