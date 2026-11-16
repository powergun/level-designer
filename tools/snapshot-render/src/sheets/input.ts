import type { Lens, Vec3 } from "../render/index.js";

/** An axis-aligned box in the level frame, metres. */
export interface Box {
  readonly min: Vec3;
  readonly max: Vec3;
}

/** A custom perspective view: the eye and the point it looks at. */
export interface CustomView {
  readonly eye: Vec3;
  readonly lookAt: Vec3;
}

/**
 * What a snapshot needs beside the GLB: the hall's markers, the lens and the body. The
 * command-line tool fills it from the prepared static level, the game values and the
 * description. Points are in the level frame, metres; spawns are feet positions.
 */
export interface SnapshotInput {
  /** The hall's interior box; it frames the orthographic tiles and places the views. */
  readonly interior: Box;
  /** The floor heights that the section tiles mark. */
  readonly floors: readonly number[];
  /** The heights above each floor that the section tiles also mark. */
  readonly clearances: readonly number[];
  readonly playerSpawn: Vec3;
  readonly minionSpawns: readonly Vec3[];
  /** One plan point per prop in description order; the plan numbers them from 1. */
  readonly props: readonly Vec3[];
  readonly lens: Lens;
  /** The eye's height above the feet. */
  readonly eyeHeight: number;
  /** The height of the figure that stands at each spawn. */
  readonly figureHeight: number;
  /** An optional extra perspective view. */
  readonly custom?: CustomView;
}

/** The PNG bytes of each sheet; `custom` is present when the input asks for a custom view. */
export interface Sheets {
  readonly plan: Uint8Array;
  readonly section: Uint8Array;
  readonly view: Uint8Array;
  readonly custom?: Uint8Array;
}
