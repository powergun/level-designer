import type { Finish, PaintedSeal, Seal, Vec3 } from "@level-designer/level-format";
import type { BuiltLevel } from "@level-designer/level-pipeline";
import { withStatics } from "./box-level.js";

/** The fixture's cladding finish: one role per rule a seal page exercises, each with no layer. */
const CLADDING: Finish = {
  cut: { family: "metal", color: "#606060" },
  light: "#ffffff",
  roles: new Map(
    ["wall", "gate", "door", "deep", "square", "slim"].map((role) => [role, { layers: [] }]),
  ),
};

/**
 * A painted seal of the fixture from the origin to `max`, so each extent is exact, with its
 * finish path, colour and seed.
 */
function painted(id: string, finish: string, max: Vec3, seed: number): PaintedSeal {
  const color = `#${seed.toString(16).padStart(2, "0").repeat(3)}`;
  return { id, min: [0, 0, 0], max, color, finish, number: 0, seed, wear: seed / 100 };
}

/**
 * The seals of the fixture, named for the rule each one exercises: a slab's, a static
 * object's and a hall's path keep their pages and a flat seal names none; on each cladding
 * path the largest side wins, also over a thicker seal with a larger top and volume, a tie
 * keeps the first, one 0.1 mm grid step taller takes the path, and the longer plan extent is
 * the width, X on a tie.
 */
export const SEALS = {
  slabPath: painted("seal-trim", "steel/trim", [20, 5, 0.2], 20),
  staticPath: painted("seal-sheet", "litter/sheet", [20, 5, 0.2], 21),
  hallPath: painted("seal-floor", "hall/floor", [20, 5, 0.2], 22),
  flat: {
    id: "seal-flat",
    min: [0, 0, 0],
    max: [20, 5, 0.2],
    color: "#171717",
    metalness: 0.5,
    roughness: 0.5,
  },
  wallLongZ: painted("wall-long-z", "cladding/wall", [0.2, 3, 6], 24),
  wallShortX: painted("wall-short-x", "cladding/wall", [5, 3, 0.2], 25),
  gateLongX: painted("gate-long-x", "cladding/gate", [6, 3, 0.2], 26),
  gateTieZ: painted("gate-tie-z", "cladding/gate", [0.2, 3, 6], 27),
  doorFirst: painted("door-first", "cladding/door", [3, 2, 0.1], 28),
  doorTaller: painted("door-taller", "cladding/door", [3, 2.0001, 0.1], 29),
  deepByStep: painted("deep-by-step", "cladding/deep", [2, 1, 2.0001], 30),
  square: painted("square", "cladding/square", [2, 1, 2], 31),
  slimThick: painted("slim-thick", "cladding/slim", [4, 2, 4], 32),
  slimThin: painted("slim-thin", "cladding/slim", [5, 2, 0.1], 33),
} as const satisfies Readonly<Record<string, Seal>>;

/** One seal page of the fixture: the seal it stands on and its slab size. */
export interface SealPage {
  readonly seal: PaintedSeal;
  readonly size: Vec3;
}

/** The seal each seal page stands on, with its expected size, in the paths' first use. */
export const SEAL_PAGES: readonly SealPage[] = [
  { seal: SEALS.wallLongZ, size: [6, 3, 0.2] },
  { seal: SEALS.gateLongX, size: [6, 3, 0.2] },
  { seal: SEALS.doorTaller, size: [3, 2.0001, 0.1] },
  { seal: SEALS.deepByStep, size: [2.0001, 1, 2] },
  { seal: SEALS.square, size: [2, 1, 2] },
  { seal: SEALS.slimThin, size: [5, 2, 0.1] },
];

/**
 * `built` with the static objects' fixture, the cladding finish and the fixture's seals: three
 * name a path that a slab, a static object or an override also names, one is flat, and ten
 * name the cladding paths.
 */
export function withSeals(built: BuiltLevel): BuiltLevel {
  const statics = withStatics(built);
  const finishes = new Map([...statics.level.finishes, ["cladding", CLADDING]]);
  return {
    ...statics,
    description: { ...statics.description, finishes, seals: Object.values(SEALS) },
    level: { ...statics.level, finishes },
  };
}
