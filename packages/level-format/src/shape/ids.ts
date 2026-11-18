import type { ShapeNode } from "./node.js";
import type { FormatProblem } from "./problem.js";
import { keyPath, quote, shownPath } from "./render.js";

/** The id rule: lowercase letters, digits and hyphens, a letter first, at most 48 characters. */
const ID_BODY = "[a-z][a-z0-9-]{0,47}";

/** An id. */
const ID_PATTERN = new RegExp(`^${ID_BODY}$`);

/** The requirement text of an id. */
const ID_REQUIREMENT =
  "an id of lowercase letters, digits and hyphens that starts with a letter, at most 48 characters";

/** A finish path: two ids joined by a slash, `finish/role`. */
const FINISH_PATH = new RegExp(`^${ID_BODY}/${ID_BODY}$`);

/** An id-shaped string; the placeholder is empty. */
export function readId(node: ShapeNode): string {
  return node.matching(ID_PATTERN, ID_REQUIREMENT);
}

/** A finish path `finish/role` of two ids; the placeholder is empty. */
export function readFinishPath(node: ShapeNode): string {
  return node.matching(FINISH_PATH, 'a finish path "<finish>/<role>" of two ids');
}

/**
 * The entries of an object whose names are ids, such as finishes and roles. A name's path
 * takes the record-key form, and a name that is no id is a problem and yields no entry.
 */
export function readIdEntries(node: ShapeNode): [string, ShapeNode][] {
  return node.entries(Number.POSITIVE_INFINITY, keyPath).filter(([name, child]) => {
    const isId = ID_PATTERN.test(name);
    if (!isId) {
      child.fail(`a name that is ${ID_REQUIREMENT}`, `the name ${quote(name)}`);
    }
    return isId;
  });
}

/**
 * The ids of one document's records, which must be unique among them. Each claim reads an
 * id and records an `id` problem when an earlier record already holds it.
 */
export class IdClaims {
  /** The path of the first record that claimed each id. */
  private readonly owners = new Map<string, string>();
  /** The shared problem list of the admission. */
  private readonly problems: FormatProblem[];

  /** Claims that report into `problems`. */
  constructor(problems: FormatProblem[]) {
    this.problems = problems;
  }

  /** Reads the id at `node` and claims it for that path. */
  claim(node: ShapeNode): string {
    const id = readId(node);
    const path = shownPath(node.path);
    const owner = this.owners.get(id);
    if (id === "") {
      return id;
    }
    if (owner === undefined) {
      this.owners.set(id, path);
    } else {
      const message = `${path}: id ${JSON.stringify(id)} is already used at ${owner}`;
      this.problems.push({ rule: "id", path, message });
    }
    return id;
  }
}
