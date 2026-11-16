import type { SlabMaterial } from "@level-designer/level-format";
import { mirrorX, mirrorZ } from "../frame/index.js";
import type { Box, Role } from "../frame/index.js";
import { GLOW_DEPTH } from "./dimensions.js";

/**
 * The shell of a hollow box kind: its plan outline `width` by `length`, its `height`, its
 * panel thickness, the eave by which the top overhangs each long side, and its material.
 */
export interface Shell {
  readonly width: number;
  readonly length: number;
  readonly height: number;
  readonly panel: number;
  readonly eave: number;
  readonly material: SlabMaterial;
}

/**
 * The shared layout of conveyor, enclosure, container and crate, in slab order: a top that
 * runs through over everything below it, the +X and -X sides that run the full length under
 * it, set in by the eave, and, with `ends`, the +Z and -Z ends that butt between the sides.
 */
export function hollowBox(shell: Shell, ends: boolean): Role[] {
  const { width, length, height, panel, eave, material } = shell;
  const [halfW, halfL] = [width / 2, length / 2];
  const sideOuter = halfW - eave;
  const sideInner = sideOuter - panel;
  const top: Box = [
    [-halfW, halfW],
    [height - panel, height],
    [-halfL, halfL],
  ];
  const side: Box = [
    [sideInner, sideOuter],
    [0, height - panel],
    [-halfL, halfL],
  ];
  const end: Box = [
    [-sideInner, sideInner],
    [0, height - panel],
    [halfL - panel, halfL],
  ];
  const roles: Role[] = [
    { box: top, facing: "up", material },
    { box: side, facing: "+X", material },
    { box: mirrorX(side), facing: "-X", material },
  ];
  return ends
    ? [
        ...roles,
        { box: end, facing: "+Z", material },
        { box: mirrorZ(end), facing: "-Z", material },
      ]
    : roles;
}

/**
 * The two glow slabs of a hollow box kind, +X then -X: metal, `GLOW_DEPTH` thick, over the
 * height `span` and the full length, each in the eave with its face in the plane x = +width/2
 * or -width/2, level with the top's edge, and its back on its side's outer face.
 */
export function glowPair(shell: Shell, span: readonly [number, number], glowName: string): Role[] {
  const halfW = shell.width / 2;
  const halfL = shell.length / 2;
  const box: Box = [[halfW - GLOW_DEPTH, halfW], span, [-halfL, halfL]];
  return [
    { box, facing: "+X", material: "metal", glow: glowName },
    { box: mirrorX(box), facing: "-X", material: "metal", glow: glowName },
  ];
}
