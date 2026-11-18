import {
  hallFace,
  numberArithmetic,
  type SwatchFace,
  type SwatchWindow,
} from "@level-designer/finish-paint";
import type { Raster } from "../raster/index.js";
import { type Box, PIXELS_PER_METRE } from "../sheets/index.js";
import { nearScale } from "./faces.js";
import type { FinishSwatch, HallClass, HallSubject } from "./input.js";
import { paintOn, type RulerMark, swatchTile } from "./tile.js";

/** The normal that picks each class's face by the hall's frame rule: a side wall faces +X. */
const NORMALS: Readonly<Record<HallClass, readonly [number, number, number]>> = {
  outside: [1, 0, 0],
  top: [0, 1, 0],
  bottom: [0, -1, 0],
};

/** The window of a wall or a ceiling, in metres along its `x` and `y`. */
const WINDOW = [16, 8] as const;

/**
 * The most rows a hall tile draws before the sheet splits it along its height: a part with
 * the title row, its rulers, its caption and the gutters (72 px) stays within the reader's
 * long edge of 1,568 px, so the hall's floor of about 120 m splits in two.
 */
const PART_ROWS = 1496;

/** The metres between ruler numbers: every metre, or every 10 m at the plan's scale. */
const RULER_STEP = { near: 1, plan: 10 } as const;

/** The interior's face of a class, by `finish-paint`'s hall frame rule. */
function hallFaceOf(interior: Box, hallClass: HallClass): SwatchFace {
  const { min, max } = interior;
  const size = [max[0] - min[0], max[1] - min[1], max[2] - min[2]] as const;
  const box = { low: min, size };
  const face = hallFace(numberArithmetic, min, NORMALS[hallClass], box);
  const { low, faceClass, seed, wear } = face;
  return { low, size: face.size, faceClass, seed, wear };
}

/** Whether a class is painted in plan coordinates, drawn as the plan with -Z on top. */
function inPlan(hallClass: HallClass): boolean {
  return hallClass !== "outside";
}

/**
 * The windows a class draws: a wall or a ceiling as one window of 16 x 8 m from the face's
 * low corner, a floor whole, split along its height into the fewest equal parts of at most
 * 1,496 rows, from its low `y` (the back) on.
 */
function windowsOf(face: SwatchFace, hallClass: HallClass, scale: number): SwatchWindow[] {
  const [width, height] = face.size;
  if (hallClass !== "top") {
    return [{ low: face.low, size: [Math.min(WINDOW[0], width), Math.min(WINDOW[1], height)] }];
  }
  const parts = Math.ceil(Math.round(height / scale) / PART_ROWS);
  const part = height / parts;
  return Array.from({ length: parts }, (_, index) => ({
    low: [face.low[0], face.low[1] + index * part] as const,
    size: [width, part] as const,
  }));
}

/**
 * The marks of a ruler in level coordinates: every multiple of `step` from `low` over
 * `pixels` pixels of `scale`, each at its pixel counted from the low end, or from the high
 * end when `fromHigh`.
 */
function levelMarks(low: number, pixels: number, scale: number, fromHigh: boolean) {
  const step = scale >= 1 / PIXELS_PER_METRE ? RULER_STEP.plan : RULER_STEP.near;
  const marks: RulerMark[] = [];
  const high = low + pixels * scale;
  for (let value = Math.ceil(low / step - 1e-6) * step; value <= high + 1e-6; value += step) {
    const along = Math.round((fromHigh ? high - value : value - low) / scale);
    marks.push([value, Math.min(Math.max(along, 0), pixels - 1)]);
  }
  return marks;
}

/** One class's tiles: each window of its face, with rulers in level coordinates. */
function classTiles(swatch: FinishSwatch, interior: Box, hallClass: HallClass): Raster[] {
  const face = hallFaceOf(interior, hallClass);
  const scale = hallClass === "top" ? 1 / PIXELS_PER_METRE : nearScale(WINDOW);
  const lowestOnTop = inPlan(hallClass);
  return windowsOf(face, hallClass, scale).map((window) => {
    const painted = paintOn(swatch, face, window, scale);
    const under = levelMarks(window.low[0], painted.width, scale, false);
    const right = levelMarks(window.low[1], painted.height, scale, !lowestOnTop);
    return swatchTile(painted, hallClass, scale, { under, right, lowestOnTop });
  });
}

/** The tiles of a hall finish's page: one class after the other, in the subject's order. */
export function hallTiles(swatch: FinishSwatch, subject: HallSubject): Raster[] {
  return subject.classes.flatMap((hallClass) => classTiles(swatch, subject.interior, hallClass));
}
