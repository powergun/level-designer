import { readFinishTable, recipeAt } from "../finish/index.js";
import type { FinishTable } from "../finish/index.js";
import { readLighting } from "../lighting/index.js";
import { admitText, IdClaims, itemPath, keyPath } from "../shape/index.js";
import type { Admission, FormatProblem, ShapeNode } from "../shape/index.js";
import { readSlab } from "../slab/index.js";
import { admitSlabs } from "./admission.js";
import { LEVEL_SCHEMA } from "./level.js";
import type { Level, LevelProp } from "./level.js";

/** One prop record: a unique id and at least one slab. */
function readProp(node: ShapeNode, ids: IdClaims): LevelProp {
  node.record(["id", "slabs"]);
  return {
    id: ids.claim(node.field("id")),
    slabs: node.field("slabs").list(Number.POSITIVE_INFINITY, 1).map(readSlab),
  };
}

/**
 * The slabs whose finish path the level's table lacks, each a `finish` problem at the
 * slab's `finish`: a renderer joins a slab's mesh to its recipe by that path.
 */
function missingFinishes(table: FinishTable, props: readonly LevelProp[]): FormatProblem[] {
  return props.flatMap((prop, i) =>
    prop.slabs.flatMap((slab, k) => {
      if (recipeAt(table, slab.finish) !== undefined) {
        return [];
      }
      const path = keyPath(itemPath(`${itemPath("props", i)}.slabs`, k), "finish");
      const message = `${path}: no finish ${JSON.stringify(slab.finish)}`;
      return [{ rule: "finish" as const, path, message }];
    }),
  );
}

/** The level record; the finish paths and the slab admission run once the shape holds. */
function readLevel(root: ShapeNode, problems: FormatProblem[]): Level {
  root.record(["schema", "finishes", "props", "lighting"]);
  root.field("schema").oneOf([LEVEL_SCHEMA]);
  const ids = new IdClaims(problems);
  const level: Level = {
    finishes: readFinishTable(root.field("finishes")),
    props: root
      .field("props")
      .list()
      .map((node) => readProp(node, ids)),
    lighting: readLighting(root.field("lighting")),
  };
  if (problems.length === 0) {
    problems.push(...missingFinishes(level.finishes, level.props), ...admitSlabs(level.props));
  }
  return level;
}

/** Decodes level `.json` text into a level, or every problem with its path. */
export function decodeLevel(text: string): Admission<Level> {
  return admitText(text, readLevel);
}
