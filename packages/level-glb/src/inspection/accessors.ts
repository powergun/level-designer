import type {
  GlbContainer,
  GltfAccessor,
  GltfBufferView,
  GltfDocument,
  GltfPrimitive,
} from "../container/index.js";

/** Byte size of each component type: unsigned byte, unsigned short, unsigned int and float. */
const COMPONENT_SIZES: ReadonlyMap<number, number> = new Map([
  [5121, 1],
  [5123, 2],
  [5125, 4],
  [5126, 4],
]);

/** Components per element of each accessor type this reader serves. */
const TYPE_WIDTHS: ReadonlyMap<string, number> = new Map([
  ["SCALAR", 1],
  ["VEC3", 3],
]);

/** The entry of a lookup table; a key outside it fails closed. */
function known<K>(table: ReadonlyMap<K, number>, key: K): number {
  const entry = table.get(key);
  if (entry === undefined) throw new Error(`GLB accessor: unsupported type ${String(key)}`);
  return entry;
}

/** Read one component at a byte offset by its component type. */
function component(view: DataView, at: number, componentType: number): number {
  if (componentType === 5126) return view.getFloat32(at, true);
  if (componentType === 5125) return view.getUint32(at, true);
  if (componentType === 5123) return view.getUint16(at, true);
  return view.getUint8(at);
}

/** Where an accessor's elements sit in the binary chunk. */
interface Layout {
  readonly start: number;
  readonly stride: number;
  readonly size: number;
  readonly count: number;
  readonly componentType: number;
}

/** The byte size of one component, and the bytes from one element to the next. */
function elementBytes(
  accessor: GltfAccessor,
  view: GltfBufferView,
): { readonly size: number; readonly stride: number } {
  const size = known(COMPONENT_SIZES, accessor.componentType);
  return { size, stride: view.byteStride ?? size * known(TYPE_WIDTHS, accessor.type) };
}

/** The layout of a dense accessor, honouring its buffer view's stride. */
function layoutOf(glb: GlbContainer, index: number): Layout {
  const accessor = glb.document.accessors?.[index];
  const view = glb.document.bufferViews?.[accessor?.bufferView ?? -1];
  if (accessor === undefined || view === undefined) {
    throw new Error(`GLB accessor ${index} has no buffer view`);
  }
  const { size, stride } = elementBytes(accessor, view);
  const start = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
  return { start, stride, size, count: accessor.count, componentType: accessor.componentType };
}

/**
 * Read the first `width` components of every element of a dense accessor. The files this
 * component reads are its own or the base stage, so their accessors are trusted.
 */
export function readAccessor(glb: GlbContainer, index: number, width: number): Float64Array {
  const { start, stride, size, count, componentType } = layoutOf(glb, index);
  const data = new DataView(glb.bin.buffer, glb.bin.byteOffset, glb.bin.byteLength);
  const out = new Float64Array(count * width);
  for (let element = 0; element < count; element++) {
    for (let at = 0; at < width; at++) {
      out[element * width + at] = component(
        data,
        start + element * stride + at * size,
        componentType,
      );
    }
  }
  return out;
}

/** The triangles of one indexed triangle-list primitive: its index count over three. */
export function trianglesOf(document: GltfDocument, primitive: GltfPrimitive): number {
  const indices = document.accessors?.[primitive.indices ?? -1];
  if (indices === undefined) throw new Error("GLB primitive has no index accessor");
  return Math.floor(indices.count / 3);
}
