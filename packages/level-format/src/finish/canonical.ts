import type { Written } from "../layer/index.js";
import { layerRecord } from "../layer/index.js";
import type { FinishTable, Recipe } from "./finish.js";

/** A recipe in its canonical key order. */
function recipeRecord(recipe: Recipe): Written {
  const { body, layers } = recipe;
  return {
    ...(body === undefined
      ? {}
      : {
          body: {
            shade: body.shade,
            metalness: body.metalness,
            roughness: body.roughness,
            lit: body.lit,
          },
        }),
    layers: layers.map(layerRecord),
    ...(recipe.extends === undefined ? {} : { extends: recipe.extends }),
  };
}

/** The finish table as the level `.json` writes it: records in their canonical key order. */
export function canonicalFinishes(table: FinishTable): Written {
  const finishes = [...table].map(([name, finish]) => {
    const roles = [...finish.roles].map(([role, recipe]) => [role, recipeRecord(recipe)]);
    const cut = { family: finish.cut.family, color: finish.cut.color };
    return [name, { cut, light: finish.light, roles: Object.fromEntries(roles) }];
  });
  return Object.fromEntries(finishes);
}
