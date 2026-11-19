/**
 * The assembly inputs. They are this component's own types; `level-pipeline` maps a level
 * description and the slab meshes onto them.
 */

/** A point or extent in the level frame, metres. */
export type Vec3 = readonly [number, number, number];

/** A linear RGB triple from 0 to 1. */
export type Rgb = readonly [number, number, number];

/** An emissive colour with its strength from 0 to 100: a glow, or a base emissive override. */
export interface Glow {
  readonly color: Rgb;
  readonly strength: number;
}

/**
 * An override of one base material; an omitted key keeps the source value. `finish` is a hall
 * finish's path, admitted by the build, which the material carries in its `extras`.
 */
export interface MaterialOverride {
  readonly tint?: Rgb;
  readonly metalness?: number;
  readonly roughness?: number;
  readonly emissive?: Glow;
  readonly finish?: string;
}

/** The scale and the look of the base stage. */
export interface BaseLook {
  readonly scale: number;
  readonly materials: ReadonlyMap<string, MaterialOverride>;
  readonly doubleSided: readonly string[];
}

/** A seal: an axis-aligned box in the level frame with its flat look; `color` is `#rrggbb`. */
export interface SealBox {
  readonly id: string;
  readonly min: Vec3;
  readonly max: Vec3;
  readonly color: string;
  readonly metalness: number;
  readonly roughness: number;
}

/** The body of one finish path's recipe: the flat fallback's surface response and emission. */
interface SlabBody {
  readonly metalness: number;
  readonly roughness: number;
  readonly lit: number;
}

/**
 * A placed box in the level frame: its centre, its X (width), Y (height) and Z (length) axes
 * as unit vectors, and its half extents along them. `level-format`'s oriented box fits it.
 */
export interface PlacedBox {
  readonly center: Vec3;
  readonly axes: readonly [Vec3, Vec3, Vec3];
  readonly halfExtents: Vec3;
}

/** A box's paint keys as the admission fills them: its finish path, optional glow and constants. */
export interface BoxPaint {
  readonly finish: string;
  readonly glow?: string;
  readonly number: number;
  readonly seed: number;
  readonly wear: number;
}

/**
 * A static object: its id, its placed box, its `#rrggbb` tint and its paint. A litter on a prop
 * names its support: the prop's id and the index of the slab it lies on.
 */
export interface StaticBox {
  readonly id: string;
  readonly box: PlacedBox;
  readonly color: string;
  readonly paint: BoxPaint;
  readonly support?: { readonly prop: string; readonly slab: number };
}

/** The body of every finish path a slab or a static object names, by path, and the glows. */
export interface SlabLooks {
  readonly bodies: ReadonlyMap<string, SlabBody>;
  readonly glows: ReadonlyMap<string, Glow>;
}

/**
 * The intact indexed mesh of one slab in level coordinates, with its pattern data per vertex:
 * xyz positions and normals, linear RGB colours, the pattern coordinates (two), the face's
 * size (two) and the slab's number, seed, wear and face class (four); triangle indices; its
 * finish path and its optional glow.
 */
export interface SlabMesh {
  readonly positions: Float32Array;
  readonly normals: Float32Array;
  readonly colors: Float32Array;
  readonly pattern: Float32Array;
  readonly faceSize: Float32Array;
  readonly slab: Float32Array;
  readonly indices: Uint32Array;
  readonly finish: string;
  readonly glow?: string;
}

/** One prop's slab meshes in slab order. */
export interface PropMeshes {
  readonly id: string;
  readonly slabs: readonly SlabMesh[];
}

/** The `base` build error: a base name the base stage does not hold. */
export interface BaseNameError {
  readonly path: string;
  readonly message: string;
}

/** The static scene's GLB bytes, or every `base` error. */
export type StaticScene =
  | { readonly ok: true; readonly glb: Uint8Array }
  | { readonly ok: false; readonly errors: readonly BaseNameError[] };
