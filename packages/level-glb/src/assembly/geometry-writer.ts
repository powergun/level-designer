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

/** Components per element of each FLOAT vertex attribute type the assembly writes. */
const FLOAT_WIDTHS = { VEC2: 2, VEC3: 3, VEC4: 4 } as const;

/** A FLOAT vertex attribute type the assembly writes. */
type FloatType = keyof typeof FLOAT_WIDTHS;

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

  /** Append a vertex attribute as a FLOAT accessor of `type` with an optional extent. */
  private attribute(
    values: Float32Array,
    type: FloatType,
    extent: Pick<GltfAccessor, "min" | "max">,
  ): number {
    const bytes = new Uint8Array(values.buffer, values.byteOffset, values.byteLength);
    const bufferView = this.append(bytes, { byteLength: bytes.byteLength, target: ARRAY_BUFFER });
    const count = values.length / FLOAT_WIDTHS[type];
    this.accessors.push({ bufferView, componentType: FLOAT, count, type, ...extent });
    return this.accessors.length - 1;
  }

  /** Append a vertex attribute as a FLOAT accessor of `type`; returns its accessor index. */
  floats(values: Float32Array, type: FloatType): number {
    return this.attribute(values, type, {});
  }

  /** Append xyz positions as a FLOAT VEC3 accessor with its min and max, as glTF requires. */
  positions(values: Float32Array): number {
    return this.attribute(values, "VEC3", bounds(values));
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
