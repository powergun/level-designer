import { choice, color, finishPath, flag, material, range } from "../admit/index.js";
import type { BoxRole } from "../frame/index.js";
import { CONTAINER_HEIGHT, CONTAINER_WIDTH, PANEL } from "./dimensions.js";
import { PARTITION_PATHS, PATHS } from "./finishes.js";
import { hollowBox } from "./hollow.js";
import { defineKind } from "./kind.js";
import type { Kind } from "./kind.js";

/** Which end of a container is its door, by the end's facing, or neither. */
const DOOR_FACINGS = { "+z": "+Z", "-z": "-Z", none: undefined } as const;

/** The container's door end takes the door path; every other role keeps its own. */
function withDoor(roles: readonly BoxRole[], door: keyof typeof DOOR_FACINGS): BoxRole[] {
  const facing = DOOR_FACINGS[door];
  return roles.map((role) =>
    role.facing === facing ? { ...role, finish: PATHS.containerDoor } : role,
  );
}

/**
 * A container: a closed metal box of the format's fixed width and height, four sides under a
 * flat, flush roof with no eave; `door` names the end that is its door, or none. 5, 7 or 8
 * slabs.
 */
export const CONTAINER: Kind = defineKind(
  "container",
  {
    length: range(3, 12.2, 6.06),
    color: color(true),
    door: choice(["+z", "-z", "none"], "none"),
  },
  (p) => ({
    roles: withDoor(
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
        {
          top: PATHS.containerRoof,
          plusX: PATHS.containerSide,
          minusX: PATHS.containerSide,
          ends: PATHS.containerEnd,
        },
      ),
      p.door,
    ),
  }),
);

/**
 * A crate: a wood cube of side `size`, four sides under a flush lid; its +X and -X sides carry
 * the stencil unless `stencil` is false. 5 slabs.
 */
export const CRATE: Kind = defineKind(
  "crate",
  { size: range(0.6, 1.8, 1.2), color: color(true), stencil: flag(true) },
  (p) => ({
    roles: hollowBox(
      {
        width: p.size,
        length: p.size,
        height: p.size,
        panel: PANEL,
        eave: 0,
        material: "wood",
        color: p.color,
      },
      {
        top: PATHS.lid,
        plusX: p.stencil ? PATHS.crateStencil : PATHS.crate,
        minusX: p.stencil ? PATHS.crateStencil : PATHS.crate,
        ends: PATHS.crate,
      },
    ),
  }),
);

/**
 * A partition: one upright wall `thickness` thick, centred on the origin, its +Z face along
 * local +Z, its finish path `finish` or, omitted, the path of its material; it splits into two runs along X above 25 m2. 1 or
 * 2 slabs.
 */
export const PARTITION: Kind = defineKind(
  "partition",
  {
    width: range(1, 8),
    height: range(1, 4),
    thickness: range(0.1, 0.6, 0.3),
    material: material(["wood", "brick", "concrete", "metal"], "concrete"),
    color: color(true),
    finish: finishPath(PARTITION_PATHS),
  },
  (p) => ({
    roles: [
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
        finish: p.finish ?? PARTITION_PATHS[p.material],
      },
    ],
  }),
);
