import type { FormatProblem } from "./problem.js";
import { describeValue, entryPath, itemPath, keyPath, shownPath } from "./render.js";

/** A JSON object as parsed text produces it. */
type JsonRecord = Readonly<Record<string, unknown>>;

/** Whether a parsed JSON value is an object other than an array. */
function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** The requirement text of a list with an item count range. */
function listRequirement(min: number, max: number): string {
  if (max !== Number.POSITIVE_INFINITY) {
    return `a list of at most ${max} items`;
  }
  return min > 0 ? `a list of at least ${min} item` : "a list";
}

/** The requirement text of a closed set of allowed values. */
function choiceRequirement(choices: readonly (string | number)[]): string {
  const shown = choices.map((choice) => (typeof choice === "string" ? `"${choice}"` : `${choice}`));
  const last = shown.pop() ?? "";
  return shown.length === 0 ? last : `one of ${shown.join(", ")} or ${last}`;
}

/**
 * One value of untrusted JSON at its path. Each read checks the value against a requirement,
 * records a `shape` problem when it fails and returns a placeholder. A node under a value that
 * already failed is dead: it reads placeholders and records nothing, so one fault yields one
 * problem. Callers discard a read value whenever a problem was recorded.
 */
export class ShapeNode {
  /** The parsed value; `undefined` when the key is missing or an enclosing value failed. */
  readonly value: unknown;
  /** The path of the value; the root's path is empty. */
  readonly path: string;
  /** The shared problem list of the admission. */
  private readonly problems: FormatProblem[];
  /** Whether this node may record problems. */
  private readonly live: boolean;

  /** A node; `live` is false under a failed value. */
  constructor(value: unknown, path: string, problems: FormatProblem[], live: boolean) {
    this.value = value;
    this.path = path;
    this.problems = problems;
    this.live = live;
  }

  /** Records that the value breaks `requirement`; `got` describes what was found. */
  fail(requirement: string, got: string = describeValue(this.value)): void {
    if (this.live) {
      const path = shownPath(this.path);
      this.problems.push({
        rule: "shape",
        path,
        message: `${path}: expected ${requirement}, got ${got}`,
      });
    }
  }

  /** A child node at `path`, live when this node is live and `present` holds. */
  private child(value: unknown, path: string, present: boolean): ShapeNode {
    return new ShapeNode(value, path, this.problems, this.live && present);
  }

  /** A finite number that `accept` admits, or NaN after recording `requirement`. */
  private numberWhere(requirement: string, accept: (value: number) => boolean): number {
    if (typeof this.value === "number" && Number.isFinite(this.value) && accept(this.value)) {
      return this.value;
    }
    this.fail(requirement);
    return Number.NaN;
  }

  /** Any finite number. */
  number(): number {
    return this.numberWhere("a number", () => true);
  }

  /** A number from `min` to `max`, both included. */
  numberIn(min: number, max: number): number {
    return this.numberWhere(`a number from ${min} to ${max}`, (n) => n >= min && n <= max);
  }

  /** A number of at least `min`. */
  numberAtLeast(min: number): number {
    return this.numberWhere(`a number of at least ${min}`, (n) => n >= min);
  }

  /** A number above zero. */
  positive(): number {
    return this.numberWhere("a positive number", (n) => n > 0);
  }

  /** Any string. */
  string(): string {
    return this.matching(/^/u, "a string");
  }

  /** A string that `pattern` matches. */
  matching(pattern: RegExp, requirement: string): string {
    if (typeof this.value === "string" && pattern.test(this.value)) {
      return this.value;
    }
    this.fail(requirement);
    return "";
  }

  /** One of a closed set of values; the first choice is the placeholder. */
  oneOf<T extends string | number>(choices: readonly [T, ...T[]]): T {
    const found = choices.find((choice) => choice === this.value);
    if (found !== undefined) {
      return found;
    }
    this.fail(choiceRequirement(choices));
    return choices[0];
  }

  /** The items of a list of exactly `length` numbers; dead nodes when the list fails. */
  tuple(length: number): ShapeNode[] {
    const items = Array.isArray(this.value) && this.value.length === length ? this.value : [];
    const present = items.length === length;
    if (!present) {
      this.fail(`a list of ${length} numbers`);
    }
    return Array.from({ length }, (_, index) =>
      this.child(items[index], itemPath(this.path, index), present),
    );
  }

  /** The items of a list of `min` to `max` items; none when the list fails. */
  list(max: number = Number.POSITIVE_INFINITY, min = 0): ShapeNode[] {
    const value = this.value;
    if (!Array.isArray(value) || value.length < min || value.length > max) {
      this.fail(listRequirement(min, max));
      return [];
    }
    return value.map((item, index) => this.child(item, itemPath(this.path, index), true));
  }

  /**
   * Checks that the value is an object with exactly the `required` keys and any of the
   * `optional` ones. It records each unknown and each missing key at the key's path.
   */
  record(required: readonly string[], optional: readonly string[] = []): void {
    const value = this.value;
    if (!isRecord(value)) {
      this.fail("an object");
      return;
    }
    const known = [...required, ...optional];
    for (const key of Object.keys(value).filter((name) => !known.includes(name))) {
      this.field(key).fail(`one of the keys ${known.join(", ")}`, "an unknown key");
    }
    for (const key of required.filter((name) => !Object.hasOwn(value, name))) {
      this.child(undefined, keyPath(this.path, key), true).fail("a value");
    }
  }

  /** The value at `key` of a checked object; dead when the key or the object is missing. */
  field(key: string): ShapeNode {
    const present = isRecord(this.value) && Object.hasOwn(this.value, key);
    return this.child(present ? this.value[key] : undefined, keyPath(this.path, key), present);
  }

  /** The value at an optional `key` of a checked object, or `undefined` when it is absent. */
  optionalField(key: string): ShapeNode | undefined {
    const present = this.live && isRecord(this.value) && Object.hasOwn(this.value, key);
    return present ? this.field(key) : undefined;
  }

  /** The entries of an object used as a map of at most `max` entries; none when it fails. */
  entries(max: number = Number.POSITIVE_INFINITY): [string, ShapeNode][] {
    if (!isRecord(this.value)) {
      this.fail("an object");
      return [];
    }
    const keys = Object.keys(this.value);
    if (keys.length > max) {
      this.fail(`an object of at most ${max} entries`, `${keys.length} entries`);
      return [];
    }
    const value = this.value;
    return keys.map((key) => [key, this.child(value[key], entryPath(this.path, key), true)]);
  }
}
