import { describe, expect, test } from "bun:test";
import { parseDescription } from "@level-designer/level-format";
import { changed, problemsOf, rulePaths, validDescription } from "./fixtures.ts";

/** The roles of the fixture's hall finish, in a description document. */
const HALL = "finishes.hall.roles";

/** The override path of the base material `name`. */
function override(name: string): string {
  return `base.materials["${name}"]`;
}

/**
 * The fixture description with a finish `hall`: `front`, with layers on `top`, `bottom`
 * and `outside` and two `noise` layers; `skirt`, a dado; and `wall`, which extends
 * `skirt`. `Steel_Dark` names `hall/front` and `Wall_Plaster` names `hall/wall`; `Lamp`
 * names no finish.
 */
function hallDescription(): unknown {
  const front = [
    { kind: "cells", on: "top", width: 5, height: 5, gap: 0.015, detail: "medium", shade: 0.6 },
    { kind: "rectangle", on: "top", from: [-2.65, -27], to: [-2.55, 29.5], color: "#9c7618" },
    { kind: "noise", on: "top", wavelength: [3, 3], shade: 0.9 },
    { kind: "noise", on: "bottom", wavelength: [2, 2], roughness: 0.8 },
    { kind: "rectangle", from: [0, 0], to: [1, 1], paint: 0.9 },
  ];
  const skirt = [{ kind: "border", width: { ends: 0.1, top: 0.1, base: 0.6 }, shade: 0.7 }];
  const hall = {
    cut: { family: "concrete", color: "#606060" },
    light: "#ffffff",
    roles: {
      front: { layers: front },
      skirt: { layers: skirt },
      wall: { extends: "skirt", layers: [{ kind: "face", roughness: 0.9 }] },
    },
  };
  const named = changed(validDescription(), "finishes.hall", hall);
  const floor = changed(named, `${override("Steel_Dark")}.finish`, "hall/front");
  return changed(floor, override("Wall_Plaster"), { finish: "hall/wall" });
}

/** The rule and path of every problem of the hall fixture with the value at `path` set. */
function refusedAt(path: string, value: unknown): [string, string][] {
  return rulePaths(parseDescription(JSON.stringify(changed(hallDescription(), path, value))));
}

/** The faces a hall surface does not have, each refused on a hall finish's layer. */
const NOT_HALL_FACES = ["inside", "sides", "end+", "end-", "ends", "edges", "all"];

describe("a finish on a base override", () => {
  test("names a hall finish; an override without one reads as before", () => {
    const admission = parseDescription(JSON.stringify(hallDescription()));
    const materials = admission.ok ? admission.value.base.materials : new Map();
    expect(problemsOf(admission)).toEqual([]);
    expect(materials.get("Steel_Dark")?.finish).toBe("hall/front");
    expect(materials.get("Wall_Plaster")).toEqual({ finish: "hall/wall" });
    expect(materials.get("Lamp")).toEqual({ emissive: { color: [1, 0.9, 0.7], strength: 2 } });
  });

  test("a path the table lacks returns finish at the override's finish", () => {
    const path = `${override("Steel_Dark")}.finish`;
    const admission = parseDescription(
      JSON.stringify(changed(hallDescription(), path, "hall/ghost")),
    );
    expect(problemsOf(admission)).toEqual([
      { rule: "finish", path, message: `${path}: no finish "hall/ghost"` },
    ]);
  });

  test("a path that is no finish path returns shape at its path", () => {
    const path = `${override("Steel_Dark")}.finish`;
    expect(refusedAt(path, "hall")).toEqual([["shape", path]]);
  });

  test("a hall finish is judged only once the shape holds", () => {
    const faulty = changed(hallDescription(), `${HALL}.front.body`, { shade: 1 });
    const broken = changed(faulty, "props[0].yaw", "90");
    expect(rulePaths(parseDescription(JSON.stringify(broken)))).toEqual([
      ["shape", "props[0].yaw"],
    ]);
  });
});

describe("what a hall finish leaves out", () => {
  const refusals: readonly [string, string, unknown][] = [
    ["a body", `${HALL}.front.body`, { roughness: 0.5 }],
    ["a lit effect", `${HALL}.front.layers[1].lit`, 1],
    ["a body through extends", `${HALL}.skirt.body`, { shade: 1 }],
    ["a lit effect through extends", `${HALL}.skirt.layers[0].lit`, 0],
    ["a layer on sides through extends", `${HALL}.skirt.layers[0].on`, "sides"],
    ...NOT_HALL_FACES.map((face): [string, string, unknown] => [
      `a layer on ${face}`,
      `${HALL}.front.layers[0].on`,
      face,
    ]),
  ];
  for (const [name, path, value] of refusals) {
    test(`refuses ${name} with one shape problem at its path`, () => {
      expect(refusedAt(path, value)).toEqual([["shape", path]]);
    });
  }

  for (const face of ["top", "bottom", "outside"]) {
    test(`admits a layer on ${face}`, () => {
      expect(refusedAt(`${HALL}.front.layers[0].on`, face)).toEqual([]);
      expect(refusedAt(`${HALL}.skirt.layers[0].on`, face)).toEqual([]);
    });
  }

  test("a fault through extends names the hall path in its message", () => {
    const path = `${HALL}.skirt.layers[0].on`;
    const document = changed(hallDescription(), path, "ends");
    expect(problemsOf(parseDescription(JSON.stringify(document))).map((p) => p.message)).toEqual([
      `${path}: expected top, bottom or outside in the hall finish "hall/wall", got "ends"`,
    ]);
  });

  test("a role that no override names keeps its body and its lit effect", () => {
    const bodied = changed(hallDescription(), `${override("Wall_Plaster")}.finish`, "hall/front");
    const document = changed(
      changed(bodied, `${HALL}.skirt.body`, { shade: 1 }),
      `${HALL}.skirt.layers[0].lit`,
      1,
    );
    expect(rulePaths(parseDescription(JSON.stringify(document)))).toEqual([]);
  });

  test("two overrides that name one faulty path give one problem", () => {
    const twice = changed(hallDescription(), `${override("Lamp")}.finish`, "hall/front");
    const document = changed(twice, `${HALL}.front.body`, { shade: 1 });
    expect(rulePaths(parseDescription(JSON.stringify(document)))).toEqual([
      ["shape", `${HALL}.front.body`],
    ]);
  });
});
