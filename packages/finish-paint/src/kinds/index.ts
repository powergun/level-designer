/**
 * The layer kinds as templates over the arithmetic interface: `bands`, `rectangle`, `dots`,
 * `noise`, `cells`, `disc` and `border`, each a coverage in 0 to 1 filtered over one
 * footprint, and the footprint fade. The kinds trust their parameters and a positive
 * footprint; the painter owns both.
 */
export { bands, type BandsParams } from "./bands.js";
export { border, type BorderParams } from "./border.js";
export { cells, type CellsParams } from "./cells.js";
export { disc, type DiscParams } from "./disc.js";
export { dots, type DotsParams } from "./dots.js";
export { footprintFade, saturate } from "./fade.js";
export { noise, type NoiseParams } from "./noise.js";
export { rectangle, type RectangleParams } from "./rectangle.js";
