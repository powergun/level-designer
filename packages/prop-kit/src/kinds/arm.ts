import { color, glow, range } from "../admit/index.js";
import type { ParamValues } from "../admit/index.js";
import { pitchPoint } from "../frame/index.js";
import type { BoxRole, PitchedRole, PlanePoint, Role, Span } from "../frame/index.js";
import {
  ARM_ACCENT_SHARE,
  ARM_ACCENT_WIDTH,
  ARM_HINGE_OFFSET,
  ARM_PEDESTAL_HEIGHT,
  ARM_PEDESTAL_LENGTH,
  ARM_SHARES,
  ARM_SHOULDER_HEIGHT,
  ARM_SHOULDER_LENGTH,
  ARM_WIDTH,
  ARM_WIDTHS,
} from "./arm-dimensions.js";
import { GLOW_DEPTH, PANEL } from "./dimensions.js";
import { PATHS } from "./finishes.js";
import { hollowBox } from "./hollow.js";
import { defineKind } from "./kind.js";
import type { Kind } from "./kind.js";

/** The robot arm's parameter table, in the format's order. */
const ARM_PARAMS = {
  reach: range(1.5, 3.5, 2.5),
  shoulder: range(30, 90, 55),
  elbow: range(60, 160, 100),
  color: color(true),
  baseColor: color(false),
  glow: glow(false),
};

/** A robot arm's admitted parameters. */
type Arm = ParamValues<typeof ARM_PARAMS>;

/** The thickness span of the shoulder and the links: between the pedestal's side planes. */
const LINK_X: Span = [-ARM_WIDTH / 2, ARM_WIDTH / 2];

/** A metal link of the arm's colour with its finish path, pitched `pitch` degrees, from `hinge`. */
function link(
  arm: Arm,
  hinge: PlanePoint,
  pitch: number,
  length: number,
  width: number,
  finish: string,
): PitchedRole {
  return {
    form: "pitched",
    x: LINK_X,
    hinge,
    length,
    width,
    pitch,
    material: "metal",
    color: arm.color,
    finish,
  };
}

/** The shoulder block on the pedestal's top, an upright slab facing `+X`. */
function shoulderBlock(arm: Arm): BoxRole {
  const half = ARM_SHOULDER_LENGTH / 2;
  return {
    form: "box",
    box: [LINK_X, [ARM_PEDESTAL_HEIGHT, ARM_PEDESTAL_HEIGHT + ARM_SHOULDER_HEIGHT], [-half, half]],
    facing: "+X",
    material: "metal",
    color: arm.color,
    finish: PATHS.shoulder,
  };
}

/**
 * The upper arm, the forearm and the head. The upper arm rises `shoulder` degrees from its hinge
 * on the shoulder top; the forearm bends down by the elbow and hinges on the inner edge of the
 * bend; the head continues the forearm from its end face, centred on it.
 */
function links(arm: Arm): readonly [PitchedRole, PitchedRole, PitchedRole] {
  const shoulderTop = ARM_PEDESTAL_HEIGHT + ARM_SHOULDER_HEIGHT;
  const upperLength = ARM_SHARES.upper * arm.reach;
  const upper = link(
    arm,
    [ARM_HINGE_OFFSET, shoulderTop],
    arm.shoulder,
    upperLength,
    ARM_WIDTHS.upper,
    PATHS.upperArm,
  );
  const bend = arm.shoulder + arm.elbow - 180;
  const elbow = pitchPoint(upper.hinge, arm.shoulder, upperLength, 0);
  const foreLength = ARM_SHARES.fore * arm.reach;
  const fore = link(arm, elbow, bend, foreLength, ARM_WIDTHS.fore, PATHS.forearm);
  const wrist = pitchPoint(elbow, bend, foreLength, (ARM_WIDTHS.fore - ARM_WIDTHS.head) / 2);
  const headLength = ARM_SHARES.head * arm.reach;
  const head = link(arm, wrist, bend, headLength, ARM_WIDTHS.head, PATHS.head);
  return [upper, fore, head];
}

/** The glow accent on the head's +X face: metal, `GLOW_DEPTH` thick, centred on the head. */
function accent(head: PitchedRole): PitchedRole {
  const along = (head.length * (1 - ARM_ACCENT_SHARE)) / 2;
  const across = (head.width - ARM_ACCENT_WIDTH) / 2;
  return {
    ...head,
    x: [head.x[1], head.x[1] + GLOW_DEPTH],
    hinge: pitchPoint(head.hinge, head.pitch, along, across),
    length: head.length * ARM_ACCENT_SHARE,
    width: ARM_ACCENT_WIDTH,
    finish: PATHS.band,
  };
}

/**
 * A robot arm: a hollow pedestal in `baseColor`, then shoulder, upper arm, forearm and head, four
 * thick slabs that face local +X between the pedestal's side planes; a glow adds an accent on the
 * head. 9 or 10 slabs.
 */
export const ROBOT_ARM: Kind = defineKind("robot-arm", ARM_PARAMS, (p) => {
  const pedestal = hollowBox(
    {
      width: ARM_WIDTH,
      length: ARM_PEDESTAL_LENGTH,
      height: ARM_PEDESTAL_HEIGHT,
      panel: PANEL,
      eave: 0,
      material: "metal",
      color: p.baseColor ?? p.color,
    },
    {
      top: PATHS.housingTop,
      plusX: PATHS.pedestal,
      minusX: PATHS.pedestal,
      ends: PATHS.pedestal,
    },
  );
  const [upper, fore, head] = links(p);
  const arm: Role[] = [...pedestal, shoulderBlock(p), upper, fore, head];
  return { roles: p.glow === undefined ? arm : [...arm, accent(head)], glow: p.glow };
});
