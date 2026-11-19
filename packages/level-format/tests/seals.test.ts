import { describe, expect, test } from "bun:test";
import { parseDescription, seedOfId } from "@level-designer/level-format";
import type { Seal } from "@level-designer/level-format";
import type { LimitCase } from "./fixtures.ts";
import {
  changed,
  closedRange,
  expectLimit,
  paintedSeal,
  problemsOf,
  rulePaths,
  staticsDescription,
  validDescription,
  validSeal,
  validStatic,
} from "./fixtures.ts";

/** The valid description with the one seal `record`. */
function withSeal(record: Record<string, unknown>): Record<string, unknown> {
  return { ...validDescription(), seals: [record] };
}

/** The admission of `document`. */
function parse(document: unknown): ReturnType<typeof parseDescription> {
  return parseDescription(JSON.stringify(document));
}

/** The admitted seals of the valid description with the one seal `record`. */
function admitted(record: Record<string, unknown>): readonly Seal[] | undefined {
  const admission = parse(withSeal(record));
  expect(problemsOf(admission)).toEqual([]);
  return admission.ok ? admission.value.seals : undefined;
}

describe("seals: the record", () => {
  test("a seal without a finish admits as before, with no paint key", () => {
    expect(admitted(validSeal())).toStrictEqual([
      {
        id: "end-wall",
        min: [0, 0, 0],
        max: [2, 3, 0.3],
        color: "#20242a",
        metalness: 0,
        roughness: 0.9,
      },
    ]);
  });

  test("a painted seal has every default filled, the seed from the id, and no glow", () => {
    expect(admitted(paintedSeal())).toStrictEqual([
      {
        id: "end-wall",
        min: [0, 0, 0],
        max: [2, 3, 0.3],
        color: "#20242a",
        finish: "housing/machine",
        number: 0,
        wear: 0.3,
        seed: seedOfId("end-wall"),
      },
    ]);
  });

  test("a painted seal with every paint key at a limit at once keeps every stated value", () => {
    const record = { ...paintedSeal(), number: 999_999, wear: 1, seed: 4095, glow: "cyan" };
    const [seal] = admitted(record) ?? [];
    expect<unknown>(seal).toStrictEqual(record);
  });
});

describe("seals: limits of a painted seal", () => {
  const probes: readonly LimitCase[] = [
    ["seals[0].number", 0, -1],
    ["seals[0].number", 999_999, 1_000_000],
    ["seals[0].number", 0, 0.5],
    ["seals[0].seed", 0, -1],
    ["seals[0].seed", 4095, 4096],
    ["seals[0].seed", 0, 0.5],
    ...closedRange("seals[0].wear", 0, 1),
    ["seals[0].max[2]", 0.05, 0.0499, "seals[0]"],
    ["seals[0].max[2]", 0.05, 0.04, "seals[0]"],
  ];

  for (const probe of probes) {
    test(`${probe[0]} passes at ${String(probe[1])} and fails at ${String(probe[2])}`, () => {
      expectLimit(parseDescription, withSeal(paintedSeal()), probe);
    });
  }
});

describe("seals: the two looks", () => {
  const refusals: readonly [string, Record<string, unknown>, [string, string]][] = [
    ["a glow that glows lacks", { ...paintedSeal(), glow: "amber" }, ["shape", "seals[0].glow"]],
    ["a glow that is no text", { ...paintedSeal(), glow: 3 }, ["shape", "seals[0].glow"]],
    [
      "a metalness beside a finish",
      { ...paintedSeal(), metalness: 0 },
      ["shape", "seals[0].metalness"],
    ],
    [
      "a roughness beside a finish",
      { ...paintedSeal(), roughness: 1 },
      ["shape", "seals[0].roughness"],
    ],
    [
      "a flat seal without metalness",
      { ...validSeal(), metalness: undefined },
      ["shape", "seals[0].metalness"],
    ],
    [
      "a flat seal without roughness",
      { ...validSeal(), roughness: undefined },
      ["shape", "seals[0].roughness"],
    ],
    ["a number on a flat seal", { ...validSeal(), number: 3 }, ["shape", "seals[0].number"]],
    ["a wear on a flat seal", { ...validSeal(), wear: 0.5 }, ["shape", "seals[0].wear"]],
    ["a seed on a flat seal", { ...validSeal(), seed: 7 }, ["shape", "seals[0].seed"]],
    [
      "an unknown glow on a flat seal",
      { ...validSeal(), glow: "amber" },
      ["shape", "seals[0].glow"],
    ],
    [
      "a path the table lacks",
      { ...paintedSeal(), finish: "housing/door" },
      ["finish", "seals[0].finish"],
    ],
  ];

  for (const [name, record, rulePath] of refusals) {
    test(`refuses ${name} with one problem at its path`, () => {
      expect(rulePaths(parse(withSeal(record)))).toEqual([rulePath]);
    });
  }

  test("each refusal reads in the format's own forms", () => {
    const beside = problemsOf(parse(withSeal({ ...paintedSeal(), metalness: 0 })));
    const missing = problemsOf(parse(withSeal({ ...validSeal(), roughness: undefined })));
    const path = problemsOf(parse(withSeal({ ...paintedSeal(), finish: "housing/door" })));
    expect(beside.map((p) => p.message)).toEqual([
      expect.stringMatching(/^seals\[0\]\.metalness: expected .+, got an unknown key$/),
    ]);
    expect(missing.map((p) => p.message)).toEqual([
      "seals[0].roughness: expected a value, got nothing",
    ]);
    expect(path.map((p) => p.message)).toEqual(['seals[0].finish: no finish "housing/door"']);
  });
});

describe("seals: a glow's name and the order of problems", () => {
  const brokenGlows: readonly [string, unknown][] = [
    ["is no object", "x"],
    [
      "holds more than 8 glows",
      Object.fromEntries(
        Array.from({ length: 9 }, (_, i) => [`g${i}`, { color: [1, 1, 1], strength: 1 }]),
      ),
    ],
  ];

  for (const [name, glows] of brokenGlows) {
    test(`a glows map that ${name} yields its own problem alone`, () => {
      const document = changed(withSeal({ ...paintedSeal(), glow: "amber" }), "glows", glows);
      expect(rulePaths(parse(document))).toEqual([["shape", "glows"]]);
    });
  }

  test("a missing glows map yields its own problem alone", () => {
    const document = changed(withSeal({ ...paintedSeal(), glow: "amber" }), "glows");
    expect(rulePaths(parse(document))).toEqual([["shape", "glows"]]);
  });

  test("a seal's glow name stands after the glows' problems and before the props'", () => {
    const sealed = withSeal({ ...paintedSeal(), glow: "amber" });
    const document = changed(changed(sealed, 'glows["cyan"].strength', 101), "props[0].yaw", "x");
    expect(rulePaths(parse(document))).toEqual([
      ["shape", 'glows["cyan"].strength'],
      ["shape", "seals[0].glow"],
      ["shape", "props[0].yaw"],
    ]);
  });

  test("finish problems stand in document order: the base, the seals, the statics", () => {
    const missing = { ...validStatic(), finish: "housing/door" };
    const sealed = {
      ...staticsDescription([missing]),
      seals: [{ ...paintedSeal(), finish: "housing/door" }],
    };
    const document = changed(sealed, 'base.materials["Steel_Dark"].finish', "housing/door");
    expect(rulePaths(parse(document))).toEqual([
      ["finish", 'base.materials["Steel_Dark"].finish'],
      ["finish", "seals[0].finish"],
      ["finish", "statics[0].finish"],
    ]);
  });
});
