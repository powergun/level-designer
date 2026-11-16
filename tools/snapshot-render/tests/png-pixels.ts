import { inflateSync } from "node:zlib";

/** A decoded sheet: its size and three sRGB bytes per pixel. */
export interface Pixels {
  readonly width: number;
  readonly height: number;
  readonly rgb: Uint8Array;
}

/** The chunks of a PNG file by type; IDAT data is concatenated. */
function chunksOf(png: Uint8Array): Map<string, Uint8Array> {
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
  const chunks = new Map<string, Uint8Array>();
  for (let at = 8; at < png.length; ) {
    const length = view.getUint32(at);
    const type = new TextDecoder().decode(png.subarray(at + 4, at + 8));
    const data = png.subarray(at + 8, at + 8 + length);
    const before = chunks.get(type) ?? new Uint8Array(0);
    const joined = new Uint8Array(before.length + data.length);
    joined.set(before);
    joined.set(data, before.length);
    chunks.set(type, joined);
    at += 12 + length;
  }
  return chunks;
}

/**
 * Decode an 8-bit truecolour PNG whose scanlines all use filter type 0, the only form the
 * renderer writes; anything else throws.
 */
export function decodePng(png: Uint8Array): Pixels {
  const chunks = chunksOf(png);
  const header = chunks.get("IHDR") ?? new Uint8Array(13);
  const view = new DataView(header.buffer, header.byteOffset, header.byteLength);
  const width = view.getUint32(0);
  const height = view.getUint32(4);
  if (header[8] !== 8 || header[9] !== 2) throw new Error("expected 8-bit truecolour");
  const lines = inflateSync(chunks.get("IDAT") ?? new Uint8Array(0));
  const rgb = new Uint8Array(width * height * 3);
  for (let row = 0; row < height; row++) {
    const start = row * (width * 3 + 1);
    if (lines[start] !== 0) throw new Error("expected filter type 0");
    rgb.set(lines.subarray(start + 1, start + 1 + width * 3), row * width * 3);
  }
  return { width, height, rgb };
}

/** The sRGB bytes of the pixel at column x and row y. */
export function pixelAt(pixels: Pixels, x: number, y: number): readonly [number, number, number] {
  const at = (y * pixels.width + x) * 3;
  return [pixels.rgb[at] ?? -1, pixels.rgb[at + 1] ?? -1, pixels.rgb[at + 2] ?? -1];
}
