/** The key codes that move the camera or the capsule. */
export const MOVE_KEYS = {
  forward: "KeyW",
  back: "KeyS",
  left: "KeyA",
  right: "KeyD",
  up: "KeyE",
  down: "KeyQ",
} as const;

/** The sprint keys. */
const SPRINT_KEYS = ["ShiftLeft", "ShiftRight"] as const;

/** The held movement keys, by physical key code. */
export class KeyState {
  private readonly held = new Set<string>();

  /** A key went down. */
  press(code: string): void {
    this.held.add(code);
  }

  /** A key went up. */
  release(code: string): void {
    this.held.delete(code);
  }

  /** Forget every held key, as when the window loses focus or the comment box opens. */
  clear(): void {
    this.held.clear();
  }

  /** -1, 0 or 1 from a pair of opposite keys. */
  axis(positive: string, negative: string): number {
    return (this.held.has(positive) ? 1 : 0) - (this.held.has(negative) ? 1 : 0);
  }

  /** Whether a sprint key is held. */
  get sprint(): boolean {
    return SPRINT_KEYS.some((code) => this.held.has(code));
  }
}
