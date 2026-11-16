import { expect } from "bun:test";
import type { Prop } from "@level-designer/level-format";
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

/** A prop of the given kind and parameters on the site. */
function propOf(kind: string, params: Params, site: TestSite = ORIGIN): Prop {
  return { id: "p", kind, at: site.at, yaw: site.yaw, params: new Map(Object.entries(params)) };
}

/** The slabs of a prop that must expand. */
export function expanded(kind: string, params: Params, site: TestSite = ORIGIN): PropSlab[] {
  const expansion = expandProp(propOf(kind, params, site), "props[0]", site.floor, GLOWS);
  if (!expansion.ok) {
    throw new Error(`expected ${kind} to expand: ${JSON.stringify(expansion.problems)}`);
  }
  return [...expansion.slabs];
}

/** The problems of a prop at index 3 that must be refused, with the given glow names. */
export function refused(
  kind: string,
  params: Params,
  glows: ReadonlySet<string> = GLOWS,
): readonly PropProblem[] {
  const expansion = expandProp(propOf(kind, params), "props[3]", 0, glows);
  expect(expansion.ok).toBe(false);
  return expansion.ok ? [] : expansion.problems;
}
