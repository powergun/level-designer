import { describe, expect, test } from "bun:test";
import { listKinds } from "@level-designer/prop-kit";
import { expanded, refused } from "./fixtures.ts";

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
        'props[3].kind: unknown kind "Crate"; the kinds are conveyor, enclosure, robot-arm, container, crate, partition, bridge-crane, jib-crane and light-strip',
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

describe("the parameters that choose a role pass at every value and fail one step beside", () => {
  test("door takes +z, -z or none and nothing else", () => {
    for (const door of ["+z", "-z", "none"]) {
      expect(expanded("container", { color: DARK, door }).length).toBe(5);
    }
    for (const door of ["+Z", "front", "", true, 1]) {
      const problem = onlyProblem("container", { color: DARK, door });
      expect(problem.path).toBe("props[3].params.door");
    }
    expect(onlyProblem("container", { color: DARK, door: "+Z" }).message).toBe(
      'props[3].params.door: container takes door +z, -z or none, got "+Z"',
    );
  });

  test("stencil takes true or false and nothing else", () => {
    for (const stencil of [true, false]) {
      expect(expanded("crate", { color: DARK, stencil }).length).toBe(5);
    }
    for (const stencil of ["true", 0, 1, null]) {
      const problem = onlyProblem("crate", { color: DARK, stencil });
      expect(problem.path).toBe("props[3].params.stencil");
    }
    expect(onlyProblem("crate", { color: DARK, stencil: "false" }).message).toBe(
      'props[3].params.stencil: crate takes stencil as true or false, got "false"',
    );
  });

  test("a partition's finish takes text and nothing else", () => {
    const wall = { width: 2, height: 2, color: DARK };
    for (const finish of [3, true, null, ["block", "wall"]]) {
      const problem = onlyProblem("partition", { ...wall, finish });
      expect([problem.rule, problem.path]).toEqual(["param", "props[3].params.finish"]);
    }
    expect(onlyProblem("partition", { ...wall, finish: 3 }).message).toBe(
      "props[3].params.finish: partition takes finish as finish/role text, got 3",
    );
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
      'props[3].params.lid: crate takes only size, color, stencil, wear and seed, got "lid"',
    );
  });
});

describe("the articulated and overhead kinds", () => {
  test("an arm angle beyond its range names the range", () => {
    expect(onlyProblem("robot-arm", { shoulder: 29.9999, color: DARK }).message).toBe(
      "props[3].params.shoulder: robot-arm takes shoulder 30 to 90, got 29.9999",
    );
  });

  test("an optional colour names the colour form, and its absence passes", () => {
    expect(onlyProblem("robot-arm", { color: DARK, baseColor: "grey" }).message).toBe(
      'props[3].params.baseColor: robot-arm takes baseColor as #rrggbb text, got "grey"',
    );
    expect(expanded("robot-arm", { color: DARK }).every((s) => s.slab.color === DARK)).toBe(true);
  });

  test("a hookDrop 0.1 mm beyond railHeight less 2.5 m names the limit it reached", () => {
    const crane = { span: 12, travel: 20, railHeight: 6.1, color: DARK };
    expect(onlyProblem("bridge-crane", { ...crane, hookDrop: 3.6001 })).toEqual({
      rule: "param",
      path: "props[3].params.hookDrop",
      message:
        "props[3].params.hookDrop: bridge-crane takes hookDrop 0.5 to 3.6 at railHeight 6.1, got 3.6001",
    });
    expect(expanded("bridge-crane", { ...crane, hookDrop: 3.6 }).length).toBe(16);
  });

  test("a hookDrop beyond its own range names the plain range, not the limit", () => {
    const crane = { span: 12, travel: 20, railHeight: 15.5, color: DARK };
    expect(onlyProblem("bridge-crane", { ...crane, hookDrop: 8.0001 }).message).toBe(
      "props[3].params.hookDrop: bridge-crane takes hookDrop 0.5 to 8, got 8.0001",
    );
    expect(onlyProblem("bridge-crane", { ...crane, railHeight: 6, hookDrop: 7 }).message).toBe(
      "props[3].params.hookDrop: bridge-crane takes hookDrop 0.5 to 3.5 at railHeight 6, got 7",
    );
  });

  test("the hookDrop limit waits until every other parameter passes", () => {
    const problem = onlyProblem("bridge-crane", {
      span: 12,
      travel: 20,
      railHeight: 6,
      hookDrop: 7,
    });
    expect(problem.path).toBe("props[3].params.color");
  });
});

describe("the paint parameters every kind takes", () => {
  test("wear passes at 0 and 1 and names its range one step beyond", () => {
    for (const wear of [0, 1]) {
      expect(expanded("crate", { color: DARK, wear }).length).toBe(5);
    }
    for (const wear of [-0.0001, 1.0001]) {
      expect(onlyProblem("crate", { color: DARK, wear })).toEqual({
        rule: "param",
        path: "props[3].params.wear",
        message: `props[3].params.wear: crate takes wear 0 to 1, got ${wear}`,
      });
    }
  });

  test("seed passes at 0 and 4095 and refuses a value beyond, a fraction and text", () => {
    for (const seed of [0, 4095]) {
      expect(expanded("crate", { color: DARK, seed }).length).toBe(5);
    }
    for (const seed of [-1, 4096, 0.5, "7"]) {
      const problem = onlyProblem("crate", { color: DARK, seed });
      expect([problem.rule, problem.path]).toEqual(["param", "props[3].params.seed"]);
      expect(problem.message).toStartWith(
        "props[3].params.seed: crate takes seed as a whole number 0 to 4095, got ",
      );
    }
  });
});

/** An optional glow, as the listing shows it. */
const optionalGlow = { name: "glow", type: "glow", required: false } as const;

/** The required colour every kind takes, as the listing shows it. */
const requiredColor = { name: "color", type: "color", required: true } as const;

/** The two parameters every kind takes after its own, as the listing shows them. */
const COMMON = [
  { name: "wear", type: "number", min: 0, max: 1, default: 0.3 },
  { name: "seed", type: "seed", min: 0, max: 4095 },
] as const;

/** The format's kinds with their parameters, ranges, choices and defaults, in its order. */
const LISTING: ReturnType<typeof listKinds> = [
  {
    name: "conveyor",
    params: [
      { name: "length", type: "number", min: 1, max: 12 },
      { name: "width", type: "number", min: 0.6, max: 1.6, default: 0.8 },
      { name: "height", type: "number", min: 0.6, max: 1.2, default: 0.9 },
      requiredColor,
      optionalGlow,
      ...COMMON,
    ],
  },
  {
    name: "enclosure",
    params: [
      { name: "width", type: "number", min: 1, max: 6 },
      { name: "length", type: "number", min: 1, max: 8 },
      { name: "height", type: "number", min: 1.5, max: 3.5, default: 2.4 },
      { name: "material", type: "material", choices: ["metal", "concrete"], default: "metal" },
      requiredColor,
      optionalGlow,
      ...COMMON,
    ],
  },
  {
    name: "robot-arm",
    params: [
      { name: "reach", type: "number", min: 1.5, max: 3.5, default: 2.5 },
      { name: "shoulder", type: "number", min: 30, max: 90, default: 55 },
      { name: "elbow", type: "number", min: 60, max: 160, default: 100 },
      requiredColor,
      { name: "baseColor", type: "color", required: false },
      optionalGlow,
      ...COMMON,
    ],
  },
  {
    name: "container",
    params: [
      { name: "length", type: "number", min: 3, max: 12.2, default: 6.06 },
      requiredColor,
      { name: "door", type: "choice", choices: ["+z", "-z", "none"], default: "none" },
      ...COMMON,
    ],
  },
  {
    name: "crate",
    params: [
      { name: "size", type: "number", min: 0.6, max: 1.8, default: 1.2 },
      requiredColor,
      { name: "stencil", type: "boolean", default: true },
      ...COMMON,
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
      requiredColor,
      {
        name: "finish",
        type: "finish",
        byMaterial: {
          concrete: "cast-concrete/panel",
          metal: "steel-stock/stack",
          wood: "timber/stack",
          brick: "block/wall",
        },
      },
      ...COMMON,
    ],
  },
  {
    name: "bridge-crane",
    params: [
      { name: "span", type: "number", min: 10, max: 30 },
      { name: "travel", type: "number", min: 10, max: 60 },
      { name: "railHeight", type: "number", min: 6, max: 15.5 },
      { name: "bridgeAt", type: "number", min: 0, max: 1, default: 0.5 },
      { name: "trolleyAt", type: "number", min: 0, max: 1, default: 0.5 },
      { name: "hookDrop", type: "number", min: 0.5, max: 8, default: 2 },
      requiredColor,
      { name: "runwayColor", type: "color", required: false },
      ...COMMON,
    ],
  },
  {
    name: "jib-crane",
    params: [
      { name: "height", type: "number", min: 3, max: 8, default: 5 },
      { name: "boom", type: "number", min: 2, max: 8, default: 4 },
      requiredColor,
      ...COMMON,
    ],
  },
  {
    name: "light-strip",
    params: [
      { name: "length", type: "number", min: 0.5, max: 12 },
      { name: "width", type: "number", min: 0.1, max: 0.6, default: 0.2 },
      { name: "height", type: "number", min: 2.5, max: 17 },
      requiredColor,
      { name: "glow", type: "glow", required: true },
      ...COMMON,
    ],
  },
];

describe("the kind listing", () => {
  test("lists every kind with the format's parameters, ranges, choices and defaults", () => {
    expect(listKinds()).toEqual(LISTING);
  });
});
