import type {
  GltfDocument,
  GltfMaterial,
  GltfMesh,
  GltfNode,
  GltfPrimitive,
} from "../container/index.js";
import { EMISSIVE_STRENGTH, writeGlb } from "../container/index.js";
import { GeometryWriter } from "./geometry-writer.js";

/** The geometry of one appended primitive: xyz positions and normals, optional colours, indices. */
export interface PrimitiveGeometry {
  readonly positions: Float32Array;
  readonly normals: Float32Array;
  readonly colors?: Float32Array;
  readonly indices: Uint32Array;
}

/**
 * Appends to a read document: root nodes, object nodes with their mesh nodes, materials and
 * geometry. Read records keep their indices; the written file has one buffer.
 */
export class SceneBuilder {
  private readonly document: GltfDocument;
  private readonly geometry: GeometryWriter;
  private readonly nodes: GltfNode[];
  private readonly meshes: GltfMesh[];
  private readonly materials: GltfMaterial[];
  private readonly roots: number[];

  /** Start from a read document, its binary chunk and the default scene's kept roots. */
  constructor(document: GltfDocument, bin: Uint8Array, roots: readonly number[]) {
    this.document = document;
    this.geometry = new GeometryWriter(document, bin);
    this.nodes = [...document.nodes];
    this.meshes = [...(document.meshes ?? [])];
    this.materials = [...(document.materials ?? [])];
    this.roots = [...roots];
  }

  /** Append a node as the next root of the default scene; returns its index. */
  addRoot(node: GltfNode): number {
    this.nodes.push(node);
    this.roots.push(this.nodes.length - 1);
    return this.nodes.length - 1;
  }

  /** Append a material; returns its index. */
  addMaterial(material: GltfMaterial): number {
    this.materials.push(material);
    return this.materials.length - 1;
  }

  /** Append an indexed triangle primitive's accessors and return the primitive. */
  primitive(geometry: PrimitiveGeometry, material: number): GltfPrimitive {
    const attributes: Record<string, number> = {
      POSITION: this.geometry.vec3(geometry.positions, true),
      NORMAL: this.geometry.vec3(geometry.normals, false),
    };
    if (geometry.colors !== undefined)
      attributes.COLOR_0 = this.geometry.vec3(geometry.colors, false);
    return { attributes, indices: this.geometry.indices(geometry.indices), material, mode: 4 };
  }

  /**
   * Append an object root named `id` with its role extras, and one child mesh node per
   * primitive, named `<id>/<index>`. No new node carries a transform.
   */
  addObject(id: string, extras: GltfNode["extras"], primitives: readonly GltfPrimitive[]): void {
    const object = this.addRoot({ name: id, extras, children: [] });
    const children = primitives.map((primitive, index) => {
      const name = `${id}/${index}`;
      this.meshes.push({ name, primitives: [primitive] });
      this.nodes.push({ name, mesh: this.meshes.length - 1 });
      return this.nodes.length - 1;
    });
    this.nodes[object] = { name: id, extras, children };
  }

  /** The extensions the written file uses: the read ones, plus emissive strength when used. */
  private extensionsUsed(): readonly string[] | undefined {
    const read = this.document.extensionsUsed ?? [];
    const emissive = this.materials.some((m) => m.extensions?.[EMISSIVE_STRENGTH] !== undefined);
    const used =
      emissive && !read.includes(EMISSIVE_STRENGTH) ? [...read, EMISSIVE_STRENGTH] : read;
    return used.length > 0 ? used : undefined;
  }

  /** Write the GLB bytes; the default scene's roots are the kept roots, then the appended ones. */
  write(): Uint8Array {
    const sceneIndex = this.document.scene ?? 0;
    const scenes = this.document.scenes.map((scene, index) =>
      index === sceneIndex ? { ...scene, nodes: this.roots } : scene,
    );
    const bin = this.geometry.bytes();
    const [buffer] = this.document.buffers;
    const document: GltfDocument = {
      ...this.document,
      scene: sceneIndex,
      scenes,
      nodes: this.nodes,
      meshes: this.meshes,
      materials: this.materials,
      accessors: this.geometry.accessors,
      bufferViews: this.geometry.bufferViews,
      buffers: [{ ...buffer, byteLength: bin.byteLength }],
      extensionsUsed: this.extensionsUsed(),
    };
    return writeGlb(document, bin);
  }
}
