/**
 * finish: the finish table, the data a renderer draws a finish from. It owns the table's
 * types, its one admission with `extends` and the caps of a recipe, its canonical text, the
 * one reading of a finish path into a drawn recipe, what a hall finish leaves out, and the
 * hash of an id into a seed.
 */
export { canonicalFinishes } from "./canonical.js";
export type { Body, Cut, DrawnRecipe, Finish, FinishTable, Recipe } from "./finish.js";
export { hallProblems } from "./hall.js";
export { recipeAt } from "./recipe.js";
export { seedOfId } from "./seed.js";
export { readFinishTable } from "./table.js";
