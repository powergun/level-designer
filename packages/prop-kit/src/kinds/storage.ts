import { color, material, range } from "../admit/index.js";
import { CONTAINER_HEIGHT, CONTAINER_WIDTH, PANEL } from "./dimensions.js";
import { hollowBox } from "./hollow.js";
import { defineKind } from "./kind.js";
import type { Kind } from "./kind.js";

/**
 * A container: a closed metal box of the format's fixed width and height, four sides under a
 * flat, flush roof with no eave. 5, 7 or 8 slabs.
 */
export const CONTAINER: Kind = defineKind(
  "container",
  { length: range(3, 12.2, 6.06), color: color(true) },
  (p) =>
    hollowBox(
      {
        width: CONTAINER_WIDTH,
        length: p.length,
        height: CONTAINER_HEIGHT,
        panel: PANEL,
        eave: 0,
        material: "metal",
        color: p.color,
      },
      true,
    ),
);

/** A crate: a wood cube of side `size`, four sides under a flush lid. 5 slabs. */
export const CRATE: Kind = defineKind(
  "crate",
  { size: range(0.6, 1.8, 1.2), color: color(true) },
  (p) =>
    hollowBox(
      {
        width: p.size,
        length: p.size,
        height: p.size,
        panel: PANEL,
        eave: 0,
        material: "wood",
        color: p.color,
      },
      true,
    ),
);

/**
 * A partition: one upright wall `thickness` thick, centred on the origin, its +Z face along
 * local +Z; it splits into two runs along X above 25 m2. 1 or 2 slabs.
 */
export const PARTITION: Kind = defineKind(
  "partition",
  {
    width: range(1, 8),
    height: range(1, 4),
    thickness: range(0.1, 0.6, 0.3),
    material: material(["wood", "brick", "concrete", "metal"], "concrete"),
    color: color(true),
  },
  (p) => [
    {
      form: "box",
      box: [
        [-p.width / 2, p.width / 2],
        [0, p.height],
        [-p.thickness / 2, p.thickness / 2],
      ],
      facing: "+Z",
      material: p.material,
      color: p.color,
    },
  ],
);
