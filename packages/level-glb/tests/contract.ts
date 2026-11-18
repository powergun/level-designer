import { expect } from "bun:test";
import type { GlbContainer, GltfDocument, GltfPrimitive } from "../src/container/index.js";
import { EMISSIVE_STRENGTH } from "../src/container/index.js";
import { accessorValues, spanOf } from "./bin-data.js";

/** The chunk type words `JSON` and `BIN\0`. */
const CHUNK_TYPES = { json: 0x4e4f534a, bin: 0x004e4942 };

/** The FLOAT component type. */
const FLOAT = 5126;

/** The unsigned index component types. */
const INDEX_TYPES = [5121, 5123, 5125];

/** An object root as the contract names it: its id, its role extras and its mesh node count. */
export interface ExpectedObject {
  readonly id: string;
  readonly extras: Readonly<Record<string, string>>;
  readonly meshes: number;
}

/**
 * Evidence: the bytes are a glTF 2.0 binary of their own length with exactly one JSON chunk
 * then one BIN chunk, and the document names one buffer that the BIN chunk holds.
 */
export function expectOneBufferContainer(glb: Uint8Array, document: GltfDocument): void {
  const view = new DataView(glb.buffer, glb.byteOffset, glb.byteLength);
  expect([view.getUint32(0, true), view.getUint32(4, true)]).toEqual([0x46546c67, 2]);
  expect(view.getUint32(8, true)).toBe(glb.byteLength);
  const jsonLength = view.getUint32(12, true);
  const binAt = 20 + jsonLength;
  const binLength = view.getUint32(binAt, true);
  expect([view.getUint32(16, true), view.getUint32(binAt + 4, true)]).toEqual([
    CHUNK_TYPES.json,
    CHUNK_TYPES.bin,
  ]);
  expect(binAt + 8 + binLength).toBe(glb.byteLength);
  expect(document.buffers).toHaveLength(1);
  const [buffer] = document.buffers;
  expect(Object.keys(buffer ?? {})).toEqual(["byteLength"]);
  expect(binLength - (buffer?.byteLength ?? 0)).toBeWithin(0, 4);
}

/** Evidence: no extension is required, and emissive strength is the only one used. */
export function expectNoRequiredExtension(document: GltfDocument): void {
  expect(document.extensionsRequired).toBeUndefined();
  for (const name of document.extensionsUsed ?? []) expect(name).toBe(EMISSIVE_STRENGTH);
}

/** Evidence: every accessor ends inside its buffer view, and every view inside the buffer. */
function expectDataInsideBuffer(container: GlbContainer): void {
  const { document, bin } = container;
  const outside = (document.accessors ?? []).filter((accessor) => {
    const span = spanOf(document, accessor);
    return span.end > span.viewEnd;
  });
  expect(outside).toEqual([]);
  const bufferLength = document.buffers[0]?.byteLength ?? Infinity;
  expect(bufferLength).toBeLessThanOrEqual(bin.byteLength);
  const views = document.bufferViews ?? [];
  expect(views.filter((view) => (view.byteOffset ?? 0) + view.byteLength > bufferLength)).toEqual(
    [],
  );
}

/**
 * Evidence: one primitive is dense: every attribute has the `POSITION` count, and every index
 * read from the binary chunk is below it.
 */
function expectDensePrimitive(container: GlbContainer, primitive: GltfPrimitive): void {
  const accessors = container.document.accessors;
  const vertices = entryAt(accessors, primitive.attributes.POSITION).count;
  const counts = Object.values(primitive.attributes).map(
    (index) => entryAt(accessors, index).count,
  );
  expect(counts).toEqual(counts.map(() => vertices));
  const indices = accessorValues(container, primitive.indices ?? -1);
  expect(indices.filter((index) => !(index < vertices))).toEqual([]);
}

/**
 * Evidence: sec-111's reader subset holds. No node carries translation, rotation or scale,
 * every accessor is dense on a buffer view of buffer 0 and ends inside it, every buffer view
 * ends inside the buffer, and every primitive's attributes and indices fit its vertices.
 */
export function expectReaderSubset(container: GlbContainer): void {
  const { document } = container;
  const trs = document.nodes.filter((node) =>
    ["translation", "rotation", "scale"].some((key) => key in node),
  );
  expect(trs).toEqual([]);
  for (const accessor of document.accessors ?? []) {
    expect(accessor.bufferView).toBeNumber();
    expect(Object.keys(accessor)).not.toContain("sparse");
  }
  for (const view of document.bufferViews ?? []) expect(view.buffer).toBe(0);
  expectDataInsideBuffer(container);
  const primitives = (document.meshes ?? []).flatMap((mesh) => mesh.primitives);
  for (const primitive of primitives) expectDensePrimitive(container, primitive);
}

/**
 * Evidence: every accessor from index `first` on, the appended ones, has a buffer view of
 * its own that starts on four bytes.
 */
export function expectOwnAlignedViews(document: GltfDocument, first: number): void {
  const views = (document.accessors ?? []).slice(first).map((accessor) => accessor.bufferView);
  expect(new Set(views).size).toBe(views.length);
  const offsets = views.map((view) => entryAt(document.bufferViews, view).byteOffset ?? 0);
  expect(offsets.filter((offset) => offset % 4 !== 0)).toEqual([]);
}

/** The entry at an index, failing the test when it is absent. */
export function entryAt<T>(list: readonly T[] | undefined, index: number | undefined): T {
  const entry = index === undefined ? undefined : list?.[index];
  if (entry === undefined) throw new Error(`no entry at ${index}`);
  return entry;
}

/** Evidence: two values have the same JSON text, the form the file stores them in. */
export function expectSameJson(actual: unknown, expected: unknown): void {
  expect(JSON.stringify(actual)).toBe(JSON.stringify(expected));
}

/** Evidence: one primitive is an indexed triangle list with a position and a held material. */
function expectIndexedMaterialTriangle(document: GltfDocument, primitive: GltfPrimitive): void {
  expect(primitive.mode ?? 4).toBe(4);
  const position = entryAt(document.accessors, primitive.attributes.POSITION);
  expect([position.componentType, position.type]).toEqual([FLOAT, "VEC3"]);
  const indices = entryAt(document.accessors, primitive.indices);
  expect(INDEX_TYPES).toContain(indices.componentType);
  expect(indices.count % 3).toBe(0);
  expect(primitive.material).toBeWithin(0, document.materials?.length ?? 0);
}

/**
 * Evidence: every primitive of the file is an indexed triangle list with a FLOAT VEC3
 * `POSITION` and a material the file holds; its unsigned indices come in threes.
 */
export function expectIndexedMaterialTriangles(document: GltfDocument): void {
  const primitives = (document.meshes ?? []).flatMap((mesh) => mesh.primitives);
  for (const primitive of primitives) expectIndexedMaterialTriangle(document, primitive);
}

/** The default scene's root node indices. */
export function rootsOf(document: GltfDocument): readonly number[] {
  return entryAt(document.scenes, document.scene ?? 0).nodes ?? [];
}

/** The primitive of each mesh node under the scene root at `rootAt`, in child order. */
export function objectPrimitives(document: GltfDocument, rootAt: number): readonly GltfPrimitive[] {
  const object = entryAt(document.nodes, rootsOf(document)[rootAt]);
  return (object.children ?? []).map((child) => {
    const mesh = entryAt(document.meshes, entryAt(document.nodes, child).mesh);
    return entryAt(mesh.primitives, 0);
  });
}

/** Evidence: one mesh node has only a name and a one-primitive mesh, so no transform. */
function meshNodeName(document: GltfDocument, index: number): string | undefined {
  const node = entryAt(document.nodes, index);
  expect(Object.keys(node).toSorted()).toEqual(["mesh", "name"]);
  expect(entryAt(document.meshes, node.mesh).primitives).toHaveLength(1);
  return node.name;
}

/**
 * Evidence: the default scene's roots after `stage` are exactly the expected objects, in
 * order. Each object root is named by its id, carries its role extras and no transform, and
 * its children are mesh nodes named `<id>/<index>` without a transform, one primitive each.
 */
export function expectObjectRoots(
  document: GltfDocument,
  objects: readonly ExpectedObject[],
): void {
  const roots = rootsOf(document).slice(1);
  expect(roots).toHaveLength(objects.length);
  objects.forEach((expected, at) => {
    const object = entryAt(document.nodes, roots[at]);
    expect(object).toEqual({
      name: expected.id,
      extras: expected.extras,
      children: expect.any(Array),
    });
    const names = (object.children ?? []).map((child) => meshNodeName(document, child));
    expect(names).toEqual(Array.from({ length: expected.meshes }, (_, k) => `${expected.id}/${k}`));
  });
}
