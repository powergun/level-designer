import { formatLength, LENGTH_SLACK } from "@level-designer/level-format";
import { color, range } from "../admit/index.js";
import type { ParamRefusal, ParamValues } from "../admit/index.js";
import { mirrorX, mirrorZ, moveBox } from "../frame/index.js";
import type { Box, BoxRole, Role } from "../frame/index.js";
import { LEAST_HANG, PANEL } from "./dimensions.js";
import { PATHS } from "./finishes.js";
import { hollowBox } from "./hollow.js";
import { defineKind } from "./kind.js";
import type { Kind } from "./kind.js";
import {
  BEAM_FLANGE_WIDTH,
  END_TRUCK_HEIGHT,
  END_TRUCK_LENGTH,
  END_TRUCK_WIDTH,
  GIRDER_SPACING,
  GIRDER_WEB_HEIGHT,
  HOOK_BLOCK,
  RUNWAY_WEB_HEIGHT,
  TROLLEY_HEIGHT,
  TROLLEY_WIDTH,
} from "./overhead-dimensions.js";

/** The bridge crane's parameter table, in the format's order. */
const BRIDGE_PARAMS = {
  span: range(10, 30),
  travel: range(10, 60),
  railHeight: range(6, 15.5),
  bridgeAt: range(0, 1, 0.5),
  trolleyAt: range(0, 1, 0.5),
  hookDrop: range(0.5, 8, 2),
  color: color(true),
  runwayColor: color(false),
};

/** A bridge crane's admitted parameters. */
type Bridge = ParamValues<typeof BRIDGE_PARAMS>;

/** The heights of the crane's layers above the floor, from the runway flanges up. */
interface Layers {
  readonly rail: number;
  readonly beamTop: number;
  readonly girderTop: number;
}

/** A metal box role. */
function metal(box: Box, facing: BoxRole["facing"], paint: string, finish: string): BoxRole {
  return { form: "box", box, facing, material: "metal", color: paint, finish };
}

/** The four runway roles: the +X beam's web and flange, then the -X beam's; webs face the centre line. */
function runway(p: Bridge, layers: Layers): BoxRole[] {
  const [x, halfT] = [p.span / 2, p.travel / 2];
  const paint = p.runwayColor ?? p.color;
  const web: Box = [
    [x - PANEL / 2, x + PANEL / 2],
    [layers.rail + PANEL, layers.beamTop],
    [-halfT, halfT],
  ];
  const halfF = BEAM_FLANGE_WIDTH / 2;
  const flange: Box = [
    [x - halfF, x + halfF],
    [layers.rail, layers.rail + PANEL],
    [-halfT, halfT],
  ];
  return [
    metal(web, "-X", paint, PATHS.runway),
    metal(flange, "down", paint, PATHS.flange),
    metal(mirrorX(web), "+X", paint, PATHS.runway),
    metal(mirrorX(flange), "down", paint, PATHS.flange),
  ];
}

/**
 * The end trucks and the two girders at `bridgeZ`: the trucks ride the runway webs and face the
 * centre line; each girder, web over flange, butts the trucks' inner faces, and its web faces
 * away from the other girder.
 */
function bridgeRoles(p: Bridge, layers: Layers, bridgeZ: number): BoxRole[] {
  const halfTruck = END_TRUCK_WIDTH / 2;
  const inner = p.span / 2 - halfTruck;
  const [zt, zg] = [END_TRUCK_LENGTH / 2, GIRDER_SPACING / 2];
  const truckY: readonly [number, number] = [layers.beamTop, layers.beamTop + END_TRUCK_HEIGHT];
  const truck: Box = [[inner, inner + END_TRUCK_WIDTH], truckY, [-zt, zt]];
  const web: Box = [
    [-inner, inner],
    [layers.beamTop + PANEL, layers.girderTop],
    [zg - PANEL / 2, zg + PANEL / 2],
  ];
  const halfF = BEAM_FLANGE_WIDTH / 2;
  const flange: Box = [
    [-inner, inner],
    [layers.beamTop, layers.beamTop + PANEL],
    [zg - halfF, zg + halfF],
  ];
  const at = (box: Box): Box => moveBox(box, [0, 0, bridgeZ]);
  return [
    metal(at(truck), "-X", p.color, PATHS.truck),
    metal(at(mirrorX(truck)), "+X", p.color, PATHS.truck),
    metal(at(web), "+Z", p.color, PATHS.girder),
    metal(at(flange), "down", p.color, PATHS.flange),
    metal(at(mirrorZ(web)), "-Z", p.color, PATHS.girder),
    metal(at(mirrorZ(flange)), "down", p.color, PATHS.flange),
  ];
}

/** The trolley on the girder webs at `trolleyX`, and the hook block hanging free under it. */
function trolleyRoles(p: Bridge, layers: Layers, trolleyX: number, bridgeZ: number): BoxRole[] {
  const housing = hollowBox(
    {
      width: TROLLEY_WIDTH,
      length: GIRDER_SPACING + PANEL,
      height: TROLLEY_HEIGHT,
      panel: PANEL,
      eave: 0,
      material: "metal",
      color: p.color,
    },
    { top: PATHS.housingTop, plusX: PATHS.hoist, minusX: PATHS.hoist, ends: PATHS.hoist },
  ).map((role) => ({ ...role, box: moveBox(role.box, [trolleyX, layers.girderTop, bridgeZ]) }));
  const hookBase = layers.rail - p.hookDrop;
  const [halfW, halfT] = [HOOK_BLOCK.width / 2, HOOK_BLOCK.thickness / 2];
  const hook: Box = [
    [trolleyX - halfW, trolleyX + halfW],
    [hookBase, hookBase + HOOK_BLOCK.height],
    [bridgeZ - halfT, bridgeZ + halfT],
  ];
  return [...housing, metal(hook, "+Z", p.color, PATHS.hook)];
}

/**
 * The bridge crane's one limit across parameters: the hook keeps its underside `LEAST_HANG`
 * above the floor. The limit is reached by arithmetic, so it compares with the length slack and
 * prints through `formatLength`.
 */
function hookLimit(p: Bridge): readonly ParamRefusal[] {
  const limit = p.railHeight - LEAST_HANG;
  if (p.hookDrop <= limit + LENGTH_SLACK) {
    return [];
  }
  const min = BRIDGE_PARAMS.hookDrop.min;
  const takes = `hookDrop ${min} to ${formatLength(limit)} at railHeight ${p.railHeight}`;
  return [{ name: "hookDrop", takes, got: p.hookDrop }];
}

/**
 * A bridge crane: two runway beams in `runwayColor`, two end trucks, two girders, a trolley and a
 * hook block that hangs `hookDrop` below the runway beams' undersides. 16 slabs before splitting.
 */
export const BRIDGE_CRANE: Kind = defineKind(
  "bridge-crane",
  BRIDGE_PARAMS,
  (p) => {
    const rail = p.railHeight;
    const beamTop = rail + PANEL + RUNWAY_WEB_HEIGHT;
    const layers: Layers = { rail, beamTop, girderTop: beamTop + PANEL + GIRDER_WEB_HEIGHT };
    const bridgeZ =
      -p.travel / 2 + END_TRUCK_LENGTH / 2 + p.bridgeAt * (p.travel - END_TRUCK_LENGTH);
    const inner = p.span / 2 - END_TRUCK_WIDTH / 2;
    const trolleyX = -inner + TROLLEY_WIDTH / 2 + p.trolleyAt * (2 * inner - TROLLEY_WIDTH);
    const roles: Role[] = [
      ...runway(p, layers),
      ...bridgeRoles(p, layers, bridgeZ),
      ...trolleyRoles(p, layers, trolleyX, bridgeZ),
    ];
    return { roles };
  },
  hookLimit,
);
