import { describeValue, itemPath, keyPath } from "../shape/index.js";
import type { FormatProblem } from "../shape/index.js";
import type { Layer } from "../layer/index.js";
import type { FinishTable, Recipe } from "./finish.js";

/** The faces a hall surface has: one that faces up, one that faces down, one sideways. */
const HALL_FACES: ReadonlySet<Layer["on"]> = new Set(["top", "bottom", "outside"]);

/** A `shape` problem at `path` for a value a hall finish leaves out. */
function leftOut(path: string, requirement: string, found: unknown): FormatProblem {
  return {
    rule: "shape",
    path,
    message: `${path}: expected ${requirement}, got ${describeValue(found)}`,
  };
}

/** The leave-outs of one role's own record, at its table path, judged for the hall path. */
function roleProblems(rolePath: string, recipe: Recipe, hall: string): FormatProblem[] {
  const named = `in the hall finish ${JSON.stringify(hall)}`;
  const problems: FormatProblem[] =
    recipe.body === undefined
      ? []
      : [leftOut(keyPath(rolePath, "body"), `no body ${named}`, recipe.body)];
  recipe.layers.forEach((layer, i) => {
    const layerPath = itemPath(keyPath(rolePath, "layers"), i);
    if (!HALL_FACES.has(layer.on)) {
      problems.push(leftOut(keyPath(layerPath, "on"), `top, bottom or outside ${named}`, layer.on));
    }
    if (layer.effects.lit !== undefined) {
      problems.push(
        leftOut(keyPath(layerPath, "lit"), `no lit effect ${named}`, layer.effects.lit),
      );
    }
  });
  return problems;
}

/**
 * What the hall finish at `path`, a path the table holds, states although a hall surface
 * cannot serve it: a body, a `lit` effect, or a layer on a face other than `top`, `bottom`
 * and `outside`. A fault the role gains through `extends` stands at the extended role's
 * value, where the author changes it.
 */
export function hallProblems(table: FinishTable, path: string): FormatProblem[] {
  const [finishName = "", roleName = ""] = path.split("/");
  const roles = table.get(finishName)?.roles;
  const recipe = roles?.get(roleName);
  if (roles === undefined || recipe === undefined) {
    return [];
  }
  const rolesPath = keyPath(keyPath("finishes", finishName), "roles");
  const roleAt = (name: string): string => keyPath(rolesPath, name);
  const base = recipe.extends === undefined ? undefined : roles.get(recipe.extends);
  const extended =
    base === undefined || recipe.extends === undefined
      ? []
      : roleProblems(roleAt(recipe.extends), base, path);
  return [...extended, ...roleProblems(roleAt(roleName), recipe, path)];
}
