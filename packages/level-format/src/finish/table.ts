import { readHexColor, readId, readIdEntries, readOptional } from "../shape/index.js";
import type { ShapeNode } from "../shape/index.js";
import { SLAB_MATERIALS } from "../slab/index.js";
import type { Body, Cut, Finish, FinishTable, Recipe } from "./finish.js";
import { readLayer } from "../layer/index.js";
import { DEFAULT_BODY } from "./recipe.js";

/** The most layers a recipe draws, the extended role's among them. */
const MAX_LAYERS = 24;

/** The most `noise` layers a recipe draws, the extended role's among them. */
const MAX_NOISE = 2;

/** A value from 0 to 1. */
function readUnit(node: ShapeNode): number {
  return node.numberIn(0, 1);
}

/** A body; an absent key takes the default body's value. */
function readBody(node: ShapeNode): Body {
  node.record([], ["shade", "metalness", "roughness", "lit"]);
  return {
    shade: readOptional(node, "shade", (n) => n.numberIn(0, 4), DEFAULT_BODY.shade),
    metalness: readOptional(node, "metalness", readUnit, DEFAULT_BODY.metalness),
    roughness: readOptional(node, "roughness", readUnit, DEFAULT_BODY.roughness),
    lit: readOptional(node, "lit", readUnit, DEFAULT_BODY.lit),
  };
}

/** One recipe as the table states it; the caps and `extends` are judged with its finish. */
function readRecipe(node: ShapeNode): Recipe {
  node.record([], ["body", "layers", "extends"]);
  const body = node.optionalField("body");
  const extended = node.optionalField("extends");
  return {
    ...(body === undefined ? {} : { body: readBody(body) }),
    layers: readOptional(node, "layers", (n) => n.list().map(readLayer), []),
    ...(extended === undefined ? {} : { extends: readId(extended) }),
  };
}

/**
 * Records a role whose `extends` names no role of its finish or a role that extends, and a
 * recipe over a cap; the caps count the extended role's layers.
 */
function judgeRole(node: ShapeNode, recipe: Recipe, roles: ReadonlyMap<string, Recipe>): void {
  const base = recipe.extends === undefined ? undefined : roles.get(recipe.extends);
  if (recipe.extends !== undefined && recipe.extends !== "") {
    if (base === undefined) {
      node.field("extends").fail("a role of the same finish");
    } else if (base.extends !== undefined) {
      node.field("extends").fail("a role that extends no other role");
    }
  }
  const extendedLayers = base !== undefined && base.extends === undefined ? base.layers : [];
  const drawn = [...extendedLayers, ...recipe.layers];
  const noise = drawn.filter((layer) => layer.pattern.kind === "noise").length;
  if (drawn.length > MAX_LAYERS) {
    node
      .field("layers")
      .fail(`at most ${MAX_LAYERS} layers with the extended role's`, `${drawn.length} layers`);
  }
  if (noise > MAX_NOISE) {
    node
      .field("layers")
      .fail(`at most ${MAX_NOISE} noise layers with the extended role's`, `${noise} noise layers`);
  }
}

/** The look of a cut face: a family and a `#rrggbb` colour. */
function readCut(node: ShapeNode): Cut {
  node.record(["family", "color"]);
  return {
    family: node.field("family").oneOf(SLAB_MATERIALS),
    color: readHexColor(node.field("color")),
  };
}

/** One finish: its cut, its light and its roles, each role judged against its siblings. */
function readFinish(node: ShapeNode): Finish {
  node.record(["cut", "light", "roles"]);
  const cut = readCut(node.field("cut"));
  const light = readHexColor(node.field("light"));
  const read = readIdEntries(node.field("roles")).map(
    ([name, role]) => [name, role, readRecipe(role)] as const,
  );
  const roles = new Map(read.map(([name, , recipe]) => [name, recipe]));
  for (const [, role, recipe] of read) {
    judgeRole(role, recipe, roles);
  }
  return { cut, light, roles };
}

/** The finish table: every finish by its name, an id. */
export function readFinishTable(node: ShapeNode): FinishTable {
  return new Map(readIdEntries(node).map(([name, finish]) => [name, readFinish(finish)]));
}
