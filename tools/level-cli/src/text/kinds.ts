import { formatLength } from "@level-designer/level-format";
import type { KindListing, ParamListing } from "@level-designer/prop-kit";

/** Whether a colour or a glow parameter must be given, as the listing prints it. */
function presence(required: boolean): string {
  return required ? "required" : "optional";
}

/**
 * The type, the range, form or choices, and the default of one parameter, as three fields. A
 * number's range and default print through `formatLength`: most are lengths, and the angles and
 * fractions among them sit on its 0.1 mm grid, so they print unchanged.
 */
function specFields(param: ParamListing): readonly string[] {
  if (param.type === "number") {
    const fallback =
      param.default === undefined ? "required" : `default ${formatLength(param.default)}`;
    return ["number", `${formatLength(param.min)} to ${formatLength(param.max)}`, fallback];
  }
  if (param.type === "color") return ["color", "#rrggbb", presence(param.required)];
  if (param.type === "material") {
    return ["material", param.choices.join(","), `default ${param.default}`];
  }
  return ["glow", "a name of glows", presence(param.required)];
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
