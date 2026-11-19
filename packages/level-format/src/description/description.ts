import type { FinishTable } from "../finish/index.js";
import type { Lighting } from "../lighting/index.js";
import type { LinearRgb, Vec3 } from "../shape/index.js";

/** The schema id of the committed level description; a breaking change replaces it. */
export const DESCRIPTION_SCHEMA = "level-designer-description/1";

/** An emissive colour with a strength from 0 to 100: a named glow or a base emissive. */
export interface Glow {
  readonly color: LinearRgb;
  readonly strength: number;
}

/**
 * An override of one base material; an omitted key keeps the source value. A `finish`, a
 * path of the table, makes that role the material's hall finish.
 */
export interface MaterialOverride {
  readonly tint?: LinearRgb;
  readonly metalness?: number;
  readonly roughness?: number;
  readonly emissive?: Glow;
  readonly finish?: string;
}

/** The scale and the look of the base stage, keyed by base material and mesh names. */
export interface BaseStage {
  readonly scale: number;
  readonly materials: ReadonlyMap<string, MaterialOverride>;
  readonly doubleSided: readonly string[];
}

/** A seal's box: its id, its axis-aligned corners and its `#rrggbb` colour or tint. */
interface SealBounds {
  readonly id: string;
  readonly min: Vec3;
  readonly max: Vec3;
  readonly color: string;
}

/** A seal without a finish: it draws flat, by its own metalness and roughness. */
interface FlatSeal extends SealBounds {
  readonly metalness: number;
  readonly roughness: number;
  readonly finish?: undefined;
}

/** A seal with a finish: a painted box, whose recipe's body owns metalness and roughness. */
export interface PaintedSeal extends SealBounds, BoxPaint {}

/**
 * One static, indestructible box that closes the hall. `finish` tells the two looks apart:
 * a seal without it is flat, and one with it is a painted box.
 */
export type Seal = FlatSeal | PaintedSeal;

/**
 * One prop: its stable id, its kind, the plan position `[x, z]` of its origin, its yaw in
 * degrees about +Y and its kind's parameters, which `prop-kit` admits.
 */
export interface Prop {
  readonly id: string;
  readonly kind: string;
  readonly at: readonly [number, number];
  readonly yaw: number;
  readonly params: ReadonlyMap<string, unknown>;
}

/**
 * A box's five paint keys: its finish path, a legend's number, its seed and its wear, and
 * the name of a glow for its lit parts. The admission fills every default.
 */
export interface BoxPaint {
  readonly finish: string;
  readonly number: number;
  readonly wear: number;
  readonly seed: number;
  readonly glow?: string;
}

/**
 * One static object: a box that is only drawn. `at` is the plan point `[x, z]` of its
 * centre, `yaw` its turn in degrees about +Y, `size` its `[width, height, length]`, `lift`
 * the height of its underside above the floor under `at`, and `on` the id of the prop it
 * lies on; `color` is its `#rrggbb` tint.
 */
export interface StaticObject extends BoxPaint {
  readonly id: string;
  readonly at: readonly [number, number];
  readonly yaw: number;
  readonly size: Vec3;
  readonly lift: number;
  readonly on?: string;
  readonly color: string;
}

/** The class a static object's keys name: litter on a prop, an overhead object, floor litter. */
export type StaticClass = "prop" | "overhead" | "floor";

/** The level description: every authoring decision, and nothing derived. */
export interface Description {
  readonly name: string;
  readonly base: BaseStage;
  readonly seals: readonly Seal[];
  readonly finishes: FinishTable;
  readonly glows: ReadonlyMap<string, Glow>;
  readonly props: readonly Prop[];
  readonly statics: readonly StaticObject[];
  readonly lighting: Lighting;
}
