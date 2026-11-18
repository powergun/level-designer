import { slabFrame, type SwatchFace } from "@level-designer/finish-paint";
import type { SlabSubject } from "./input.js";

/** A face of a page: the finish format's name of its face and the face the swatch draws. */
export interface NamedFace {
  readonly name: string;
  readonly face: SwatchFace;
}

/** A slab's six faces by their role on the page. */
export interface SlabFaces {
  readonly outside: NamedFace;
  readonly inside: NamedFace;
  readonly top: NamedFace;
  readonly bottom: NamedFace;
  readonly endHigh: NamedFace;
  readonly endLow: NamedFace;
}

/** The metres per pixel of the near view, and of the near view of a face longer than 8 m. */
const NEAR = { fine: 0.005, long: 0.02, longest: 8 } as const;

/** The metres per pixel of the far view, what survives 20 m. */
export const FAR_SCALE = 0.04;

/**
 * One face of a slab, picked by its outward normal and sized and classed by `finish-paint`'s
 * slab frame rule, with its low corner half the width below 0 and at 0 in `y`.
 */
function slabFace(
  subject: SlabSubject,
  name: string,
  normal: readonly [number, number, number],
): NamedFace {
  const frame = slabFrame(subject.size, [0, 0, 0], normal);
  const face: SwatchFace = {
    low: [-frame.width / 2, 0],
    size: [frame.width, frame.height],
    faceClass: frame.faceClass,
    seed: subject.seed,
    wear: subject.wear,
  };
  return { name, face };
}

/** A slab's six faces, each named as the finish format names it. */
export function slabFaces(subject: SlabSubject): SlabFaces {
  return {
    outside: slabFace(subject, "outside", [0, 0, 1]),
    inside: slabFace(subject, "inside", [0, 0, -1]),
    top: slabFace(subject, "top", [0, 1, 0]),
    bottom: slabFace(subject, "bottom", [0, -1, 0]),
    endHigh: slabFace(subject, "end+", [1, 0, 0]),
    endLow: slabFace(subject, "end-", [-1, 0, 0]),
  };
}

/** The near scale of a size in metres: 5 mm per pixel, or 20 mm when it is longer than 8 m. */
export function nearScale(size: readonly [number, number]): number {
  return Math.max(...size) > NEAR.longest ? NEAR.long : NEAR.fine;
}
