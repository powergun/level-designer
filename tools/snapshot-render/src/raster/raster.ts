/** An sRGB byte triple. */
export type Rgb8 = readonly [number, number, number];

/** A picture of 8-bit sRGB pixels, row by row from the top left, three bytes per pixel. */
export interface Raster {
  readonly width: number;
  readonly height: number;
  readonly rgb: Uint8Array;
}

/** A raster of the given size filled with one colour. */
export function createRaster(width: number, height: number, fill: Rgb8): Raster {
  const rgb = new Uint8Array(width * height * 3);
  if (rgb.length === 0) return { width, height, rgb };
  rgb.set(fill);
  for (let filled = 3; filled < rgb.length; filled *= 2) rgb.copyWithin(filled, 0, filled);
  return { width, height, rgb };
}

/**
 * Mix a colour into the pixel at (x, y) by `alpha` from 0 to 1; a pixel outside the raster is
 * skipped, so marks may run past a tile's edge.
 */
export function paint(raster: Raster, x: number, y: number, color: Rgb8, alpha: number): void {
  if (x < 0 || y < 0 || x >= raster.width || y >= raster.height) return;
  const at = (y * raster.width + x) * 3;
  for (let channel = 0; channel < 3; channel++) {
    const old = raster.rgb[at + channel] ?? 0;
    raster.rgb[at + channel] = Math.round(old + ((color[channel] ?? 0) - old) * alpha);
  }
}

/** A pixel position: column and row from the top left. */
export type Pixel = readonly [number, number];

/** Paint a filled rectangle of `size` pixels with its top left corner at `corner`. */
export function fillRect(raster: Raster, corner: Pixel, size: Pixel, color: Rgb8): void {
  const [x, y] = corner;
  const [width, height] = size;
  for (let row = y; row < y + height; row++) {
    for (let column = x; column < x + width; column++) paint(raster, column, row, color, 1);
  }
}

/** Paint the line between two pixels, both ends included, one pixel wide. */
export function drawLine(raster: Raster, from: Pixel, to: Pixel, color: Rgb8): void {
  let [x, y] = from;
  const [x1, y1] = to;
  const dx = Math.abs(x1 - x);
  const dy = -Math.abs(y1 - y);
  const stepX = x < x1 ? 1 : -1;
  const stepY = y < y1 ? 1 : -1;
  let error = dx + dy;
  for (;;) {
    paint(raster, x, y, color, 1);
    if (x === x1 && y === y1) return;
    const twice = 2 * error;
    if (twice >= dy) {
      error += dy;
      x += stepX;
    }
    if (twice <= dx) {
      error += dx;
      y += stepY;
    }
  }
}

/** Paint the circle of `radius` pixels around `centre`, one pixel wide. */
export function drawCircle(raster: Raster, centre: Pixel, radius: number, color: Rgb8): void {
  const [cx, cy] = centre;
  const steps = Math.max(8, Math.ceil(2 * Math.PI * radius * 2));
  for (let step = 0; step < steps; step++) {
    const angle = (2 * Math.PI * step) / steps;
    const x = Math.round(cx + radius * Math.cos(angle));
    const y = Math.round(cy + radius * Math.sin(angle));
    paint(raster, x, y, color, 1);
  }
}

/** Copy `source` into `target` with its top left corner at (x, y). */
export function blit(target: Raster, source: Raster, x: number, y: number): void {
  for (let row = 0; row < source.height; row++) {
    const from = row * source.width * 3;
    const line = source.rgb.subarray(from, from + source.width * 3);
    target.rgb.set(line, ((y + row) * target.width + x) * 3);
  }
}
