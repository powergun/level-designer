import { describe, expect, test } from "bun:test";
import {
  bodyShade,
  linearFromSrgbHex,
  numberArithmetic as a,
  paintFace,
  type Shade,
} from "@level-designer/finish-paint";
import { type Effects, type FinishTable, recipeAt } from "@level-designer/level-format";
import { BASE, CENTRED, EVERYWHERE, FINE, LIGHT, TINT, layer, paintAt } from "./fixtures.ts";

/** One effect and the shade it reaches at a coverage of one half and of 1, by hand. */
interface EffectCase {
  readonly effects: Effects;
  readonly half: Partial<Shade<number>>;
  readonly whole: Partial<Shade<number>>;
}

/** Base albedo (0.2, 0.4, 0.6), metalness 0.1, roughness 0.6, emission 0. */
const CASES: Readonly<Record<string, EffectCase>> = {
  shade: {
    effects: { shade: 0.5 },
    half: { albedo: [0.15, 0.3, 0.45] },
    whole: { albedo: [0.1, 0.2, 0.3] },
  },
  paint: {
    effects: { paint: 2 },
    half: { albedo: [0.6, 0.45, 0.425] },
    whole: { albedo: [1, 0.5, 0.25] },
  },
  color: {
    effects: { color: "#ffffff" },
    half: { albedo: [0.6, 0.7, 0.8] },
    whole: { albedo: [1, 1, 1] },
  },
  glow: {
    effects: { color: "glow" },
    half: { albedo: [0.6, 0.45, 0.3] },
    whole: { albedo: [1, 0.5, 0] },
  },
  metalness: { effects: { metalness: 1 }, half: { metalness: 0.55 }, whole: { metalness: 1 } },
  roughness: { effects: { roughness: 0.2 }, half: { roughness: 0.4 }, whole: { roughness: 0.2 } },
  lit: { effects: { lit: 1 }, half: { emission: 0.5 }, whole: { emission: 1 } },
};

/** A shade's six values, rounded to six places. */
function rounded(s: Shade<number>): number[] {
  const values = [...s.albedo, s.metalness, s.roughness, s.emission];
  return values.map((v) => Math.round(v * 1e6) / 1e6);
}

/** Asserts a shade equal to the expected one, channel by channel, to six places. */
function expectShade(name: string, actual: Shade<number>, expected: Shade<number>): void {
  expect({ name, shade: rounded(actual) }).toEqual({ name, shade: rounded(expected) });
}

/** The painted shade of one face-wide layer of `effects` at `amount`. */
function paintedBy(effects: Effects, amount: number): Shade<number> {
  return paintAt([layer(EVERYWHERE, effects, { amount })], CENTRED);
}

describe("the painter's shade", () => {
  test("a body's base shade is the tint times its shade", () => {
    for (const shade of [0, 1, 4]) {
      const body = { shade, metalness: 0.25, roughness: 0.75, lit: 0.5 };
      const expected = {
        albedo: [0.5 * shade, 0.25 * shade, 0.125 * shade],
        metalness: 0.25,
        roughness: 0.75,
        emission: 0.5,
      } as const;
      expectShade(`shade ${shade}`, bodyShade(a, body, TINT), expected);
    }
  });

  test("a face that no layer covers keeps its base shade, also one no body gave", () => {
    const elsewhere = layer(EVERYWHERE, { color: "#ffffff", metalness: 1, lit: 1 }, { on: "top" });
    expect(paintAt([elsewhere], CENTRED)).toEqual(BASE);
    expect(paintAt([], CENTRED)).toEqual(BASE);
  });

  test("each effect mixes in at a coverage of 0, one half and 1", () => {
    for (const [name, { effects, half, whole }] of Object.entries(CASES)) {
      expectShade(`${name} at 0`, paintedBy(effects, 0), BASE);
      expectShade(`${name} at 0.5`, paintedBy(effects, 0.5), { ...BASE, ...half });
      expectShade(`${name} at 1`, paintedBy(effects, 1), { ...BASE, ...whole });
    }
  });

  test("a later layer draws over an earlier one, and paint restores the tint", () => {
    const white = layer(EVERYWHERE, { color: "#ffffff" });
    const black = layer(EVERYWHERE, { color: "#000000" });
    expect(paintAt([white, black], CENTRED).albedo).toEqual([0, 0, 0]);
    expect(paintAt([black, white], CENTRED).albedo).toEqual([1, 1, 1]);
    const restored = paintAt([black, layer(EVERYWHERE, { paint: 1 })], CENTRED);
    expect(restored.albedo).toEqual(TINT);
  });
});

describe("the painter's clamp, recipe and colours", () => {
  test("the albedo is clamped to 0 to 1 after the last layer", () => {
    // The tint (0.5, 0.25, 0.125) times 4 is (2, 1, 0.5).
    expect(paintAt([layer(EVERYWHERE, { paint: 4 })], CENTRED).albedo).toEqual([1, 1, 0.5]);
    const dark = { ...BASE, albedo: [-0.5, 0.5, 2] as const };
    expect(paintAt([], CENTRED, dark).albedo).toEqual([0, 0.5, 1]);
  });

  test("a recipe draws its extended layers first", () => {
    const table: FinishTable = new Map([
      [
        "housing",
        {
          cut: { family: "metal", color: "#808080" },
          light: "#ffffff",
          roles: new Map([
            ["base", { layers: [layer(EVERYWHERE, { color: "#ffffff" })] }],
            [
              "machine",
              {
                extends: "base",
                layers: [layer(EVERYWHERE, { color: "#000000" }, { amount: 0.5 })],
              },
            ],
          ]),
        },
      ],
    ]);
    const recipe = recipeAt(table, "housing/machine");
    if (recipe === undefined) {
      throw new Error("the table holds housing/machine");
    }
    expect(recipe.layers).toHaveLength(2);
    const surface = { face: CENTRED, tint: TINT, light: LIGHT, footprint: FINE };
    const shade = paintFace(a, recipe, BASE, surface);
    expect(shade.albedo.map((v) => Math.round(v * 1e6) / 1e6)).toEqual([0.5, 0.5, 0.5]);
  });

  test("a colour text decodes from sRGB to linear light", () => {
    expect(linearFromSrgbHex("#000000")).toEqual([0, 0, 0]);
    expect(linearFromSrgbHex("#ffffff")).toEqual([1, 1, 1]);
    const [r, g, b] = linearFromSrgbHex("#80080a");
    expect(r).toBeCloseTo(0.2158605, 6);
    expect(g).toBeCloseTo(8 / 255 / 12.92, 6);
    expect(b).toBeCloseTo(10 / 255 / 12.92, 6);
  });
});
