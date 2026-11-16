/**
 * The glTF 2.0 fields this component reads and writes. Every other key of a read document
 * travels through unchanged, because the assembly copies records instead of rebuilding them.
 */

/** A scene node; this component writes a `matrix` transform or none. */
export interface GltfNode {
  readonly name?: string;
  readonly matrix?: readonly number[];
  readonly children?: readonly number[];
  readonly mesh?: number;
  readonly extras?: Readonly<Record<string, unknown>>;
}

/** A mesh primitive: attribute accessors by semantic, indices, material and draw mode. */
export interface GltfPrimitive {
  readonly attributes: Readonly<Record<string, number>>;
  readonly indices?: number;
  readonly material?: number;
  readonly mode?: number;
}

/** A mesh: a name and its primitives. */
export interface GltfMesh {
  readonly name?: string;
  readonly primitives: readonly GltfPrimitive[];
}

/** The metallic-roughness block of a material. */
export interface GltfPbr {
  readonly baseColorFactor?: readonly number[];
  readonly metallicFactor?: number;
  readonly roughnessFactor?: number;
}

/** The extensions of a material; the emissive strength is the one this component reads. */
interface GltfMaterialExtensions {
  readonly KHR_materials_emissive_strength?: { readonly emissiveStrength?: number };
  readonly [name: string]: unknown;
}

/** A material: its look factors, sidedness and extensions. */
export interface GltfMaterial {
  readonly name?: string;
  readonly doubleSided?: boolean;
  readonly pbrMetallicRoughness?: GltfPbr;
  readonly emissiveFactor?: readonly number[];
  readonly extensions?: GltfMaterialExtensions;
}

/** An accessor into the one buffer. */
export interface GltfAccessor {
  readonly bufferView?: number;
  readonly byteOffset?: number;
  readonly componentType: number;
  readonly count: number;
  readonly type: string;
  readonly min?: readonly number[];
  readonly max?: readonly number[];
}

/** A buffer view of the one buffer. */
export interface GltfBufferView {
  readonly buffer: number;
  readonly byteOffset?: number;
  readonly byteLength: number;
  readonly byteStride?: number;
  readonly target?: number;
}

/** A scene: its root nodes. */
interface GltfScene {
  readonly nodes?: readonly number[];
}

/** The JSON chunk of a GLB. */
export interface GltfDocument {
  readonly asset: { readonly version: string };
  readonly scene?: number;
  readonly scenes: readonly GltfScene[];
  readonly nodes: readonly GltfNode[];
  readonly meshes?: readonly GltfMesh[];
  readonly materials?: readonly GltfMaterial[];
  readonly accessors?: readonly GltfAccessor[];
  readonly bufferViews?: readonly GltfBufferView[];
  readonly buffers: readonly { readonly byteLength: number }[];
  readonly images?: readonly unknown[];
  readonly extensionsUsed?: readonly string[];
  readonly extensionsRequired?: readonly string[];
}

/** The emissive strength extension, the one extension a written file may use. */
export const EMISSIVE_STRENGTH = "KHR_materials_emissive_strength";
