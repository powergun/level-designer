import type { Finish, StaticObject, Vec3 } from "@level-designer/level-format";
import type { BuiltLevel } from "@level-designer/level-pipeline";
import { withHallFinishes } from "./hall-level.js";

/** The fixture's litter finish: three roles, each with no layer. */
const LITTER: Finish = {
  cut: { family: "metal", color: "#505050" },
  light: "#ffffff",
  roles: new Map(["sheet", "paper", "tool"].map((role) => [role, { layers: [] }])),
};

/** A static object of the fixture on the floor with its finish path, size, colour and seed. */
function box(id: string, finish: string, size: Vec3, seed: number): StaticObject {
  const color = `#${seed.toString(16).padStart(2, "0").repeat(3)}`;
  return {
    id,
    at: [0, 0],
    yaw: 0,
    size,
    lift: 0,
    color,
    finish,
    number: 0,
    seed,
    wear: seed / 100,
  };
}

/**
 * The static objects of the fixture, named for the rule each one exercises: a slab's path
 * and a hall's path keep their pages; on each litter path the largest shown face wins, the
 * first keeps a tie whether its height or its length is the larger, one 0.1 mm grid step
 * wider takes the path, and the length counts where it exceeds the height.
 */
const STATICS = {
  slabPath: box("on-trim", "steel/trim", [5, 0.1, 5], 10),
  hallPath: box("on-floor", "hall/floor", [5, 0.1, 5], 11),
  sharedPath: box("on-plate", "steel/plate", [5, 0.1, 5], 12),
  sheetTall: box("sheet-tall", "litter/sheet", [1, 0.5, 0.02], 13),
  sheetTie: box("sheet-tie", "litter/sheet", [1, 0.02, 0.5], 14),
  paperFirst: box("paper-first", "litter/paper", [1, 0.02, 0.5], 15),
  paperWider: box("paper-wider", "litter/paper", [1.0001, 0.02, 0.5], 16),
  toolHigh: box("tool-high", "litter/tool", [0.5, 0.1, 0.02], 17),
  toolLong: box("tool-long", "litter/tool", [0.3, 0.02, 0.4], 18),
} as const;

/** The static object each box page stands on, in the paths' order of first use. */
export const BOX_PAGES: readonly StaticObject[] = [
  STATICS.sheetTall,
  STATICS.paperWider,
  STATICS.toolLong,
];

/**
 * `built` with the hall fixture, the litter finish and the fixture's static objects: three
 * name a path that a slab, an override or both also name, six name the litter paths.
 */
export function withStatics(built: BuiltLevel): BuiltLevel {
  const hall = withHallFinishes(built);
  const finishes = new Map([...hall.level.finishes, ["litter", LITTER]]);
  return {
    ...hall,
    description: { ...hall.description, finishes, statics: Object.values(STATICS) },
    level: { ...hall.level, finishes },
  };
}
