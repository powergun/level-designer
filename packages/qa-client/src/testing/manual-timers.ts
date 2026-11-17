import type { PageTimers } from "../surroundings/index.js";

/** One pending timeout. */
interface Timeout {
  readonly handle: number;
  readonly due: number;
  readonly callback: () => void;
}

/** The test clock's start, ms since the Unix epoch: 2026-11-17T12:00:00Z. */
const START = Date.UTC(2026, 10, 17, 12);

/** One animation frame at 60 Hz, ms. */
const FRAME_MS = 1000 / 60;

/** How many turns `settle` yields before it gives up. */
const SETTLE_TURNS = 2000;

/**
 * The manual clock and timers: time moves only when a test advances it. Timeouts run when their
 * time falls due, in due order; animation frames run when a test runs frames.
 */
export class ManualTimers implements PageTimers {
  private time = START;
  private nextHandle = 1;
  private timeouts: Timeout[] = [];
  private frameCallbacks: (() => void)[] = [];

  /** The clock, ms since the Unix epoch. */
  readonly clock: () => number = () => this.time;

  /** Schedule a timeout. */
  setTimeout(callback: () => void, ms: number): number {
    const handle = this.nextHandle++;
    this.timeouts.push({ handle, due: this.time + ms, callback });
    return handle;
  }

  /** Cancel a timeout. */
  clearTimeout(handle: number): void {
    this.timeouts = this.timeouts.filter((timeout) => timeout.handle !== handle);
  }

  /** Schedule a callback for the next animation frame. */
  requestAnimationFrame(callback: () => void): number {
    this.frameCallbacks.push(callback);
    return this.frameCallbacks.length;
  }

  /** The number of animation frames waiting. */
  get pendingFrames(): number {
    return this.frameCallbacks.length;
  }

  /** Move the clock by `ms`, running each timeout that falls due on the way. */
  advance(ms: number): void {
    const end = this.time + ms;
    for (;;) {
      const next = this.timeouts
        .filter((timeout) => timeout.due <= end)
        .toSorted((a, b) => a.due - b.due || a.handle - b.handle)[0];
      if (next === undefined) break;
      this.clearTimeout(next.handle);
      this.time = Math.max(this.time, next.due);
      next.callback();
    }
    this.time = end;
  }

  /** Run `count` animation frames, 1/60 s apart, with the timeouts that fall due between them. */
  frames(count: number): void {
    for (let frame = 0; frame < count; frame += 1) {
      this.advance(FRAME_MS);
      const callbacks = this.frameCallbacks;
      this.frameCallbacks = [];
      for (const callback of callbacks) callback();
    }
  }

  /**
   * Yield to pending promises until `condition` holds. Real asynchronous work, such as the
   * physics engine's start, finishes between turns; the manual clock does not move.
   */
  async settle(condition: () => boolean): Promise<void> {
    for (let turn = 0; turn < SETTLE_TURNS; turn += 1) {
      if (condition()) return;
      await new Promise<void>((resolve) => {
        globalThis.setTimeout(resolve, 0);
      });
    }
    throw new Error(`the condition did not hold after ${SETTLE_TURNS} turns`);
  }
}
