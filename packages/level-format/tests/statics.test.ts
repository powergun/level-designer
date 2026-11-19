import { describe, expect, test } from "bun:test";
import { parseDescription, seedOfId, staticClass } from "@level-designer/level-format";
import type { Description, StaticClass, StaticObject } from "@level-designer/level-format";
import type { LimitCase } from "./fixtures.ts";
import {
  changed,
  closedRange,
  expectLimit,
  problemsOf,
  rulePaths,
  staticsDescription,
  validStatic,
} from "./fixtures.ts";

/** The prop and the seal of the valid description, which a static object can name. */
const PROP = "line-a-conveyor-03";
const SEAL = "end-wall";

/** The admission of the valid description with `statics`. */
function parse(records: readonly unknown[]): ReturnType<typeof parseDescription> {
  return parseDescription(JSON.stringify(staticsDescription(records)));
}

/** The admitted static objects of the valid description with `statics`. */
function admitted(records: readonly unknown[]): readonly StaticObject[] | undefined {
  const admission = parse(records);
  expect(problemsOf(admission)).toEqual([]);
  return admission.ok ? admission.value.statics : undefined;
}

/** `count` static objects with distinct ids. */
function litters(count: number): unknown[] {
  return Array.from({ length: count }, (_, i) => validStatic(`litter-${i}`));
}

/** The valid description with one static object `record`. */
function withStatic(record: Record<string, unknown>): Record<string, unknown> {
  return staticsDescription([record]);
}

describe("static objects: the record", () => {
  test("a description without statics admits and holds no static object", () => {
    const admission = parseDescription(JSON.stringify(changed(staticsDescription([]), "statics")));
    const description: Description | undefined = admission.ok ? admission.value : undefined;
    expect(problemsOf(admission)).toEqual([]);
    expect(description?.statics).toEqual([]);
  });

  test("the admission fills every default, the seed from the id", () => {
    expect(admitted([validStatic("sheet-12")])).toEqual([
      {
        id: "sheet-12",
        at: [-4.3, -2.1],
        yaw: 0,
        size: [0.6, 0.02, 0.4],
        lift: 0,
        color: "#8b9097",
        finish: "housing/machine",
        number: 0,
        wear: 0.3,
        seed: seedOfId("sheet-12"),
      },
    ]);
  });

  test("an object with every key at a limit at once keeps every stated value", () => {
    const record = {
      ...validStatic(),
      yaw: -359.9,
      size: [0.02, 0.02, 0.02],
      lift: 0,
      number: 999_999,
      wear: 1,
      seed: 4095,
      glow: "cyan",
    };
    const [object] = admitted([record]) ?? [];
    expect(object).toMatchObject({ ...record, at: [-4.3, -2.1] });
  });

  test("an object on a prop keeps its on and reads a lift of 0", () => {
    const [object] = admitted([{ ...validStatic(), on: PROP }]) ?? [];
    expect([object?.on, object?.lift]).toEqual([PROP, 0]);
  });
});

describe("static objects: limits", () => {
  const probes: readonly LimitCase[] = [
    ["statics", litters(256), litters(257)],
    ["statics[0].size[0]", 0.02, 0.0199],
    ["statics[0].size[1]", 0.02, 0.0199],
    ["statics[0].size[2]", 0.02, 0.0199],
    ["statics[0].lift", 0, -0.0001],
    ["statics[0].number", 0, -1],
    ["statics[0].number", 999_999, 1_000_000],
    ["statics[0].number", 0, 0.5],
    ["statics[0].seed", 0, -1],
    ["statics[0].seed", 4095, 4096],
    ...closedRange("statics[0].wear", 0, 1),
  ];

  for (const probe of probes) {
    test(`${probe[0]} passes at ${String(probe[1]).slice(0, 12)} and fails one step beyond`, () => {
      expectLimit(parseDescription, withStatic(validStatic()), probe);
    });
  }

  test("a side states its requirement in metres", () => {
    const document = changed(withStatic(validStatic()), "statics[0].size[1]", 0.0199);
    expect(problemsOf(parseDescription(JSON.stringify(document))).map((p) => p.message)).toEqual([
      "statics[0].size[1]: expected a side of at least 0.02 m, got 0.0199",
    ]);
  });
});

describe("static objects: references and ids", () => {
  const refusals: readonly [string, Record<string, unknown>, [string, string]][] = [
    ["a glow that glows lacks", { ...validStatic(), glow: "amber" }, ["shape", "statics[0].glow"]],
    ["an on that names no prop", { ...validStatic(), on: "crate-9" }, ["shape", "statics[0].on"]],
    ["an on that names a seal", { ...validStatic(), on: SEAL }, ["shape", "statics[0].on"]],
    [
      "a lift beside an on",
      { ...validStatic(), on: PROP, lift: 2.5 },
      ["shape", "statics[0].lift"],
    ],
    [
      "a lift of 0 beside an on",
      { ...validStatic(), on: PROP, lift: 0 },
      ["shape", "statics[0].lift"],
    ],
    ["an id a seal holds", validStatic(SEAL), ["id", "statics[0].id"]],
    ["an id a prop holds", validStatic(PROP), ["id", "statics[0].id"]],
    [
      "a path the table lacks",
      { ...validStatic(), finish: "housing/door" },
      ["finish", "statics[0].finish"],
    ],
  ];

  for (const [name, record, rulePath] of refusals) {
    test(`refuses ${name} with one problem at its path`, () => {
      expect(rulePaths(parse([record]))).toEqual([rulePath]);
    });
  }

  test("an id clash names the first claimant, and a missing path names the path", () => {
    const messages = problemsOf(parse([validStatic(SEAL)])).map((p) => p.message);
    const missing = problemsOf(parse([{ ...validStatic(), finish: "housing/door" }]));
    expect(messages).toEqual([`statics[0].id: id "${SEAL}" is already used at seals[0].id`]);
    expect(missing.map((p) => p.message)).toEqual(['statics[0].finish: no finish "housing/door"']);
  });

  test("a glows map that fails its shape yields its own problem alone", () => {
    const document = changed(withStatic({ ...validStatic(), glow: "amber" }), "glows", "x");
    expect(rulePaths(parseDescription(JSON.stringify(document)))).toEqual([["shape", "glows"]]);
  });

  test("two static objects may not share an id", () => {
    expect(rulePaths(parse([validStatic("twin"), validStatic("twin")]))).toEqual([
      ["id", "statics[1].id"],
    ]);
  });
});

describe("staticClass", () => {
  const cases: readonly [Record<string, unknown>, StaticClass][] = [
    [validStatic(), "floor"],
    [{ ...validStatic(), lift: 0.0001 }, "overhead"],
    [{ ...validStatic(), on: PROP }, "prop"],
  ];

  test("names the class from on and lift", () => {
    const objects = admitted(cases.map(([record], i) => ({ ...record, id: `piece-${i}` }))) ?? [];
    expect(objects.map(staticClass)).toEqual(cases.map(([, name]) => name));
  });
});
