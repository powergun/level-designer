import type { Lighting } from "../lighting/index.js";
import type { LinearRgb, Vec3 } from "../shape/index.js";
import type { SlabMaterial } from "../slab/index.js";

/** The schema id of the committed level description; a breaking change replaces it. */
export const DESCRIPTION_SCHEMA = "level-designer-description/1";

/** An emissive colour with a strength from 0 to 100: a named glow or a base emissive. */
export interface Glow {
  readonly color: LinearRgb;
  readonly strength: number;
}

/** An override of one base material; an omitted key keeps the source value. */
export interface MaterialOverride {
  readonly tint?: LinearRgb;
  readonly metalness?: number;
  readonly roughness?: number;
  readonly emissive?: Glow;
}

/** The scale and the look of the base stage, keyed by base material and mesh names. */
export interface BaseStage {
  readonly scale: number;
  readonly materials: ReadonlyMap<string, MaterialOverride>;
  readonly doubleSided: readonly string[];
}

/** One static, indestructible box that closes the hall, with its flat look. */
export interface Seal {
  readonly id: string;
  readonly min: Vec3;
  readonly max: Vec3;
  readonly color: string;
  readonly metalness: number;
  readonly roughness: number;
}

/** The surface response of one material. */
export interface Finish {
  readonly metalness: number;
  readonly roughness: number;
}

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

/** The level description: every authoring decision, and nothing derived. */
export interface Description {
  readonly name: string;
  readonly base: BaseStage;
  readonly seals: readonly Seal[];
  readonly finishes: Readonly<Record<SlabMaterial, Finish>>;
  readonly glows: ReadonlyMap<string, Glow>;
  readonly props: readonly Prop[];
  readonly lighting: Lighting;
}
