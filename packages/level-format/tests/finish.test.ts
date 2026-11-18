import { describe, expect, test } from "bun:test";
import { recipeAt } from "@level-designer/level-format";
import type { Body, FinishTable, Layer, Length, Recipe } from "@level-designer/level-format";

/** A length of `metres` with no share of the face. */
function metres(value: number): Length {
  return { metres: value };
}

/** A rectangle layer up to `top` metres that shades by `shade`; the shade tells layers apart. */
function strip(top: number, shade: number): Layer {
  return {
    pattern: {
      kind: "rectangle",
      from: [{ metres: 0, share: { of: "w", factor: -0.5 } }, metres(0)],
      to: [{ metres: 0, share: { of: "w", factor: 0.5 } }, metres(top)],
    },
    on: "outside",
    wear: false,
    amount: 1,
    effects: { shade },
  };
}

const PLATE_BODY: Body = { shade: 0.9, metalness: 0.3, roughness: 0.5, lit: 0 };
const MACHINE_BODY: Body = { shade: 1.1, metalness: 0.2, roughness: 0.7, lit: 0 };

/** The housing finish: plain and bodied bases, and roles that extend them with and without a body. */
function housing(): FinishTable {
  const roles: [string, Recipe][] = [
    ["plain", { layers: [] }],
    ["machine", { body: MACHINE_BODY, layers: [strip(0.12, 0.6)] }],
    ["machine-plate", { body: PLATE_BODY, layers: [strip(0.06, 1.2)], extends: "machine" }],
    ["machine-kick", { layers: [strip(0.3, 0.5)], extends: "machine" }],
    ["trim", { layers: [strip(0.2, 0.7)] }],
    ["plain-trim", { layers: [strip(0.05, 1.3)], extends: "trim" }],
  ];
  const cut = { family: "metal", color: "#556070" } as const;
  return new Map([["housing", { cut, light: "#fff2d0", roles: new Map(roles) }]]);
}

describe("recipeAt", () => {
  test("a recipe without a body and without extends draws the format's default body", () => {
    expect(recipeAt(housing(), "housing/plain")).toEqual({
      body: { shade: 1, metalness: 0, roughness: 0.6, lit: 0 },
      layers: [],
      light: "#fff2d0",
    });
  });

  test("a recipe with a body and no extends draws its own body and layers", () => {
    expect(recipeAt(housing(), "housing/machine")).toEqual({
      body: MACHINE_BODY,
      layers: [strip(0.12, 0.6)],
      light: "#fff2d0",
    });
  });

  test("an extending recipe draws the extended layers first and keeps a stated body", () => {
    expect(recipeAt(housing(), "housing/machine-plate")).toEqual({
      body: PLATE_BODY,
      layers: [strip(0.12, 0.6), strip(0.06, 1.2)],
      light: "#fff2d0",
    });
  });

  test("an extending recipe without a body takes the extended role's body", () => {
    expect(recipeAt(housing(), "housing/machine-kick")).toEqual({
      body: MACHINE_BODY,
      layers: [strip(0.12, 0.6), strip(0.3, 0.5)],
      light: "#fff2d0",
    });
  });

  test("an unbodied role extending an unbodied role draws the default body", () => {
    expect(recipeAt(housing(), "housing/plain-trim")).toEqual({
      body: { shade: 1, metalness: 0, roughness: 0.6, lit: 0 },
      layers: [strip(0.2, 0.7), strip(0.05, 1.3)],
      light: "#fff2d0",
    });
  });

  test("a drawn recipe carries the light of its path's finish, also for a role that extends", () => {
    const beamRoles = new Map<string, Recipe>([
      ["girder", { layers: [strip(0.4, 0.8)] }],
      ["girder-end", { layers: [], extends: "girder" }],
    ]);
    const beam = {
      cut: { family: "metal", color: "#3a3020" },
      light: "#ffd060",
      roles: beamRoles,
    } as const;
    const table: FinishTable = new Map([...housing(), ["beam", beam]]);
    const lights = ["housing/machine-kick", "beam/girder", "beam/girder-end"].map(
      (path) => recipeAt(table, path)?.light,
    );
    expect(lights).toEqual(["#fff2d0", "#ffd060", "#ffd060"]);
  });

  test("a path the table lacks reads as no recipe", () => {
    const table = housing();
    for (const path of ["corrugated/side", "housing/roof", "housing", "housing/machine/x", ""]) {
      expect(recipeAt(table, path)).toBeUndefined();
    }
  });
});
