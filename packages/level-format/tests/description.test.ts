import { describe, expect, test } from "bun:test";
import { parseDescription } from "@level-designer/level-format";
import type { LimitCase } from "./fixtures.ts";
import {
  changed,
  closedRange,
  expectLimit,
  problemsOf,
  rulePaths,
  validDescription,
  validProp,
  validSeal,
} from "./fixtures.ts";

/** The admission of the description text of `document`. */
function parse(document: unknown): ReturnType<typeof parseDescription> {
  return parseDescription(JSON.stringify(document));
}

/** `count` seals with distinct ids, each a valid box. */
function seals(count: number): unknown[] {
  return Array.from({ length: count }, (_, i) => validSeal(`seal-${i}`));
}

/** `count` props with distinct ids, or all with `id` when it is given. */
function props(count: number, id?: string): unknown[] {
  return Array.from({ length: count }, (_, i) => validProp(id ?? `prop-${i}`));
}

/** `count` glows with distinct names. */
function glows(count: number): Record<string, unknown> {
  const glow = { color: [1, 1, 1], strength: 1 };
  return Object.fromEntries(Array.from({ length: count }, (_, i) => [`glow-${i}`, glow]));
}

/** Rejections of one fault each: a name, the description and the path of the problem. */
const rejections: readonly [string, unknown, string][] = [
  ["a root that is not an object", [], "$"],
  ["an unknown root key", { ...validDescription(), extra: 1 }, "extra"],
  ["a missing key", changed(validDescription(), "props[0].yaw"), "props[0].yaw"],
  ["a string for a number", changed(validDescription(), "props[0].yaw", "90"), "props[0].yaw"],
  [
    "another schema",
    changed(validDescription(), "schema", "level-designer-description/2"),
    "schema",
  ],
  ["a name that is no id", changed(validDescription(), "name", "Dark Factory"), "name"],
  [
    "a seal colour not in #rrggbb",
    changed(validDescription(), "seals[0].color", "red"),
    "seals[0].color",
  ],
  [
    "a plan position of three numbers",
    changed(validDescription(), "props[0].at", [1, 2, 3]),
    "props[0].at",
  ],
  [
    "params that are no object",
    changed(validDescription(), "props[0].params", []),
    "props[0].params",
  ],
  ["a kind that is no string", changed(validDescription(), "props[0].kind", 7), "props[0].kind"],
  [
    "an unknown override key",
    changed(validDescription(), 'base.materials["Mat.001"]', { shine: 1 }),
    'base.materials["Mat.001"].shine',
  ],
  ["a second key light", changed(validDescription(), "lighting.key", [{}, {}]), "lighting.key"],
  [
    "a mesh name that is no string",
    changed(validDescription(), "base.doubleSided[1]", 3),
    "base.doubleSided[1]",
  ],
  ["a seal list that is no list", changed(validDescription(), "seals", "x"), "seals"],
];

describe("parseDescription", () => {
  test("admits the valid description into a typed value", () => {
    const admission = parse(validDescription());
    expect(problemsOf(admission)).toEqual([]);
    const description = admission.ok ? admission.value : undefined;
    expect(description?.props[0]?.params.get("glow")).toBe("cyan");
    expect(description?.glows.get("cyan")?.strength).toBe(6);
    expect(description?.base.materials.get("Lamp")?.emissive?.strength).toBe(2);
  });

  for (const [name, document, path] of rejections) {
    test(`rejects ${name} with one problem at ${path}`, () => {
      expect(rulePaths(parseDescription(JSON.stringify(document)))).toEqual([["shape", path]]);
    });
  }

  test("rejects text that is not JSON at the root path", () => {
    expect(rulePaths(parseDescription("{ schema: "))).toEqual([["shape", "$"]]);
  });

  test("states a shape problem as path, requirement and found value", () => {
    const problems = problemsOf(parse(changed(validDescription(), "seals[0].metalness", 1.5)));
    expect(problems.map((p) => p.message)).toEqual([
      "seals[0].metalness: expected a number from 0 to 1, got 1.5",
    ]);
  });

  test("reports a failed record once, without problems for its keys", () => {
    expect(rulePaths(parse(changed(validDescription(), "base", 3)))).toEqual([["shape", "base"]]);
  });

  test("rejects an id used by a seal and a prop, naming both paths", () => {
    const id = `a${"b".repeat(47)}`;
    const document = changed(changed(validDescription(), "seals[0].id", id), "props[0].id", id);
    expect(problemsOf(parse(document))).toEqual([
      {
        rule: "id",
        path: "props[0].id",
        message: `props[0].id: id "${id}" is already used at seals[0].id`,
      },
    ]);
  });

  test("rejects an id used by two props", () => {
    const document = changed(validDescription(), "props", props(2, "twin"));
    expect(rulePaths(parse(document))).toEqual([["id", "props[1].id"]]);
  });

  test("admits a seal whose id equals the name, which takes no part in id uniqueness", () => {
    const document = changed(validDescription(), "seals[0].id", "dark-factory");
    expect(rulePaths(parse(document))).toEqual([]);
  });

  test("rejects a number too large to be finite", () => {
    const text = JSON.stringify(changed(validDescription(), "props[0].yaw", "HUGE"));
    const admission = parseDescription(text.replace('"HUGE"', "1e999"));
    expect(rulePaths(admission)).toEqual([["shape", "props[0].yaw"]]);
  });

  test("gives two long keys that share a 40-character start two distinct paths", () => {
    const [first, second] = [`${"A".repeat(40)} one`, `${"A".repeat(40)} two`];
    const base = changed(validDescription(), `base.materials["${first}"]`, { shine: 1 });
    const document = changed(base, `base.materials["${second}"]`, { shine: 1 });
    expect(rulePaths(parse(document))).toEqual([
      ["shape", `base.materials["${first}"].shine`],
      ["shape", `base.materials["${second}"].shine`],
    ]);
  });
});

describe("description caps and ranges", () => {
  const id48 = `a${"b".repeat(47)}`;
  const caps: readonly LimitCase[] = [
    ["seals", seals(16), seals(17)],
    ["glows", glows(8), glows(9)],
    ["props", props(512), props(513)],
    ["seals[0].id", id48, `${id48}c`],
    ["name", id48, `${id48}c`],
    ["seals[0].max[2]", 0.05, 0.0499, "seals[0]"],
    ["seals[0].max[0]", 0.05, 0.0499, "seals[0]"],
    ["base.scale", 0.0001, 0],
  ];
  const ranges: readonly LimitCase[] = [
    ...closedRange('base.materials["Steel_Dark"].tint[0]', 0, 1),
    ...closedRange('base.materials["Steel_Dark"].metalness', 0, 1),
    ...closedRange('base.materials["Steel_Dark"].roughness', 0, 1),
    ...closedRange('base.materials["Lamp"].emissive.color[1]', 0, 1),
    ...closedRange('base.materials["Lamp"].emissive.strength', 0, 100),
    ...closedRange("seals[0].metalness", 0, 1),
    ...closedRange("seals[0].roughness", 0, 1),
    ...closedRange('glows["cyan"].color[2]', 0, 1),
    ...closedRange('glows["cyan"].strength', 0, 100),
  ];

  for (const probe of [...caps, ...ranges]) {
    test(`${probe[0]} passes at ${String(probe[1]).slice(0, 12)} and fails one step beyond`, () => {
      expectLimit(parseDescription, validDescription(), probe);
    });
  }

  test("a seal typed at 0.05 m thick passes despite float subtraction", () => {
    const document = changed(
      changed(validDescription(), "seals[0].min[2]", 0.1),
      "seals[0].max[2]",
      0.15,
    );
    expect(rulePaths(parse(document))).toEqual([]);
  });
});
