import { recipeAt, staticClass, type FinishTable } from "@level-designer/level-format";
import type { BuildInputs, BuildError, PreparedStatic } from "./built.js";
import { resolveDressing } from "./resolve.js";

/** The game's two JSON sheets, or the build errors that prevented placement. */
export type DressingOutcome =
  | { readonly ok: true; readonly props: string; readonly decorations: string }
  | { readonly ok: false; readonly errors: readonly BuildError[] };

/** Resolved painter inputs and cut data for exactly the finish paths present in the delivery. */
function finishesInUse(
  table: FinishTable,
  paths: readonly string[],
): Readonly<Record<string, unknown>> {
  return Object.fromEntries(
    Array.from(new Set(paths), (path) => {
      const recipe = recipeAt(table, path);
      const finish = table.get(path.slice(0, path.indexOf("/")));
      if (recipe === undefined || finish === undefined)
        throw new Error(`no admitted finish for "${path}"`);
      return [path, { ...recipe, cut: finish.cut }];
    }),
  );
}

/** Build the game's data-only sheets from the rounded slabs and resolved floor placements. */
export async function buildDressing(
  inputs: BuildInputs,
  prepared?: PreparedStatic,
): Promise<DressingOutcome> {
  const resolved = await resolveDressing(inputs, prepared);
  if (!resolved.ok) return resolved;
  const { description } = resolved;
  const props = resolved.props.map(({ id, kind, at, floor, yaw, params, slabs }) => ({
    id,
    kind,
    at,
    floor,
    yaw,
    params: Object.fromEntries(params),
    slabs,
  }));
  const objects = resolved.placements
    .filter(({ object }) => staticClass(object) === "floor")
    .map(({ box, object: { id, size, yaw, color, finish, number, seed, wear, glow } }) => ({
      id,
      center: box.center,
      size,
      yaw,
      color,
      finish,
      number,
      seed,
      wear,
      glow,
    }));
  const paths = [
    ...props.flatMap(({ slabs }) => slabs.map((slab) => slab.finish)),
    ...objects.map((object) => object.finish),
  ];
  const usedGlows = new Set([...resolved.props, ...objects].map(({ glow }) => glow));
  const glows = Object.fromEntries([...description.glows].filter(([key]) => usedGlows.has(key)));
  const propSheet = {
    schema: "factory-props/1",
    props,
    finishes: finishesInUse(description.finishes, paths),
    glows,
  };
  const decorationSheet = { schema: "factory-decorations/1", objects };
  return {
    ok: true,
    props: `${JSON.stringify(propSheet, null, 2)}\n`,
    decorations: `${JSON.stringify(decorationSheet, null, 2)}\n`,
  };
}
