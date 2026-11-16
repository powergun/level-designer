import type { GltfAccessor, GltfBufferView, GltfDocument } from "../container/index.js";
import { aligned } from "../container/index.js";

/** The FLOAT component type. */
const FLOAT = 5126;
/** The UNSIGNED_INT component type. */
const UNSIGNED_INT = 5125;
/** The vertex attribute buffer target. */
const ARRAY_BUFFER = 34962;
/** The index buffer target. */
const ELEMENT_ARRAY_BUFFER = 34963;

/** Component-wise minimum and maximum of xyz triples, as glTF requires on `POSITION`. */
function bounds(values: Float32Array): Pick<GltfAccessor, "min" | "max"> {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  values.forEach((value, at) => {
    const axis = at % 3;
    min[axis] = Math.min(min[axis] ?? value, value);
    max[axis] = Math.max(max[axis] ?? value, value);
  });
  return { min, max };
}

/**
 * The one buffer of a written file: the read buffer's bytes verbatim, then appended geometry.
 * Each appended accessor gets its own buffer view, aligned to four bytes.
 */
export class GeometryWriter {
  private readonly parts: Uint8Array[];
  private byteLength: number;
  /** The read buffer views, then one per appended accessor. */
  readonly bufferViews: GltfBufferView[];
  /** The read accessors, then the appended ones. */
  readonly accessors: GltfAccessor[];

  /** Start from the read document's buffer views, accessors and binary chunk. */
  constructor(document: GltfDocument, bin: Uint8Array) {
    this.parts = [bin];
    this.byteLength = bin.byteLength;
    this.bufferViews = [...(document.bufferViews ?? [])];
    this.accessors = [...(document.accessors ?? [])];
  }

  /** Append one accessor's data; returns its accessor index. */
  private append(data: Uint8Array, view: Omit<GltfBufferView, "buffer" | "byteOffset">): number {
    const byteOffset = aligned(this.byteLength);
    this.parts.push(new Uint8Array(byteOffset - this.byteLength), data);
    this.byteLength = byteOffset + data.byteLength;
    this.bufferViews.push({ buffer: 0, byteOffset, ...view });
    return this.bufferViews.length - 1;
  }

  /** Append xyz triples as a FLOAT VEC3 accessor; `withBounds` adds its min and max. */
  vec3(values: Float32Array, withBounds: boolean): number {
    const bytes = new Uint8Array(values.buffer, values.byteOffset, values.byteLength);
    const bufferView = this.append(bytes, { byteLength: bytes.byteLength, target: ARRAY_BUFFER });
    const extent = withBounds ? bounds(values) : {};
    const count = values.length / 3;
    this.accessors.push({ bufferView, componentType: FLOAT, count, type: "VEC3", ...extent });
    return this.accessors.length - 1;
  }

  /** Append triangle indices as an UNSIGNED_INT SCALAR accessor. */
  indices(values: Uint32Array): number {
    const bytes = new Uint8Array(values.buffer, values.byteOffset, values.byteLength);
    const target = ELEMENT_ARRAY_BUFFER;
    const bufferView = this.append(bytes, { byteLength: bytes.byteLength, target });
    this.accessors.push({
      bufferView,
      componentType: UNSIGNED_INT,
      count: values.length,
      type: "SCALAR",
    });
    return this.accessors.length - 1;
  }

  /** The whole buffer: read bytes and appended geometry. */
  bytes(): Uint8Array {
    const out = new Uint8Array(this.byteLength);
    let at = 0;
    for (const part of this.parts) {
      out.set(part, at);
      at += part.byteLength;
    }
    return out;
  }
}
