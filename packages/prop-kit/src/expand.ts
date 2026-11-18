import { MAX_SEED, recipeAt, seedOfId } from "@level-designer/level-format";
import type { FinishTable, Prop, Slab } from "@level-designer/level-format";
import { missingFinish, unknownKind } from "./admit/index.js";
import type { PropProblem } from "./admit/index.js";
import { placeSlab, splitRole } from "./frame/index.js";
import type { Role, Site, SlabPaint } from "./frame/index.js";
import { KINDS } from "./kinds/index.js";

/**
 * One expanded slab in the level frame, unrounded, with its four finish keys and, on every slab
 * of a prop with a glow, that glow's name.
 */
export interface PropSlab {
  readonly slab: Slab;
  readonly glow?: string;
}

/** The outcome of expanding a prop: its slabs in slab order, or its `kind`, `param` or `finish` problems. */
export type Expansion =
  | { readonly ok: true; readonly slabs: readonly PropSlab[] }
  | { readonly ok: false; readonly problems: readonly PropProblem[] };

/** What the description gives every expansion: its glow names and its finish table. */
export interface PropContext {
  readonly glows: ReadonlySet<string>;
  readonly finishes: FinishTable;
}

/** A slab's number until the kinds take number parameters. */
const NUMBER = 0;

/**
 * The step between the seeds of consecutive slabs of one prop. It is odd, so the 4,096 slab
 * indices map one to one onto the seeds, and about 0.618 of 4,096, so neighbours lie far apart.
 */
const SEED_STRIDE = 2531;

/** The seed of slab `index` of a prop whose seed is `seed`: distinct for every slab of the prop. */
function slabSeed(seed: number, index: number): number {
  return (seed + index * SEED_STRIDE) % (MAX_SEED + 1);
}

/** The finish paths the roles name that the table lacks, each once, in order of first use. */
function missingPaths(roles: readonly Role[], finishes: FinishTable): string[] {
  const named = new Set(roles.map((role) => role.finish));
  return [...named].filter((path) => recipeAt(finishes, path) === undefined);
}

/**
 * Expands the prop at `path`, such as `props[3]`, into its unrounded slabs in the level frame:
 * its kind's roles split to the slab caps, placed on the floor height `floor` under `at` and
 * turned by `yaw`. Each slab carries its role's finish path, number 0, the prop's wear and a
 * seed from the prop's seed and its index. A path the table lacks yields `finish`.
 */
export function expandProp(
  prop: Prop,
  path: string,
  floor: number,
  context: PropContext,
): Expansion {
  const kind = KINDS.find((candidate) => candidate.name === prop.kind);
  if (kind === undefined) {
    const names = KINDS.map((candidate) => candidate.name);
    return { ok: false, problems: [unknownKind(path, prop.kind, names)] };
  }
  const shaping = kind.shapeOf(prop.params, { path, glows: context.glows });
  if (!shaping.ok) {
    return shaping;
  }
  const missing = missingPaths(shaping.roles, context.finishes);
  if (missing.length > 0) {
    return { ok: false, problems: missing.map((f) => missingFinish(path, kind.name, f)) };
  }
  const seed = shaping.seed ?? seedOfId(prop.id);
  const paint: SlabPaint = { number: NUMBER, seed, wear: shaping.wear };
  const site: Site = { at: prop.at, yaw: prop.yaw, floor };
  const glow = shaping.glow;
  const slabs = shaping.roles
    .flatMap((role) => splitRole(role, paint))
    .map((slab, index) => {
      const placed: Slab = { ...placeSlab(slab, site), seed: slabSeed(seed, index) };
      return glow === undefined ? { slab: placed } : { slab: placed, glow };
    });
  return { ok: true, slabs };
}
