import type { Layer } from "../layer/index.js";
import type { SlabMaterial } from "../slab/index.js";

/** The bare body under the layers: a factor on the tint, the surface response and emission. */
export interface Body {
  readonly shade: number;
  readonly metalness: number;
  readonly roughness: number;
  readonly lit: number;
}

/** One role's recipe as the table states it; `extends` names another role of its finish. */
export interface Recipe {
  readonly body?: Body;
  readonly layers: readonly Layer[];
  readonly extends?: string;
}

/**
 * A recipe as it draws: its body, every layer with the extended role's first, and the light
 * of its finish, the colour `"glow"` takes on a surface without a glow.
 */
export interface DrawnRecipe {
  readonly body: Body;
  readonly layers: readonly Layer[];
  readonly light: string;
}

/** The look of a cut face and of debris, as data for adoption. */
export interface Cut {
  readonly family: SlabMaterial;
  readonly color: string;
}

/** One finish: its cut, the colour `"glow"` takes without a glow, and its roles by name. */
export interface Finish {
  readonly cut: Cut;
  readonly light: string;
  readonly roles: ReadonlyMap<string, Recipe>;
}

/** The finish table: every finish by name. A finish path is `finish/role`. */
export type FinishTable = ReadonlyMap<string, Finish>;
