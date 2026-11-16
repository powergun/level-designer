import { describe, expect, test } from "bun:test";
import { listKinds } from "@level-designer/prop-kit";
import { refused } from "./fixtures.ts";

const DARK = "#3b4046";

/** The one problem of a refused prop. */
function onlyProblem(...args: Parameters<typeof refused>): {
  rule: string;
  path: string;
  message: string;
} {
  const problems = refused(...args);
  expect(problems.length).toBe(1);
  return problems[0] ?? { rule: "", path: "", message: "" };
}

describe("the kind error", () => {
  test("an unknown kind names its path and lists the kinds that exist", () => {
    expect(onlyProblem("Crate", { color: DARK })).toEqual({
      rule: "kind",
      path: "props[3].kind",
      message:
        'props[3].kind: unknown kind "Crate"; the kinds are conveyor, enclosure, container, crate, partition and light-strip',
    });
    for (const near of [" crate", "crates"]) {
      const problem = onlyProblem(near, { color: DARK });
      expect([problem.rule, problem.path]).toEqual(["kind", "props[3].kind"]);
    }
  });
});

describe("the param error names the range of a number", () => {
  test("a length beyond its range", () => {
    expect(onlyProblem("conveyor", { length: 12.000000000000002, color: DARK })).toEqual({
      rule: "param",
      path: "props[3].params.length",
      message: "props[3].params.length: conveyor takes length 1 to 12, got 12.000000000000002",
    });
  });

  test("a value below its range", () => {
    const problem = onlyProblem("crate", { size: 0.5999999999999999, color: DARK });
    expect(problem.message).toBe(
      "props[3].params.size: crate takes size 0.6 to 1.8, got 0.5999999999999999",
    );
  });

  test("a missing required parameter", () => {
    const problem = onlyProblem("partition", { width: 2, color: DARK });
    expect(problem.path).toBe("props[3].params.height");
    expect(problem.message).toBe(
      "props[3].params.height: partition takes height 1 to 4, got nothing",
    );
  });

  test("a number of the wrong type", () => {
    const problem = onlyProblem("conveyor", { length: "8", color: DARK });
    expect(problem.message).toBe('props[3].params.length: conveyor takes length 1 to 12, got "8"');
  });
});

describe("the param error names the form, the choices or the names", () => {
  test("a colour that is not #rrggbb text, and a missing colour", () => {
    expect(onlyProblem("crate", { color: "red" }).message).toBe(
      'props[3].params.color: crate takes color as #rrggbb text, got "red"',
    );
    expect(onlyProblem("crate", {}).message).toBe(
      "props[3].params.color: crate takes color as #rrggbb text, got nothing",
    );
  });

  test("a material the kind does not take", () => {
    const problem = onlyProblem("enclosure", {
      width: 2,
      length: 2,
      material: "wood",
      color: DARK,
    });
    expect(problem.message).toBe(
      'props[3].params.material: enclosure takes material metal or concrete, got "wood"',
    );
    const cased = onlyProblem("enclosure", {
      width: 2,
      length: 2,
      material: "Concrete",
      color: DARK,
    });
    expect(cased.path).toBe("props[3].params.material");
  });
});

describe("the param error names the glows", () => {
  test("a glow that glows does not name", () => {
    const problem = onlyProblem("conveyor", { length: 2, color: DARK, glow: "pink" });
    expect(problem.message).toBe(
      'props[3].params.glow: conveyor takes glow as one of the glows "cyan" or "amber", got "pink"',
    );
    const cased = onlyProblem("conveyor", { length: 2, color: DARK, glow: "Cyan" });
    expect(cased.path).toBe("props[3].params.glow");
    const one = onlyProblem(
      "conveyor",
      { length: 2, color: DARK, glow: "pink" },
      new Set(["cyan"]),
    );
    expect(one.message).toBe(
      'props[3].params.glow: conveyor takes glow as one of the glows "cyan", got "pink"',
    );
    const none = onlyProblem("conveyor", { length: 2, color: DARK, glow: "cyan" }, new Set());
    expect(none.message).toBe(
      'props[3].params.glow: conveyor takes glow as a glow name, and glows holds none, got "cyan"',
    );
  });

  test("a light strip without its required glow", () => {
    const problem = onlyProblem("light-strip", { length: 2, height: 3, color: DARK });
    expect(problem.path).toBe("props[3].params.glow");
    expect(problem.message).toContain("got nothing");
  });

  test("unknown keys come first, then table parameters in table order; odd keys bracketed", () => {
    const problems = refused("crate", {
      "odd key": 1,
      lid: true,
      constructor: 2,
      Size: 1,
      color: "red",
      size: 9,
    });
    expect(problems.map((p) => [p.rule, p.path])).toEqual([
      ["param", 'props[3].params["odd key"]'],
      ["param", "props[3].params.lid"],
      ["param", "props[3].params.constructor"],
      ["param", "props[3].params.Size"],
      ["param", "props[3].params.size"],
      ["param", "props[3].params.color"],
    ]);
    expect(problems[1]?.message).toBe(
      'props[3].params.lid: crate takes only size and color, got "lid"',
    );
  });
});

describe("the kind listing", () => {
  test("lists every kind with the format's parameters, ranges, choices and defaults", () => {
    const optionalGlow = { name: "glow", type: "glow", required: false } as const;
    expect(listKinds()).toEqual([
      {
        name: "conveyor",
        params: [
          { name: "length", type: "number", min: 1, max: 12 },
          { name: "width", type: "number", min: 0.6, max: 1.6, default: 0.8 },
          { name: "height", type: "number", min: 0.6, max: 1.2, default: 0.9 },
          { name: "color", type: "color" },
          optionalGlow,
        ],
      },
      {
        name: "enclosure",
        params: [
          { name: "width", type: "number", min: 1, max: 6 },
          { name: "length", type: "number", min: 1, max: 8 },
          { name: "height", type: "number", min: 1.5, max: 3.5, default: 2.4 },
          { name: "material", type: "material", choices: ["metal", "concrete"], default: "metal" },
          { name: "color", type: "color" },
          optionalGlow,
        ],
      },
      {
        name: "container",
        params: [
          { name: "length", type: "number", min: 3, max: 12.2, default: 6.06 },
          { name: "color", type: "color" },
        ],
      },
      {
        name: "crate",
        params: [
          { name: "size", type: "number", min: 0.6, max: 1.8, default: 1.2 },
          { name: "color", type: "color" },
        ],
      },
      {
        name: "partition",
        params: [
          { name: "width", type: "number", min: 1, max: 8 },
          { name: "height", type: "number", min: 1, max: 4 },
          { name: "thickness", type: "number", min: 0.1, max: 0.6, default: 0.3 },
          {
            name: "material",
            type: "material",
            choices: ["wood", "brick", "concrete", "metal"],
            default: "concrete",
          },
          { name: "color", type: "color" },
        ],
      },
      {
        name: "light-strip",
        params: [
          { name: "length", type: "number", min: 0.5, max: 12 },
          { name: "width", type: "number", min: 0.1, max: 0.6, default: 0.2 },
          { name: "height", type: "number", min: 2.5, max: 17 },
          { name: "color", type: "color" },
          { name: "glow", type: "glow", required: true },
        ],
      },
    ]);
  });
});
