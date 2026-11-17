/**
 * A value that breaks its expected shape, at its path. The readers of this unit throw it and
 * their entry points catch it, so each admission returns the first miss as a value.
 */
export class ShapeMiss extends Error {
  override readonly name = "ShapeMiss";

  /** The miss at `path`, with a message that starts with the path. */
  constructor(
    readonly path: string,
    expected: string,
  ) {
    super(`${path}: expected ${expected}`);
  }
}
