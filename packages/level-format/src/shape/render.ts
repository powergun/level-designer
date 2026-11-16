/** The longest untrusted text that a found value shows before it is cut off; paths are never cut. */
const SHOWN_TEXT = 40;

/** A key that a path shows after a dot; any other key is shown quoted in brackets. */
const PLAIN_KEY = /^[A-Za-z_][A-Za-z0-9_-]*$/;

/** The most array items a message lists inline; a longer array is shown by its length. */
const SHOWN_ITEMS = 4;

/** Untrusted text as a quoted, bounded string literal. */
export function quote(text: string): string {
  const bounded = text.length > SHOWN_TEXT ? `${text.slice(0, SHOWN_TEXT)}...` : text;
  return JSON.stringify(bounded);
}

/** The path of `key` inside the value at `path`, with the full key; the root's path is empty. */
export function keyPath(path: string, key: string): string {
  if (PLAIN_KEY.test(key)) {
    return path === "" ? key : `${path}.${key}`;
  }
  return `${path}[${JSON.stringify(key)}]`;
}

/** The path of `name` inside a map of free-text names at `path`: always quoted in brackets. */
export function entryPath(path: string, name: string): string {
  return `${path}[${JSON.stringify(name)}]`;
}

/** The path of item `index` inside the list at `path`. */
export function itemPath(path: string, index: number): string {
  return `${path}[${index}]`;
}

/** The path as a message shows it: the root is `$`. */
export function shownPath(path: string): string {
  return path === "" ? "$" : path;
}

/** A JSON value as a message's "got" part, bounded in length. */
export function describeValue(value: unknown): string {
  if (value === undefined) {
    return "nothing";
  }
  if (typeof value === "string") {
    return quote(value);
  }
  if (Array.isArray(value)) {
    const inline = value.length <= SHOWN_ITEMS && value.every((item) => typeof item === "number");
    return inline ? `[${value.join(", ")}]` : `an array of ${value.length} items`;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return value === null ? "null" : "an object";
}
