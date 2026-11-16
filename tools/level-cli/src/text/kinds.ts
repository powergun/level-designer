import { formatLength } from "@level-designer/level-format";
import type { KindListing, ParamListing } from "@level-designer/prop-kit";

/**
 * The type, the range, form or choices, and the default of one parameter, as three fields. Every
 * number parameter of the kinds is a length, so its range and default print as lengths.
 */
function specFields(param: ParamListing): readonly string[] {
  if (param.type === "number") {
    const fallback =
      param.default === undefined ? "required" : `default ${formatLength(param.default)}`;
    return ["number", `${formatLength(param.min)} to ${formatLength(param.max)}`, fallback];
  }
  if (param.type === "color") return ["color", "#rrggbb", "required"];
  if (param.type === "material") {
    return ["material", param.choices.join(","), `default ${param.default}`];
  }
  return ["glow", "a name of glows", param.required ? "required" : "optional"];
}

/**
 * The kind listing as lines: `kind <name>` for each kind, then one `param` line per parameter
 * with its name, type, range, form or choices, and default; fields are tab-separated.
 */
export function kindLines(kinds: readonly KindListing[]): readonly string[] {
  return kinds.flatMap((kind) => [
    `kind\t${kind.name}`,
    ...kind.params.map((param) => ["param", param.name, ...specFields(param)].join("\t")),
  ]);
}
