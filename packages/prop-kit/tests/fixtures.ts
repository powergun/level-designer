import { expect } from "bun:test";
import type { Finish, FinishTable, Prop, Recipe } from "@level-designer/level-format";
import { expandProp } from "@level-designer/prop-kit";
import type { PropProblem, PropSlab } from "@level-designer/prop-kit";

/** A prop's parameters as a test writes them. */
export type Params = Readonly<Record<string, unknown>>;

/** Where a test stands a prop: plan position, yaw in degrees and floor height. */
export interface TestSite {
  readonly at: readonly [number, number];
  readonly yaw: number;
  readonly floor: number;
}

/** The prop frame itself: origin at the level origin, no yaw, floor at 0. */
export const ORIGIN: TestSite = { at: [0, 0], yaw: 0, floor: 0 };

/** An off-grid site at an odd yaw, where placement and rounding can push joints together. */
export const ODD_SITE: TestSite = { at: [-4.01254, 12.49996], yaw: 37.3, floor: 0.32415 };

/** The glow names of the test description. */
const GLOWS: ReadonlySet<string> = new Set(["cyan", "amber"]);

/**
 * Every finish path the kit names, as "What the kit names" of
 * @docs/researches/2026-11-17-dark-factory-look-dev/finish-format.md lists them.
 */
export const KIT_PATHS: readonly string[] = [
  "bed/deck",
  "housing/skirt",
  "housing/top",
  "housing/machine",
  "housing/machine-plate",
  "housing/cabinet",
  "housing/pedestal",
  "housing/hoist",
  "cast-concrete/wall",
  "cast-concrete/top",
  "cast-concrete/panel",
  "casting/shoulder",
  "casting/upper-arm",
  "casting/forearm",
  "casting/head",
  "corrugated/side",
  "corrugated/roof",
  "corrugated/end",
  "corrugated/door",
  "timber/crate",
  "timber/crate-stencil",
  "timber/lid",
  "timber/stack",
  "steel-stock/stack",
  "block/wall",
  "beam/girder",
  "beam/runway",
  "beam/flange",
  "beam/truck",
  "beam/hook",
  "beam/plinth",
  "beam/mast",
  "beam/mast-front",
  "beam/boom",
  "beam/tie",
  "luminaire/strip",
  "luminaire/band",
];

/** A plain recipe: the format's default body and no layer. */
const PLAIN: Recipe = { layers: [] };

/** A finish table that holds exactly the given `finish/role` paths, each a plain recipe. */
export function tableOf(paths: readonly string[]): FinishTable {
  const roles = new Map<string, Map<string, Recipe>>();
  for (const path of paths) {
    const [finish = "", role = ""] = path.split("/");
    const finishRoles = roles.get(finish) ?? new Map<string, Recipe>();
    finishRoles.set(role, PLAIN);
    roles.set(finish, finishRoles);
  }
  const table = new Map<string, Finish>();
  for (const [finish, finishRoles] of roles) {
    table.set(finish, {
      cut: { family: "metal", color: "#808080" },
      light: "#ffffff",
      roles: finishRoles,
    });
  }
  return table;
}

/** The test description's table: every path the kit names. */
const TABLE: FinishTable = tableOf(KIT_PATHS);

/** A prop of the given kind and parameters on the site, with the given id. */
export function propOf(kind: string, params: Params, site: TestSite = ORIGIN, id = "p"): Prop {
  return { id, kind, at: site.at, yaw: site.yaw, params: new Map(Object.entries(params)) };
}

/** The slabs of a prop that must expand on the floor height `floor`. */
export function expandedProp(prop: Prop, floor: number): PropSlab[] {
  const expansion = expandProp(prop, "props[0]", floor, { glows: GLOWS, finishes: TABLE });
  if (!expansion.ok) {
    throw new Error(`expected ${prop.kind} to expand: ${JSON.stringify(expansion.problems)}`);
  }
  return [...expansion.slabs];
}

/** The slabs of a prop that must expand. */
export function expanded(kind: string, params: Params, site: TestSite = ORIGIN): PropSlab[] {
  return expandedProp(propOf(kind, params, site), site.floor);
}

/** The problems of a prop at index 3 that must be refused, with the given glow names and table. */
export function refused(
  kind: string,
  params: Params,
  glows: ReadonlySet<string> = GLOWS,
  finishes: FinishTable = TABLE,
): readonly PropProblem[] {
  const expansion = expandProp(propOf(kind, params), "props[3]", 0, { glows, finishes });
  expect(expansion.ok).toBe(false);
  return expansion.ok ? [] : expansion.problems;
}
