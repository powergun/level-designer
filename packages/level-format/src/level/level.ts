import type { Lighting } from "../lighting/index.js";
import type { Slab } from "../slab/index.js";

/** The schema id of the level `.json` that sec-111 consumes; a breaking change replaces it. */
export const LEVEL_SCHEMA = "level-designer-level/1";

/** One destructible prop of the level: its id and its slabs, in slab order. */
export interface LevelProp {
  readonly id: string;
  readonly slabs: readonly Slab[];
}

/**
 * The level `.json` as a typed value: the props in description order and the lighting. The
 * schema id is a fact of the text, so the value does not repeat it.
 */
export interface Level {
  readonly props: readonly LevelProp[];
  readonly lighting: Lighting;
}
