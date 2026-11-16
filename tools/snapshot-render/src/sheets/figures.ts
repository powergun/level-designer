import type { WorldTriangles } from "@level-designer/level-glb";
import type { Vec3 } from "../render/index.js";
import type { Box, SnapshotInput } from "./input.js";

/** The figure's width and depth, metres. */
const FIGURE_WIDTH = 0.5;
/** The player figure's linear colour. */
const PLAYER_FIGURE: Vec3 = [0, 0.58, 1];
/** A minion figure's linear colour. */
const MINION_FIGURE: Vec3 = [1, 0.19, 0];
/** The corner indices of a box's twelve triangles; corner bit 1 is +X, bit 2 +Y, bit 4 +Z. */
const BOX_TRIANGLES: readonly number[] = [
  0, 2, 3, 0, 3, 1, 4, 5, 7, 4, 7, 6, 0, 1, 5, 0, 5, 4, 2, 6, 7, 2, 7, 3, 0, 4, 6, 0, 6, 2, 1, 3, 7,
  1, 7, 5,
];

/** A figure with its box and colour. */
interface Figure {
  readonly box: Box;
  readonly color: Vec3;
}

/** The figure standing on a spawn: a box of the figure height above the feet. */
function figureAt(feet: Vec3, height: number, color: Vec3): Figure {
  const half = FIGURE_WIDTH / 2;
  return {
    box: {
      min: [feet[0] - half, feet[1], feet[2] - half],
      max: [feet[0] + half, feet[1] + height, feet[2] + half],
    },
    color,
  };
}

/** Whether a point lies inside a box. */
function contains(box: Box, point: Vec3): boolean {
  return [0, 1, 2].every((axis) => {
    const at = point[axis] ?? 0;
    return at >= (box.min[axis] ?? 0) && at <= (box.max[axis] ?? 0);
  });
}

/** The corner of a box selected by the bits of `corner`. */
function cornerOf(box: Box, corner: number): Vec3 {
  return [
    (corner & 1 ? box.max : box.min)[0],
    (corner & 2 ? box.max : box.min)[1],
    (corner & 4 ? box.max : box.min)[2],
  ];
}

/**
 * The triangles of the figures at every spawn, seen from `eye`. A figure that holds the eye is
 * left out, so a view from a spawn is not blocked by its own figure.
 */
export function figuresSeenFrom(input: SnapshotInput, eye: Vec3): WorldTriangles {
  const all = [
    figureAt(input.playerSpawn, input.figureHeight, PLAYER_FIGURE),
    ...input.minionSpawns.map((spawn) => figureAt(spawn, input.figureHeight, MINION_FIGURE)),
  ];
  const seen = all.filter((figure) => !contains(figure.box, eye));
  const triangles = BOX_TRIANGLES.length / 3;
  const positions = new Float64Array(seen.length * triangles * 9);
  const colors = new Float32Array(seen.length * triangles * 3);
  seen.forEach((figure, index) => {
    BOX_TRIANGLES.forEach((corner, at) => {
      positions.set(cornerOf(figure.box, corner), (index * BOX_TRIANGLES.length + at) * 3);
    });
    for (let t = 0; t < triangles; t++) colors.set(figure.color, (index * triangles + t) * 3);
  });
  return { positions, colors };
}
