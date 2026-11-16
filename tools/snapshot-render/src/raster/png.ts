import { crc32, deflateSync } from "node:zlib";
import type { Raster } from "./raster.js";

/** The eight-byte PNG signature. */
const SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

/** One PNG chunk: its length, type, data and the CRC over type and data. */
function chunk(type: string, data: Uint8Array): Uint8Array {
  const typeBytes = new TextEncoder().encode(type);
  const out = new Uint8Array(12 + data.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  out.set(typeBytes, 4);
  out.set(data, 8);
  view.setUint32(8 + data.length, crc32(data, crc32(typeBytes)));
  return out;
}

/** The header chunk's data: the size, 8-bit depth, truecolour, no interlace. */
function header(raster: Raster): Uint8Array {
  const data = new Uint8Array(13);
  const view = new DataView(data.buffer);
  view.setUint32(0, raster.width);
  view.setUint32(4, raster.height);
  data.set([8, 2, 0, 0, 0], 8);
  return data;
}

/** The scanlines, each led by filter type 0, compressed by the runtime's zlib. */
function imageData(raster: Raster): Uint8Array {
  const stride = raster.width * 3;
  const lines = new Uint8Array((stride + 1) * raster.height);
  for (let row = 0; row < raster.height; row++) {
    lines.set(raster.rgb.subarray(row * stride, (row + 1) * stride), row * (stride + 1) + 1);
  }
  return deflateSync(lines);
}

/** Encode a raster as an 8-bit truecolour PNG; equal rasters give equal bytes. */
export function encodePng(raster: Raster): Uint8Array {
  const parts = [
    SIGNATURE,
    chunk("IHDR", header(raster)),
    chunk("IDAT", imageData(raster)),
    chunk("IEND", new Uint8Array(0)),
  ];
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let at = 0;
  for (const part of parts) {
    out.set(part, at);
    at += part.length;
  }
  return out;
}
