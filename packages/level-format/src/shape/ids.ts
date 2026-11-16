import type { ShapeNode } from "./node.js";
import type { FormatProblem } from "./problem.js";
import { shownPath } from "./render.js";

/** An id: lowercase letters, digits and hyphens, a letter first, at most 48 characters. */
const ID_PATTERN = /^[a-z][a-z0-9-]{0,47}$/;

/** The requirement text of an id. */
const ID_REQUIREMENT =
  "an id of lowercase letters, digits and hyphens that starts with a letter, at most 48 characters";

/** An id-shaped string; the placeholder is empty. */
export function readId(node: ShapeNode): string {
  return node.matching(ID_PATTERN, ID_REQUIREMENT);
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
