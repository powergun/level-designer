import type { Body, DrawnRecipe, Finish, FinishTable } from "./finish.js";

/** The body of a recipe that states none and extends no role that states one. */
export const DEFAULT_BODY: Body = { shade: 1, metalness: 0, roughness: 0.6, lit: 0 };

/** The finish that a `finish/role` path names, or `undefined` for another form. */
function finishOf(table: FinishTable, path: string): Finish | undefined {
  const parts = path.split("/");
  return parts.length === 2 ? table.get(parts[0] ?? "") : undefined;
}

/**
 * The drawn recipe of the finish path `finish/role`, or `undefined` when the table lacks it.
 * An extending recipe draws the extended role's layers first and takes its body unless it
 * states one; a recipe without a body takes the format's default body. The finish's
 * `light` rides along, so a caller reads every fact of drawing a role from one reading.
 */
export function recipeAt(table: FinishTable, path: string): DrawnRecipe | undefined {
  const finish = finishOf(table, path);
  const recipe = finish?.roles.get(path.slice(path.indexOf("/") + 1));
  if (finish === undefined || recipe === undefined) {
    return undefined;
  }
  const base = recipe.extends === undefined ? undefined : finish.roles.get(recipe.extends);
  return {
    body: recipe.body ?? base?.body ?? DEFAULT_BODY,
    layers: [...(base?.layers ?? []), ...recipe.layers],
    light: finish.light,
  };
}
