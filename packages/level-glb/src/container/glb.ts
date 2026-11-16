import type { GltfDocument } from "./gltf.js";

/** A GLB split into its JSON document and its binary chunk. */
export interface GlbContainer {
  readonly document: GltfDocument;
  readonly bin: Uint8Array;
}

/** The GLB header magic, the ASCII bytes `glTF` read as a little-endian 32-bit word. */
const GLB_MAGIC = 0x46546c67;
/** The chunk type `JSON`. */
const JSON_CHUNK = 0x4e4f534a;
/** The chunk type `BIN\0`. */
const BIN_CHUNK = 0x004e4942;
/** The size of the GLB header. */
const HEADER = 12;
/** The size of one chunk header. */
const CHUNK_HEADER = 8;

/** Reject a container with the reason. */
function reject(reason: string): never {
  throw new Error(`GLB rejected: expected ${reason}`);
}

/** One chunk of the container: its type and body. */
interface Chunk {
  readonly type: number;
  readonly body: Uint8Array;
}

/** Split the container body into its chunks. */
function chunksOf(bytes: Uint8Array, view: DataView): readonly Chunk[] {
  const chunks: Chunk[] = [];
  let offset = HEADER;
  while (offset + CHUNK_HEADER <= bytes.byteLength) {
    const length = view.getUint32(offset, true);
    const start = offset + CHUNK_HEADER;
    if (start + length > bytes.byteLength) reject("chunks inside the file");
    chunks.push({
      type: view.getUint32(offset + 4, true),
      body: bytes.subarray(start, start + length),
    });
    offset = start + length;
  }
  return chunks;
}

/** Check the header: the magic, version 2 and the file's own length. */
function checkHeader(bytes: Uint8Array, view: DataView): void {
  const magic = bytes.byteLength >= HEADER && view.getUint32(0, true) === GLB_MAGIC;
  if (!magic || view.getUint32(4, true) !== 2 || view.getUint32(8, true) !== bytes.byteLength) {
    reject("a glTF 2.0 binary container of its own length");
  }
}

/** Parse the JSON chunk: asset version 2.0 and exactly one buffer. */
function parseDocument(body: Uint8Array): GltfDocument {
  const document: GltfDocument = JSON.parse(new TextDecoder().decode(body));
  if (document.asset?.version !== "2.0") reject("asset version 2.0");
  if (document.buffers?.length !== 1) reject("exactly one buffer");
  return document;
}

/**
 * Read a glTF 2.0 binary of its own length with one JSON chunk, then one BIN chunk, and one
 * buffer. The base stage is persisted input, so the container is checked here once; the
 * document's records are trusted afterwards.
 */
export function readGlb(bytes: Uint8Array): GlbContainer {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  checkHeader(bytes, view);
  const [json, bin, ...rest] = chunksOf(bytes, view);
  if (json?.type !== JSON_CHUNK || bin?.type !== BIN_CHUNK || rest.length > 0) {
    reject("one JSON chunk followed by one BIN chunk");
  }
  return { document: parseDocument(json.body), bin: bin.body };
}

/** The length rounded up to the 4-byte chunk alignment. */
export function aligned(length: number): number {
  return Math.ceil(length / 4) * 4;
}

/** Write one chunk header and its body, padded with the given byte. */
function writeChunk(out: Uint8Array, at: number, chunk: Chunk, pad: number): number {
  const length = aligned(chunk.body.byteLength);
  const view = new DataView(out.buffer, out.byteOffset, out.byteLength);
  view.setUint32(at, length, true);
  view.setUint32(at + 4, chunk.type, true);
  out.fill(pad, at + CHUNK_HEADER, at + CHUNK_HEADER + length);
  out.set(chunk.body, at + CHUNK_HEADER);
  return at + CHUNK_HEADER + length;
}

/** Write a GLB: the header, the JSON chunk padded with spaces, the BIN chunk padded with zeros. */
export function writeGlb(document: GltfDocument, bin: Uint8Array): Uint8Array {
  const json = new TextEncoder().encode(JSON.stringify(document));
  const total = HEADER + 2 * CHUNK_HEADER + aligned(json.byteLength) + aligned(bin.byteLength);
  const out = new Uint8Array(total);
  const view = new DataView(out.buffer);
  view.setUint32(0, GLB_MAGIC, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, total, true);
  const next = writeChunk(out, HEADER, { type: JSON_CHUNK, body: json }, 0x20);
  writeChunk(out, next, { type: BIN_CHUNK, body: bin }, 0);
  return out;
}
