/**
 * The JSON chunk of a written GLB, read after the 12-byte header and the chunk head, and a
 * field reader for its untyped values. Both test files read the written document through it.
 */

/** The value at `key` of a parsed JSON value, or `undefined`. */
export function field(value: unknown, key: string): unknown {
  return Reflect.get(Object(value), key);
}

/** The list at `key` of a parsed JSON value, or an empty list. */
export function listAt(value: unknown, key: string): readonly unknown[] {
  const list = field(value, key);
  return Array.isArray(list) ? list : [];
}

/** The parsed JSON document of a GLB. */
export function glbDocument(glb: Uint8Array): unknown {
  const view = new DataView(glb.buffer, glb.byteOffset, glb.byteLength);
  const length = view.getUint32(12, true);
  return JSON.parse(new TextDecoder().decode(glb.subarray(20, 20 + length)));
}
