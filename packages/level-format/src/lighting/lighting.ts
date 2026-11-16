import type { LinearRgb, Vec3 } from "../shape/index.js";

/** The baked interior environment: its intensity and its two colours. */
export interface Environment {
  readonly intensity: number;
  readonly ambient: LinearRgb;
  readonly overhead: LinearRgb;
}

/** The key's static PCF shadow. */
export interface Shadow {
  readonly mapSize: 1024 | 2048 | 4096;
  readonly bias: number;
  readonly normalBias: number;
  readonly radius: number;
}

/** The one directional key light; `direction` points from the hall toward the light. */
export interface KeyLight {
  readonly color: LinearRgb;
  readonly intensity: number;
  readonly direction: Vec3;
  readonly shadow: Shadow;
}

/** One unshadowed point light; intensity in candela, range in scaled metres. */
export interface PointLight {
  readonly position: Vec3;
  readonly color: LinearRgb;
  readonly intensity: number;
  readonly range: number;
}

/** The depth haze; density per metre, `glow` brightens it around bright surfaces. */
export interface Haze {
  readonly density: number;
  readonly color: LinearRgb;
  readonly glow: number;
}

/** The lighting section, the same in the description and in the level `.json`. */
export interface Lighting {
  readonly environment: Environment;
  readonly key?: KeyLight;
  readonly points: readonly PointLight[];
  readonly haze: Haze;
  readonly exposure: number;
}
