import { describe, expect, test } from "bun:test";
import { parseDescription } from "@level-designer/level-format";
import type { LimitCase } from "./fixtures.ts";
import {
  changed,
  closedRange,
  expectLimit,
  rulePaths,
  validDescription,
  validPoint,
} from "./fixtures.ts";

/** A point list of `count` valid point lights. */
function points(count: number): unknown[] {
  return Array.from({ length: count }, validPoint);
}

/** The direction `[0.6, 0.8, 0]` scaled by `scale`. */
function direction(scale: number): number[] {
  return [0.6 * scale, 0.8 * scale, 0];
}

// The section has one admission for both shapes; the level tests hold its decoder wiring.
describe("lighting caps and ranges, through the description parser", () => {
  const probes: readonly LimitCase[] = [
    ["lighting.points", points(8), points(9)],
    ["lighting.key.shadow.mapSize", 4096, 8192],
    ["lighting.key.shadow.mapSize", 1024, 1000],
    ["lighting.key.direction", direction(1 + 0.9e-6), direction(1 + 1.1e-6)],
    ["lighting.key.direction", [0, 1, 0], [1, 0, 0]],
    ["lighting.environment.intensity", 0, -0.0001],
    ["lighting.key.intensity", 0, -0.0001],
    ["lighting.points[0].intensity", 0, -0.0001],
    ["lighting.points[0].range", 0, -0.0001],
    ["lighting.haze.density", 0, -0.0001],
    ["lighting.haze.glow", 0, -0.0001],
    ["lighting.exposure", 0.0001, 0],
    ...closedRange("lighting.environment.ambient[0]", 0, 1),
    ...closedRange("lighting.environment.overhead[2]", 0, 1),
    ...closedRange("lighting.key.color[1]", 0, 1),
    ...closedRange("lighting.points[0].color[2]", 0, 1),
    ...closedRange("lighting.haze.color[0]", 0, 1),
    ...closedRange("lighting.key.shadow.bias", -0.01, 0.01),
    ...closedRange("lighting.key.shadow.normalBias", 0, 1),
    ...closedRange("lighting.key.shadow.radius", 0, 16),
  ];

  for (const probe of probes) {
    test(`${probe[0]} passes at ${String(probe[1]).slice(0, 12)} and fails one step beyond`, () => {
      expectLimit(parseDescription, validDescription(), probe);
    });
  }

  test("the key light is optional, and an unknown lighting key is refused", () => {
    const keyless = changed(validDescription(), "lighting.key");
    expect(rulePaths(parseDescription(JSON.stringify(keyless)))).toEqual([]);
    const bloom = changed(validDescription(), "lighting.bloom", 0.7);
    expect(rulePaths(parseDescription(JSON.stringify(bloom)))).toEqual([
      ["shape", "lighting.bloom"],
    ]);
  });
});
