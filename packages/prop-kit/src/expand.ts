import type { Prop, Slab } from "@level-designer/level-format";
import { unknownKind } from "./admit/index.js";
import type { PropProblem } from "./admit/index.js";
import { placeSlab, splitRole } from "./frame/index.js";
import type { Site } from "./frame/index.js";
import { KINDS } from "./kinds/index.js";

/** One expanded slab in the level frame, unrounded, with the glow name of a glowing slab. */
export interface PropSlab {
  readonly slab: Slab;
  readonly glow?: string;
}

/** The outcome of expanding a prop: its slabs in slab order, or its `kind` or `param` problems. */
export type Expansion =
  | { readonly ok: true; readonly slabs: readonly PropSlab[] }
  | { readonly ok: false; readonly problems: readonly PropProblem[] };

/**
 * Expands the prop at `path` of the description, such as `props[3]`, into its slabs in the
 * level frame: its kind's roles split to the slab caps, each placed on the floor height `floor`
 * under `at` and turned by `yaw`. `glows` holds the description's glow names. The slabs are
 * unrounded.
 */
export function expandProp(
  prop: Prop,
  path: string,
  floor: number,
  glows: ReadonlySet<string>,
): Expansion {
  const kind = KINDS.find((candidate) => candidate.name === prop.kind);
  if (kind === undefined) {
    const names = KINDS.map((candidate) => candidate.name);
    return { ok: false, problems: [unknownKind(path, prop.kind, names)] };
  }
  const shaping = kind.shapeOf(prop.params, { path, glows });
  if (!shaping.ok) {
    return shaping;
  }
  const site: Site = { at: prop.at, yaw: prop.yaw, floor };
  const slabs = shaping.roles.flatMap((role) =>
    splitRole(role).map((slab) => {
      const placed = placeSlab(slab, site);
      return role.glow === undefined ? { slab: placed } : { slab: placed, glow: role.glow };
    }),
  );
  return { ok: true, slabs };
}
