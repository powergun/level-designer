/** A face's class: 0 outside, 1 inside, 2 top, 3 bottom, 4 the high end, 5 the low end. */
export type FaceClass = 0 | 1 | 2 | 3 | 4 | 5;

/** The face classes by name, as the finish format numbers them. */
export const faceClass: {
  readonly outside: 0;
  readonly inside: 1;
  readonly top: 2;
  readonly bottom: 3;
  readonly endHigh: 4;
  readonly endLow: 5;
} = { outside: 0, inside: 1, top: 2, bottom: 3, endHigh: 4, endLow: 5 };

/** The frame of a point on a slab's face: pattern coordinates and face size in metres. */
export interface SlabFace {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly faceClass: FaceClass;
}

/** Three numbers along the slab's X, Y and Z. */
type Triple = readonly [number, number, number];

/**
 * The finish format's slab frame rule. `size` is width, height and thickness; `position`
 * and `normal` are slab-local, and the normal's dominant axis picks the face.
 */
export function slabFrame(size: Triple, position: Triple, normal: Triple): SlabFace {
  const [width, height, thickness] = size;
  const [x, y, z] = position;
  const [nx, ny, nz] = normal;
  const alongX = Math.abs(nx);
  const alongY = Math.abs(ny);
  const alongZ = Math.abs(nz);
  if (alongZ >= alongX && alongZ >= alongY) {
    const side = nz > 0 ? faceClass.outside : faceClass.inside;
    return { x, y, width, height, faceClass: side };
  }
  if (alongY >= alongX) {
    const side = ny > 0 ? faceClass.top : faceClass.bottom;
    return { x, y: z + thickness / 2, width, height: thickness, faceClass: side };
  }
  const side = nx > 0 ? faceClass.endHigh : faceClass.endLow;
  return { x: z, y, width: thickness, height, faceClass: side };
}
