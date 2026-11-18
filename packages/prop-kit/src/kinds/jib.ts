import { color, range } from "../admit/index.js";
import type { ParamValues } from "../admit/index.js";
import { moveBox } from "../frame/index.js";
import type { BoxRole, PitchedRole, PlanePoint, Role } from "../frame/index.js";
import { PANEL } from "./dimensions.js";
import { PATHS } from "./finishes.js";
import { openBox } from "./hollow.js";
import { defineKind } from "./kind.js";
import type { Kind } from "./kind.js";
import {
  BEAM_FLANGE_WIDTH,
  JIB_BOOM_WEB_HEIGHT,
  JIB_HOIST,
  JIB_MAST_HEAD,
  JIB_MAST_SIDE,
  JIB_PLINTH_HEIGHT,
  JIB_PLINTH_SIDE,
  JIB_TIE,
} from "./overhead-dimensions.js";

/** The jib crane's parameter table, in the format's order. */
const JIB_PARAMS = {
  height: range(3, 8, 5),
  boom: range(2, 8, 4),
  color: color(true),
};

/** A jib crane's admitted parameters. */
type Jib = ParamValues<typeof JIB_PARAMS>;

/** The plinth, a block facing up, and the four mast panels on it, each facing away from the mast's axis. */
function base(p: Jib): BoxRole[] {
  const half = JIB_PLINTH_SIDE / 2;
  const plinth: BoxRole = {
    form: "box",
    box: [
      [-half, half],
      [0, JIB_PLINTH_HEIGHT],
      [-half, half],
    ],
    facing: "up",
    material: "metal",
    color: p.color,
    finish: PATHS.plinth,
  };
  const mastHeight = p.height + JIB_MAST_HEAD - JIB_PLINTH_HEIGHT;
  const mast = openBox(
    {
      width: JIB_MAST_SIDE,
      length: JIB_MAST_SIDE,
      height: mastHeight,
      panel: PANEL,
      eave: 0,
      material: "metal",
      color: p.color,
    },
    { plusX: PATHS.mastFront, minusX: PATHS.mast, ends: PATHS.mast },
  ).map((role) => ({ ...role, box: moveBox(role.box, [0, JIB_PLINTH_HEIGHT, 0]) }));
  return [plinth, ...mast];
}

/** The boom from the mast's +Z face to its tip: a web facing +X over a flange facing down. */
function boom(p: Jib): BoxRole[] {
  const z: readonly [number, number] = [JIB_MAST_SIDE / 2, p.boom];
  const halfF = BEAM_FLANGE_WIDTH / 2;
  const look = { form: "box", material: "metal", color: p.color } as const;
  return [
    {
      ...look,
      box: [[-PANEL / 2, PANEL / 2], [p.height + PANEL, p.height + PANEL + JIB_BOOM_WEB_HEIGHT], z],
      facing: "+X",
      finish: PATHS.boom,
    },
    {
      ...look,
      box: [[-halfF, halfF], [p.height, p.height + PANEL], z],
      facing: "down",
      finish: PATHS.flange,
    },
  ];
}

/**
 * The tie, pitched down from its anchor on the mast's +Z face to its foot on the web's top, on
 * the upper side of that line, so it touches each along one edge.
 */
function tie(p: Jib): PitchedRole {
  const face = JIB_MAST_SIDE / 2;
  const anchor: PlanePoint = [face, p.height + JIB_MAST_HEAD - JIB_TIE.drop];
  const foot: PlanePoint = [
    face + JIB_TIE.share * (p.boom - face),
    p.height + PANEL + JIB_BOOM_WEB_HEIGHT,
  ];
  const [dz, dy] = [foot[0] - anchor[0], foot[1] - anchor[1]];
  return {
    form: "pitched",
    x: [-PANEL / 2, PANEL / 2],
    hinge: anchor,
    length: Math.hypot(dz, dy),
    width: JIB_TIE.width,
    pitch: (Math.atan2(dy, dz) * 180) / Math.PI,
    material: "metal",
    color: p.color,
    finish: PATHS.tie,
  };
}

/** The hoist, hanging from the flange's underside near the boom's tip, facing +X. */
function hoist(p: Jib): BoxRole {
  const tip = p.boom - JIB_HOIST.setback;
  return {
    form: "box",
    box: [
      [-JIB_HOIST.width / 2, JIB_HOIST.width / 2],
      [p.height - JIB_HOIST.drop, p.height],
      [tip - JIB_HOIST.length, tip],
    ],
    facing: "+X",
    material: "metal",
    color: p.color,
    finish: PATHS.hoist,
  };
}

/**
 * A jib crane: a four-panel mast on a plinth, a boom as web and flange whose underside is
 * `height` above the floor, a tie from the mast down to the boom and a hoist under the boom's
 * tip. 9 slabs.
 */
export const JIB_CRANE: Kind = defineKind("jib-crane", JIB_PARAMS, (p) => {
  const roles: Role[] = [...base(p), ...boom(p), tie(p), hoist(p)];
  return { roles };
});
