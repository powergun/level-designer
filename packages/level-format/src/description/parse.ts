import { readLighting } from "../lighting/index.js";
import { admitText, IdClaims, readId } from "../shape/index.js";
import type { Admission, FormatProblem, ShapeNode } from "../shape/index.js";
import { SLAB_MATERIALS } from "../slab/index.js";
import type { BaseStage, Description } from "./description.js";
import { DESCRIPTION_SCHEMA } from "./description.js";
import { readFinish, readGlow, readOverride, readProp, readSeal } from "./records.js";

/** The description caps. */
const MAX_SEALS = 16;
const MAX_GLOWS = 8;
const MAX_PROPS = 512;

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

/** The finishes record: one finish for each of the four materials. */
function readFinishes(node: ShapeNode): Description["finishes"] {
  node.record(SLAB_MATERIALS);
  return {
    wood: readFinish(node.field("wood")),
    brick: readFinish(node.field("brick")),
    concrete: readFinish(node.field("concrete")),
    metal: readFinish(node.field("metal")),
  };
}

/** The description record, read in key order so problems follow the document. */
function readDescription(root: ShapeNode, problems: FormatProblem[]): Description {
  root.record(["schema", "name", "base", "seals", "finishes", "glows", "props", "lighting"]);
  root.field("schema").oneOf([DESCRIPTION_SCHEMA]);
  const ids = new IdClaims(problems);
  const name = readId(root.field("name"));
  const base = readBase(root.field("base"));
  const seals = root.field("seals").list(MAX_SEALS);
  const sealValues = seals.map((node) => readSeal(node, ids));
  const finishes = readFinishes(root.field("finishes"));
  const glows = root.field("glows").entries(MAX_GLOWS);
  const glowValues = new Map(glows.map(([glow, node]) => [glow, readGlow(node)]));
  const props = root.field("props").list(MAX_PROPS);
  const propValues = props.map((node) => readProp(node, ids));
  const lighting = readLighting(root.field("lighting"));
  return {
    name,
    base,
    seals: sealValues,
    finishes,
    glows: glowValues,
    props: propValues,
    lighting,
  };
}

/** Admits the description text once into a typed description, or every problem with its path. */
export function parseDescription(text: string): Admission<Description> {
  return admitText(text, readDescription);
}
