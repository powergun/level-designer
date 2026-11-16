/**
 * clearance: the rules on plan distances between standing footprints, the static standing
 * obstacles of the prepared body world and the spawns: no pocket between 0.7 and 1.5 m that a
 * player can enter, 6 m around every spawn, and a main lane from each minion spawn to the
 * player spawn.
 */
export { footprints } from "./footprint.js";
export { gap } from "./gap.js";
export { namedSpawns, staticObstacles } from "./hall.js";
export { lane } from "./lane.js";
export { spawn } from "./spawn.js";
export type { NamedSpawn } from "./hall.js";
export type { Lane } from "./lane.js";
