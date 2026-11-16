import type { GlbContainer, GltfAccessor, GltfDocument } from "../src/container/index.js";

/** Components per element by accessor type, as glTF 2.0 defines them. */
const WIDTHS: Readonly<Record<string, number>> = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };

/** Bytes per component by component type: unsigned byte, short, int and float. */
const SIZES: Readonly<Record<number, number>> = { 5121: 1, 5123: 2, 5125: 4, 5126: 4 };

/** Where an accessor's elements lie in the binary chunk, read from the document alone. */
export interface AccessorSpan {
  /** Byte offset of the first element in the binary chunk. */
  readonly start: number;
  /** Bytes from one element to the next. */
  readonly stride: number;
  /** Bytes of one component, and components per element. */
  readonly size: number;
  readonly width: number;
  /** Byte offset just past the last element. */
  readonly end: number;
  /** Byte offset just past the accessor's buffer view. */
  readonly viewEnd: number;
}

/** The span of an accessor, failing the test when its buffer view or type is unknown. */
export function spanOf(document: GltfDocument, accessor: GltfAccessor): AccessorSpan {
  const view = document.bufferViews?.[accessor.bufferView ?? -1];
  const size = SIZES[accessor.componentType];
  const width = WIDTHS[accessor.type];
  if (view === undefined || size === undefined || width === undefined) {
    throw new Error(`accessor without a known view or type: ${JSON.stringify(accessor)}`);
  }
  const viewStart = view.byteOffset ?? 0;
  const start = viewStart + (accessor.byteOffset ?? 0);
  const stride = view.byteStride ?? size * width;
  const end = accessor.count === 0 ? start : start + (accessor.count - 1) * stride + size * width;
  return { start, stride, size, width, end, viewEnd: viewStart + view.byteLength };
}

/** Every component of an accessor, read straight from the binary chunk with a DataView. */
export function accessorValues(container: GlbContainer, index: number): number[] {
  const accessor = container.document.accessors?.[index];
  if (accessor === undefined) throw new Error(`no accessor ${index}`);
  const { start, stride, size, width } = spanOf(container.document, accessor);
  const { bin } = container;
  const data = new DataView(bin.buffer, bin.byteOffset, bin.byteLength);
  const read: Readonly<Record<number, (at: number) => number>> = {
    5121: (at) => data.getUint8(at),
    5123: (at) => data.getUint16(at, true),
    5125: (at) => data.getUint32(at, true),
    5126: (at) => data.getFloat32(at, true),
  };
  const component = read[accessor.componentType] ?? (() => Number.NaN);
  const values: number[] = [];
  for (let element = 0; element < accessor.count; element++) {
    for (let k = 0; k < width; k++) values.push(component(start + element * stride + k * size));
  }
  return values;
}
