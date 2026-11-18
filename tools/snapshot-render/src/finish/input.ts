import type { DrawnRecipe } from "@level-designer/level-format";
import type { Box } from "../sheets/index.js";

/**
 * A slab that a finish path draws on: its width, height and thickness in metres, and its
 * seed and wear as the GLB carries them. The page shows its six faces.
 */
export interface SlabSubject {
  readonly kind: "slab";
  readonly size: readonly [number, number, number];
  readonly seed: number;
  readonly wear: number;
}

/** A class of hall surface a hall finish draws on: a wall, a floor or a ceiling. */
export type HallClass = "outside" | "top" | "bottom";

/**
 * The hall that a hall finish draws on: the interior box and the classes its layers draw
 * on, in order. The page shows one tile per class.
 */
export interface HallSubject {
  readonly kind: "hall";
  readonly interior: Box;
  readonly classes: readonly HallClass[];
}

/** What a swatch is drawn on, by `kind`. */
export type SwatchSubject = SlabSubject | HallSubject;

/**
 * One finish path's page of the finish sheet: the printed label, the drawn recipe, the
 * ground colour as `#rrggbb` (a slab's colour, or the hall's plain grey), and the subject.
 */
export interface FinishSwatch {
  readonly label: string;
  readonly recipe: DrawnRecipe;
  readonly tint: string;
  readonly subject: SwatchSubject;
}
