import { formatLength } from "@level-designer/level-format";
import type { KindListing, ParamListing } from "@level-designer/prop-kit";

/** Whether a colour or a glow parameter must be given, as the listing prints it. */
function presence(required: boolean): string {
  return required ? "required" : "optional";
}

/**
 * The type, the range, form or choices, and the default of one parameter, as three fields. A
 * number's range and default print through `formatLength`: most are lengths, and the angles
 * and fractions sit on its 0.1 mm grid. A seed's range prints as whole numbers. A finish
 * path's default prints as the listing's path per material, `material=path`.
 */
function specFields(param: ParamListing): readonly string[] {
  if (param.type === "number") {
    const fallback =
      param.default === undefined ? "required" : `default ${formatLength(param.default)}`;
    return ["number", `${formatLength(param.min)} to ${formatLength(param.max)}`, fallback];
  }
  if (param.type === "color") return ["color", "#rrggbb", presence(param.required)];
  if (param.type === "material" || param.type === "choice") {
    return [param.type, param.choices.join(","), `default ${param.default}`];
  }
  if (param.type === "boolean") return ["boolean", "true,false", `default ${param.default}`];
  if (param.type === "finish") {
    const byMaterial = Object.entries(param.byMaterial);
    const paths = byMaterial.map(([material, path]) => `${material}=${path}`);
    return ["finish", "a path of finishes", `default by material ${paths.join(",")}`];
  }
  if (param.type === "seed") {
    return ["seed", `${param.min} to ${param.max}`, "default the hash of the id"];
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
