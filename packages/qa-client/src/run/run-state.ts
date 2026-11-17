import type { Display } from "../display/index.js";
import type { PageLog } from "../log/index.js";
import type { MarkFlow } from "../marks/index.js";
import type { KeyState, Motion } from "../motion/index.js";
import type { Verdict } from "../protocol/index.js";
import type { PageSurroundings, PageView, Regions } from "../surroundings/index.js";

/**
 * The drawing's state: whether the boot has handed over to the frame loop, and whether a lost
 * device, a GPU error or a throwing frame stopped the drawing for good.
 */
export interface Drawing {
  running: boolean;
  stopped: boolean;
}

/** The facts of the built level the heads-up display shows. */
export interface LevelFacts {
  readonly name: string;
  readonly description: string;
  readonly verdict: Verdict;
}

/** Everything the running page acts on once the boot has handed over. */
export interface RunState {
  readonly surroundings: PageSurroundings;
  readonly regions: Regions;
  readonly display: Display;
  readonly log: PageLog;
  readonly view: PageView;
  readonly keys: KeyState;
  readonly motion: Motion;
  readonly marks: MarkFlow;
  readonly drawing: Drawing;
  readonly level: LevelFacts;
  /** Why walk is off, or null while walk works. */
  readonly walkOff: string | null;
  /** The clear colour choice, which the display shows when it is the loud one. */
  readonly clearColor: "leak" | "game";
}
