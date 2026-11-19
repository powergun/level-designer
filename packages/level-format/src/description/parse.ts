import { readLighting } from "../lighting/index.js";
import { admitText, entryPath, IdClaims, itemPath, keyPath, readId } from "../shape/index.js";
import type { Admission, FormatProblem, ShapeNode } from "../shape/index.js";
import { hallProblems, readFinishTable, recipeAt } from "../finish/index.js";
import type { FinishTable } from "../finish/index.js";
import type { BaseStage, Description, Glow } from "./description.js";
import { DESCRIPTION_SCHEMA } from "./description.js";
import { judgeGlow } from "./paint.js";
import { readGlow, readOverride, readProp } from "./records.js";
import { readSeal } from "./seals.js";
import { readStatic } from "./statics.js";

/** The description caps. */
const MAX_SEALS = 16;
const MAX_GLOWS = 8;
const MAX_PROPS = 512;
const MAX_STATICS = 256;

/** The base stage record. */
function readBase(node: ShapeNode): BaseStage {
  node.record(["scale", "materials", "doubleSided"]);
  const scale = node.field("scale").positive();
  const materials = node.field("materials").entries();
  const doubleSided = node.field("doubleSided").list();
  return {
    scale,
    materials: new Map(materials.map(([name, n]) => [name, readOverride(n)])),
    doubleSided: doubleSided.map((n) => n.string()),
  };
}

/**
 * The problems of the hall finishes that the base overrides name: a path the table lacks is
 * a `finish` problem at the override's `finish`, and a named role is judged once for what a
 * hall finish leaves out.
 */
function hallFinishProblems(base: BaseStage, finishes: FinishTable): FormatProblem[] {
  const judged = new Set<string>();
  return [...base.materials].flatMap(([name, override]) => {
    const path = override.finish;
    if (path === undefined || judged.has(path)) {
      return [];
    }
    judged.add(path);
    if (recipeAt(finishes, path) === undefined) {
      const at = keyPath(entryPath("base.materials", name), "finish");
      return [
        { rule: "finish" as const, path: at, message: `${at}: no finish ${JSON.stringify(path)}` },
      ];
    }
    return hallProblems(finishes, path);
  });
}

/** The boxes of the list `list` whose stated finish path the table lacks, each a `finish` problem. */
function boxFinishProblems(
  list: string,
  boxes: readonly { readonly finish?: string | undefined }[],
  finishes: FinishTable,
): FormatProblem[] {
  return boxes.flatMap((box, i) => {
    if (box.finish === undefined || recipeAt(finishes, box.finish) !== undefined) {
      return [];
    }
    const at = keyPath(itemPath(list, i), "finish");
    const message = `${at}: no finish ${JSON.stringify(box.finish)}`;
    return [{ rule: "finish" as const, path: at, message }];
  });
}

/** The glows, and their names unless the map itself failed its shape. */
interface Glows {
  readonly values: ReadonlyMap<string, Glow>;
  readonly names: ReadonlySet<string> | undefined;
}

/**
 * The glows map. Its names are unknown when the map is missing or fails its own shape, so
 * that one fault yields one problem and no glow name is judged against it.
 */
function readGlows(node: ShapeNode, problems: readonly FormatProblem[]): Glows {
  const before = problems.length;
  const entries = node.entries(MAX_GLOWS);
  const failed = node.value === undefined || problems.length > before;
  return {
    values: new Map(entries.map(([glow, child]) => [glow, readGlow(child)])),
    names: failed ? undefined : new Set(entries.map(([glow]) => glow)),
  };
}

/**
 * The description record, read in key order so problems follow the document; the hall
 * finishes are judged once the shape holds.
 */
function readDescription(root: ShapeNode, problems: FormatProblem[]): Description {
  root.record(
    ["schema", "name", "base", "seals", "finishes", "glows", "props", "lighting"],
    ["statics"],
  );
  root.field("schema").oneOf([DESCRIPTION_SCHEMA]);
  const ids = new IdClaims(problems);
  const name = readId(root.field("name"));
  const base = readBase(root.field("base"));
  const seals = root.field("seals").list(MAX_SEALS);
  const sealValues = seals.map((node) => readSeal(node, ids));
  const finishes = readFinishTable(root.field("finishes"));
  const glows = readGlows(root.field("glows"), problems);
  seals.forEach((node, i) => {
    if (sealValues[i]?.finish !== undefined) {
      judgeGlow(node, glows.names);
    }
  });
  const props = root.field("props").list(MAX_PROPS);
  const propValues = props.map((node) => readProp(node, ids));
  const propIds = new Set(propValues.map((prop) => prop.id));
  const statics = root.optionalField("statics")?.list(MAX_STATICS) ?? [];
  const staticValues = statics.map((node) => readStatic(node, ids, glows.names, propIds));
  const lighting = readLighting(root.field("lighting"));
  if (problems.length === 0) {
    problems.push(...hallFinishProblems(base, finishes));
    problems.push(...boxFinishProblems("seals", sealValues, finishes));
    problems.push(...boxFinishProblems("statics", staticValues, finishes));
  }
  return {
    name,
    base,
    seals: sealValues,
    finishes,
    glows: glows.values,
    props: propValues,
    statics: staticValues,
    lighting,
  };
}

/** Admits the description text once into a typed description, or every problem with its path. */
export function parseDescription(text: string): Admission<Description> {
  return admitText(text, readDescription);
}
