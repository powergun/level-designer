import type { BuiltLevel } from "@level-designer/level-pipeline";
import type { Finish, FinishTable, Slab, Vec3 } from "@level-designer/level-format";

/** A finish of the fixture with its light and the roles it names, each with no layer. */
function finish(light: string, roles: readonly string[]): Finish {
  return {
    cut: { family: "metal", color: "#404040" },
    light,
    roles: new Map(roles.map((role) => [role, { layers: [] }])),
  };
}

/** The fixture's finish table: `steel` with two roles and `timber` with one. */
const TABLE: FinishTable = new Map([
  ["steel", finish("#ffcc66", ["plate", "trim"])],
  ["timber", finish("#ffffff", ["crate"])],
]);

/** A slab of the fixture at the origin with its finish path, size, colour and seed. */
function slab(path: string, size: Vec3, color: string, seed: number): Slab {
  return {
    size,
    material: "metal",
    color,
    position: [0, 0, 0],
    rotation: [0, 0, 0, 1],
    finish: path,
    number: 0,
    seed,
    wear: seed / 10,
  };
}

/**
 * The slabs of the fixture's two props, named for the rule each one exercises: on each finish
 * path the largest outside face wins, the first slab keeps a tie, and one 0.1 mm grid step
 * wider is enough to take it.
 */
const SLABS = {
  plateFirst: slab("steel/plate", [3, 2, 0.05], "#111111", 1),
  crateSmall: slab("timber/crate", [1, 1, 0.5], "#222222", 2),
  plateTie: slab("steel/plate", [2, 3, 0.05], "#333333", 3),
  trimThick: slab("steel/trim", [0.5, 0.5, 2], "#444444", 4),
  trimThin: slab("steel/trim", [1, 0.5, 0.01], "#555555", 5),
  crateWider: slab("timber/crate", [1.0001, 1, 0.05], "#666666", 6),
} as const;

/** The slab each finish path's page stands on, in the paths' order of first use. */
export const LARGEST: readonly Slab[] = [SLABS.plateFirst, SLABS.crateWider, SLABS.trimThin];

/** `built` with the fixture's finish table and two props of the fixture's slabs. */
export function withFinishes(built: BuiltLevel): BuiltLevel {
  const props = [
    { id: "front", slabs: [SLABS.plateFirst, SLABS.crateSmall, SLABS.plateTie] },
    { id: "back", slabs: [SLABS.trimThick, SLABS.trimThin, SLABS.crateWider] },
  ];
  return { ...built, level: { ...built.level, finishes: TABLE, props } };
}
