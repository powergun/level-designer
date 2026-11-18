import type { Face, Finish, Layer, MaterialOverride, Recipe } from "@level-designer/level-format";
import type { BuiltLevel } from "@level-designer/level-pipeline";
import type { HallClass } from "@level-designer/snapshot-render";
import { withFinishes } from "./finish-level.js";

/** A noise layer of the fixture on one face. */
function layerOn(on: Face): Layer {
  const metre = { metres: 1 };
  return {
    pattern: { kind: "noise", wavelength: [metre, metre] },
    on,
    wear: false,
    amount: 1,
    effects: { shade: 0.5 },
  };
}

/**
 * The fixture's hall finish: `floor` names `top` twice and `outside` once, `wall` extends
 * `floor` and adds `bottom`, and `bare` has no layer.
 */
const HALL: Finish = {
  cut: { family: "concrete", color: "#808080" },
  light: "#ffffff",
  roles: new Map<string, Recipe>([
    ["floor", { layers: [layerOn("top"), layerOn("top"), layerOn("outside")] }],
    ["wall", { layers: [layerOn("bottom")], extends: "floor" }],
    ["bare", { layers: [] }],
  ]),
};

/** The classes each hall page holds, in the order the overrides first name the paths. */
export const HALL_PAGES: ReadonlyMap<string, readonly HallClass[]> = new Map([
  ["hall/floor", ["top", "outside"]],
  ["hall/wall", ["top", "outside", "bottom"]],
  ["hall/bare", []],
  ["steel/plate", []],
]);

/**
 * `built` with the slab fixture and base overrides: two name `hall/floor`, one names no
 * finish, and one names `steel/plate`, a path a slab also names.
 */
export function withHallFinishes(built: BuiltLevel): BuiltLevel {
  const slabs = withFinishes(built);
  const materials = new Map<string, MaterialOverride>([
    ["Floor", { finish: "hall/floor" }],
    ["Plain", { metalness: 0.2 }],
    ["Wall", { finish: "hall/wall" }],
    ["Slab", { finish: "hall/floor" }],
    ["Bare", { finish: "hall/bare" }],
    ["Shared", { finish: "steel/plate" }],
  ]);
  const finishes = new Map([...slabs.level.finishes, ["hall", HALL]]);
  return {
    ...slabs,
    description: { ...slabs.description, base: { ...slabs.description.base, materials } },
    level: { ...slabs.level, finishes },
  };
}
