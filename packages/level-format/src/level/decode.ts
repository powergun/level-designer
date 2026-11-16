import { readLighting } from "../lighting/index.js";
import { admitText, IdClaims } from "../shape/index.js";
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

/** The level record; the slab admission runs once the shape and the ids hold. */
function readLevel(root: ShapeNode, problems: FormatProblem[]): Level {
  root.record(["schema", "props", "lighting"]);
  root.field("schema").oneOf([LEVEL_SCHEMA]);
  const ids = new IdClaims(problems);
  const level: Level = {
    props: root
      .field("props")
      .list()
      .map((node) => readProp(node, ids)),
    lighting: readLighting(root.field("lighting")),
  };
  if (problems.length === 0) {
    problems.push(...admitSlabs(level.props));
  }
  return level;
}

/** Decodes level `.json` text into a level, or every problem with its path. */
export function decodeLevel(text: string): Admission<Level> {
  return admitText(text, readLevel);
}
