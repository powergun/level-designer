import type { SnapshotInput } from "@level-designer/snapshot-render";

/**
 * The input of the test scenes: an interior from -8.8 to 6.3 in x, -5 to 5 in z and 8 m high,
 * so its centre plane is x = -1.25 and the orthographic tiles span x from -11 to 9 (400 px),
 * z from -7 to 7 (280 px) and y from -2 to 10 (240 px). Two floors stand at 0 and 0.3 m. The
 * player spawn stands at (-4, 0, -4), one minion spawn on the second floor
 * at (5, 0.3, 4), and two props sit at
 * (-4, 0, 4) and (4, 0, 6).
 */
export const INPUT: SnapshotInput = {
  interior: { min: [-8.8, 0, -5], max: [6.3, 8, 5] },
  floors: [0, 0.3],
  clearances: [2.17, 3],
  playerSpawn: [-4, 0, -4],
  minionSpawns: [[5, 0.3, 4]],
  props: [
    [-4, 0, 4],
    [4, 0, 6],
  ],
  lens: { fovDeg: 90, near: 0.05, far: 160 },
  eyeHeight: 1.72,
  figureHeight: 1.87,
};
