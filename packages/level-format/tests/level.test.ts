import { describe, expect, test } from "bun:test";
import { admitSlabs, decodeLevel, encodeLevel } from "@level-designer/level-format";
import type { Level, Slab, Vec3 } from "@level-designer/level-format";
import {
  changed,
  expectRoundTrip,
  gridLevel,
  gridSlab,
  problemsOf,
  rulePaths,
  validPoint,
} from "./fixtures.ts";

/** The level `.json` document of `level`, as plain JSON for editing. */
function documentOf(level: Level): unknown {
  return JSON.parse(encodeLevel(level));
}

/** A unit quaternion of a 3-4-5 turn about +Y, scaled by `scale`. */
function rotation(scale: number): number[] {
  return [0, 0.6 * scale, 0, 0.8 * scale];
}

/** The slab with its keys inserted in reverse canonical order. */
function reversedSlab(slab: Slab): Slab {
  const { size, material, color, position, rotation: turn } = slab;
  return { rotation: turn, position, color, material, size };
}

/** The level with its keys inserted in another order than the canonical one. */
function reorderedLevel(level: Level): Level {
  const { environment, key, points, haze, exposure } = level.lighting;
  const lighting = {
    exposure,
    haze: { glow: haze.glow, color: haze.color, density: haze.density },
    points,
    ...(key === undefined ? {} : { key }),
    environment,
  };
  const props = level.props.map((prop) => ({ slabs: prop.slabs.map(reversedSlab), id: prop.id }));
  return { lighting, props };
}

/** A level whose second prop holds one slab of `size`. */
function levelWith(size: Vec3): Level {
  return gridLevel([gridSlab()], [gridSlab(size)]);
}

/** A level with `count` slabs in total, all valid. */
function levelOfSlabs(count: number): Level {
  return gridLevel(
    Array.from({ length: count - 1 }, () => gridSlab()),
    [gridSlab()],
  );
}

/** The document of a valid level of two props, which each rejection edits once. */
const base = documentOf(gridLevel([gridSlab()], [gridSlab()]));

/** Rejections of one fault each: a name, the level, the rule and the path of the problem. */
const rejections: readonly [string, unknown, string, string][] = [
  ["another schema", changed(base, "schema", "level-designer-level/2"), "shape", "schema"],
  ["a prop without slabs", changed(base, "props[0].slabs", []), "shape", "props[0].slabs"],
  [
    "an unknown material",
    changed(base, "props[0].slabs[0].material", "steel"),
    "shape",
    "props[0].slabs[0].material",
  ],
  [
    "a colour not in #rrggbb",
    changed(base, "props[1].slabs[0].color", "#12345"),
    "shape",
    "props[1].slabs[0].color",
  ],
  [
    "a size of two numbers",
    changed(base, "props[0].slabs[0].size", [1, 1]),
    "shape",
    "props[0].slabs[0].size",
  ],
  [
    "an unknown slab key",
    changed(base, "props[0].slabs[0].seed", 7),
    "shape",
    "props[0].slabs[0].seed",
  ],
  [
    "a missing position",
    changed(base, "props[0].slabs[0].position"),
    "shape",
    "props[0].slabs[0].position",
  ],
  ["a reused prop id", changed(base, "props[1].id", "crate-a"), "id", "props[1].id"],
  ["a bad prop id", changed(base, "props[1].id", "Crate B"), "shape", "props[1].id"],
  [
    "a ninth point light",
    changed(base, "lighting.points", Array.from({ length: 9 }, validPoint)),
    "shape",
    "lighting.points",
  ],
];

describe("decodeLevel and encodeLevel", () => {
  test("decoding an encoded rounded level returns the same level", () => {
    expectRoundTrip(gridLevel([gridSlab(), gridSlab([1.2345, 2.5, 0.0213])], [gridSlab()]));
  });

  test("a level without a key light round-trips without one", () => {
    const { key: _key, ...lighting } = gridLevel([], []).lighting;
    const level: Level = { props: [{ id: "crate-a", slabs: [gridSlab()] }], lighting };
    const decoded = decodeLevel(encodeLevel(level));
    expect(decoded.ok && "key" in decoded.value.lighting).toBe(false);
    expect(decoded.ok ? decoded.value : undefined).toEqual(level);
  });

  test("equal levels give equal bytes whatever their key insertion order", () => {
    const level = gridLevel([gridSlab()], [gridSlab()]);
    const reordered = reorderedLevel(level);
    expect(Object.keys(reordered)).toEqual(["lighting", "props"]);
    expect(encodeLevel(reordered)).toBe(encodeLevel(level));
    expect(encodeLevel(level).endsWith("}\n")).toBe(true);
    expect(encodeLevel(level).startsWith('{\n  "schema": "level-designer-level/1",\n')).toBe(true);
  });

  for (const [name, document, rule, path] of rejections) {
    test(`rejects ${name} at ${path}`, () => {
      expect(rulePaths(decodeLevel(JSON.stringify(document)))).toEqual([[rule, path]]);
    });
  }

  test("rejects a slab position too large to be finite", () => {
    const text = JSON.stringify(changed(base, "props[0].slabs[0].position[0]", "HUGE"));
    const admission = decodeLevel(text.replace('"HUGE"', "1e999"));
    expect(rulePaths(admission)).toEqual([["shape", "props[0].slabs[0].position[0]"]]);
  });

  test("a rotation passes within the unit tolerance and fails beyond it", () => {
    const at = changed(base, "props[0].slabs[0].rotation", rotation(1 + 0.9e-6));
    const beyond = changed(base, "props[0].slabs[0].rotation", rotation(1 + 1.1e-6));
    expect(rulePaths(decodeLevel(JSON.stringify(at)))).toEqual([]);
    expect(rulePaths(decodeLevel(JSON.stringify(beyond)))).toEqual([
      ["shape", "props[0].slabs[0].rotation"],
    ]);
  });
});

describe("the slab admission", () => {
  const sizes: readonly [string, Vec3, Vec3][] = [
    ["shortest side", [0.02, 1, 0.02], [0.0199, 1, 0.02]],
    ["longest width", [40, 0.5, 0.1], [40.0001, 0.5, 0.1]],
    ["longest thickness", [1, 1, 40], [1, 1, 40.0001]],
    ["largest face", [5, 5, 0.1], [5, 5.0001, 0.1]],
    ["largest face at the longest side", [40, 0.625, 0.1], [40, 0.6251, 0.1]],
  ];

  for (const [name, at, beyond] of sizes) {
    test(`the ${name} passes at its limit and fails one step beyond`, () => {
      expect(admitSlabs(levelWith(at).props)).toEqual([]);
      expect(admitSlabs(levelWith(beyond).props).map((p) => [p.rule, p.path])).toEqual([
        ["slab", "props[1]"],
      ]);
    });
  }

  test("states a broken size with the prop path, the slab index and the limit", () => {
    const level = gridLevel([gridSlab()], [gridSlab(), gridSlab([50, 1, 0.1])]);
    expect(admitSlabs(level.props).map((p) => p.message)).toEqual([
      "props[1] slab 1: 50 x 1 x 0.1 m breaks the side range 0.02 to 40 m",
      "props[1] slab 1: 50 x 1 x 0.1 m breaks the face cap of 25 m2",
    ]);
  });

  test("the slab count passes at 1,024 and fails at 1,025", () => {
    expect(admitSlabs(levelOfSlabs(1024).props)).toEqual([]);
    expect(admitSlabs(levelOfSlabs(1025).props)).toEqual([
      {
        rule: "slab",
        path: "props",
        message: "the level has 1,025 slabs; the format admits 1,024",
      },
    ]);
  });

  const refused: readonly [string, Level][] = [
    ["a short side", levelWith([0.0199, 1, 0.1])],
    ["a large face", levelWith([5, 5.0001, 0.1])],
    ["too many slabs", levelOfSlabs(1025)],
  ];

  for (const [name, level] of refused) {
    test(`the decoder refuses ${name} with the admission's own problems`, () => {
      const problems = admitSlabs(level.props);
      expect(problems.length).toBeGreaterThan(0);
      expect(problemsOf(decodeLevel(encodeLevel(level)))).toEqual(problems);
    });
  }

  test("the decoder skips the admission while the shape fails", () => {
    const document = changed(documentOf(levelWith([50, 1, 0.1])), "schema", "other");
    expect(rulePaths(decodeLevel(JSON.stringify(document)))).toEqual([["shape", "schema"]]);
  });
});
