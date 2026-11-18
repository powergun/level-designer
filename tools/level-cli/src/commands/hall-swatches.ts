import { recipeAt } from "@level-designer/level-format";
import type { DrawnRecipe } from "@level-designer/level-format";
import type { BuiltLevel } from "@level-designer/level-pipeline";
import type { FinishSwatch, HallClass } from "@level-designer/snapshot-render";

/**
 * The plain grey ground a hall finish's marks are drawn over: the sheet reads no stage
 * texture, so a hall page shows the marks and not the surface's value.
 */
const HALL_GROUND = "#808080";

/**
 * The classes a hall finish draws on: the distinct `on` of its drawn layers, extended ones
 * included, in order of first appearance. The format admits only `top`, `bottom` and
 * `outside` on a hall finish, so the narrowing holds by the build's proof.
 */
function hallClasses(recipe: DrawnRecipe): readonly HallClass[] {
  const classes = new Set(recipe.layers.map((layer) => layer.on));
  return [...classes].map((face) => {
    if (face !== "top" && face !== "bottom" && face !== "outside") {
      throw new Error(`a hall finish draws on "${face}" after the build`);
    }
    return face;
  });
}

/**
 * One hall page's swatch per hall finish in use, in the order the base overrides first name
 * them: the path, its drawn recipe, the grey ground, and the interior of the prepared static
 * level with the classes the role draws on. The build has proved every path.
 */
export function hallSwatches(built: BuiltLevel): readonly FinishSwatch[] {
  const overrides = [...built.description.base.materials.values()];
  const paths = new Set(overrides.flatMap(({ finish }) => (finish === undefined ? [] : [finish])));
  return [...paths].map((path) => {
    const recipe = recipeAt(built.level.finishes, path);
    if (recipe === undefined) throw new Error(`no finish "${path}" in a built level's table`);
    return {
      label: path,
      recipe,
      tint: HALL_GROUND,
      subject: {
        kind: "hall",
        interior: built.prepared.level.metrics.interior,
        classes: hallClasses(recipe),
      },
    };
  });
}
