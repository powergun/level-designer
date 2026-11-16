import { itemPath, LENGTH_SLACK } from "../shape/index.js";
import type { FormatProblem } from "../shape/index.js";
import { formatLength } from "../slab/index.js";
import type { Slab } from "../slab/index.js";
import type { LevelProp } from "./level.js";

/** The most slabs a level holds, from destruction lib's measured costs. */
const MAX_SLABS = 1024;

/** The shortest and the longest side of a slab, in metres. */
const MIN_SIDE = 0.02;
const MAX_SIDE = 40;

/** The largest face of a slab, width by height, in square metres. */
const MAX_FACE = 25;

/** The limit text of the side range. */
const SIDE_LIMIT = `the side range ${MIN_SIDE} to ${MAX_SIDE} m`;

/** The slack of the face cap, 0.00005 m2, so a face typed at its limit passes. */
const FACE_SLACK = 0.00005;

/** The limit text of the face cap. */
const FACE_LIMIT = `the face cap of ${MAX_FACE} m2`;

/** Whether a side length lies in the side range, with the length slack. */
function inSideRange(side: number): boolean {
  return side >= MIN_SIDE - LENGTH_SLACK && side <= MAX_SIDE + LENGTH_SLACK;
}

/** The limits that slab `k` of the prop at `path` breaks, one problem per limit. */
function slabProblems(slab: Slab, path: string, k: number): FormatProblem[] {
  const [width, height] = slab.size;
  const shownSize = slab.size.map(formatLength).join(" x ");
  const broken = [
    ...(slab.size.every(inSideRange) ? [] : [SIDE_LIMIT]),
    ...(width * height <= MAX_FACE + FACE_SLACK ? [] : [FACE_LIMIT]),
  ];
  return broken.map((limit) => ({
    rule: "slab",
    path,
    message: `${path} slab ${k}: ${shownSize} m breaks ${limit}`,
  }));
}

/**
 * The one slab admission: the level's slab count cap and every slab's size caps, which
 * follow destruction lib's measured costs. The decoder and the build both call it; the
 * path of prop `i` is `props[i]`, and slab `k` counts from 0 in slab order.
 */
export function admitSlabs(props: readonly LevelProp[]): FormatProblem[] {
  const count = props.reduce((sum, prop) => sum + prop.slabs.length, 0);
  const shownCount = count.toLocaleString("en-US");
  const shownMax = MAX_SLABS.toLocaleString("en-US");
  const capProblems: FormatProblem[] =
    count > MAX_SLABS
      ? [
          {
            rule: "slab",
            path: "props",
            message: `the level has ${shownCount} slabs; the format admits ${shownMax}`,
          },
        ]
      : [];
  const sizeProblems = props.flatMap((prop, i) =>
    prop.slabs.flatMap((slab, k) => slabProblems(slab, itemPath("props", i), k)),
  );
  return [...capProblems, ...sizeProblems];
}
