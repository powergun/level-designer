import { describe, expect, test } from "bun:test";
import {
  decodeLevel,
  encodeLevel,
  formatLength,
  isSurfaceColor,
  roundSlab,
} from "@level-designer/level-format";
import type { Slab, Vec3 } from "@level-designer/level-format";
import { SLAB_FINISH } from "./finishes.ts";
import { expectRoundTrip, gridLevel, gridSlab } from "./fixtures.ts";

/** A slab off the grid: lengths past 0.1 mm and a rotation past nine decimals. */
function messySlab(): Slab {
  return {
    size: [2.000049, 1.23456789, 0.300051],
    material: "wood",
    ...SLAB_FINISH,
    color: "#8a6a40",
    position: [-4.01254, 0.32415, 12.49996],
    rotation: [0, 0.6000000016, 0, 0.7999999988],
  };
}

/** The rounded size of a slab whose size is `size`. */
function roundedSize(size: Vec3): Vec3 {
  return roundSlab(gridSlab(size)).size;
}

describe("roundSlab", () => {
  test("a length just below, at and just above a half grid step rounds to its side", () => {
    expect(roundedSize([1.00004, 1.00005, 1.00006])).toEqual([1, 1.0001, 1.0001]);
    expect(roundSlab({ ...gridSlab(), position: [-1.00004, -1.00005, -1.00006] }).position).toEqual(
      [-1, -1.0001, -1.0001],
    );
  });

  test("a typed half step rounds away from zero, whatever its float product", () => {
    // 0.00145 * 10000 and 0.00015 * 10000 fall just below 14.5 and 1.5 in doubles.
    expect(roundedSize([0.00145, 0.00015, 1])).toEqual([0.0015, 0.0002, 1]);
    const position: Vec3 = [-0.00025, -0.00145, 0];
    expect(roundSlab({ ...gridSlab(), position }).position).toEqual([-0.0003, -0.0015, 0]);
  });

  test("puts rotation components on nine decimals", () => {
    const rotation = roundSlab(messySlab()).rotation;
    expect(rotation).toEqual([0, 0.600000002, 0, 0.799999999]);
  });

  test("a tiny negative length or rotation component rounds to 0, never -0", () => {
    const slab: Slab = {
      ...gridSlab(),
      position: [-0.00001, 0.3241, -0.00004],
      rotation: [-0.0000000004, 0.6, 0, 0.8],
    };
    const rounded = roundSlab(slab);
    expect(Object.is(rounded.position[0], 0)).toBe(true);
    expect(Object.is(rounded.position[2], 0)).toBe(true);
    expect(Object.is(rounded.rotation[0], 0)).toBe(true);
  });

  test("keeps the other fields and rounds idempotently", () => {
    const once = roundSlab(messySlab());
    expect([once.material, once.color]).toEqual(["wood", "#8a6a40"]);
    expect(once.size).toEqual([2, 1.2346, 0.3001]);
    expect(once.position).toEqual([-4.0125, 0.3242, 12.5]);
    expect(roundSlab(once)).toEqual(once);
  });

  test("a rounded slab keeps a unit rotation and round-trips through the level text", () => {
    const turned: Slab = { ...messySlab(), rotation: [0, Math.SQRT1_2, 0, Math.SQRT1_2] };
    expectRoundTrip(gridLevel([roundSlab(messySlab()), roundSlab(turned)], [gridSlab()]));
  });

  test("the encoder never rounds", () => {
    const level = gridLevel([messySlab()], [gridSlab()]);
    const decoded = decodeLevel(encodeLevel(level));
    expect(decoded.ok ? decoded.value.props[0]?.slabs[0] : undefined).toEqual(messySlab());
  });
});

test("isSurfaceColor admits #rrggbb text in either case and nothing else", () => {
  const admitted = ["#3b4046", "#3B4046"].map(isSurfaceColor);
  const refused = [
    "#3b404",
    "#3b40466",
    "3b4046",
    "x#3b4046",
    "#3b404g",
    ["#3b4046"],
    3_883_078,
    null,
  ];
  expect(admitted).toEqual([true, true]);
  expect(refused.map(isSurfaceColor)).toEqual(refused.map(() => false));
});

describe("formatLength", () => {
  test("prints the grid rounding, a half step away from zero", () => {
    const shown = [123.45675, -123.45675, 1.4999999999999998].map(formatLength);
    expect(shown).toEqual(["123.4568", "-123.4568", "1.5"]);
  });

  test("prints the same length that roundSlab stores", () => {
    const size: Vec3 = [2.000049, 1.23456789, 0.00145];
    expect(size.map(formatLength)).toEqual(roundedSize(size).map(String));
  });

  test("never prints a negative zero", () => {
    expect(formatLength(-0.00004)).toBe("0");
  });

  test("prints plain digits: no trailing zero, no point on a whole number", () => {
    expect([6, 40, 2.17, 0.3241, 12345.6].map(formatLength)).toEqual([
      "6",
      "40",
      "2.17",
      "0.3241",
      "12345.6",
    ]);
  });
});
