import type { SlabMaterial } from "@level-designer/level-format";
import { mirrorX, mirrorZ } from "../frame/index.js";
import type { Box, BoxRole } from "../frame/index.js";
import { GLOW_DEPTH } from "./dimensions.js";

/**
 * The shell of a hollow box kind or part: its plan outline `width` by `length`, its `height`,
 * its panel thickness, the eave by which the top overhangs each long side, its material and
 * its colour.
 */
export interface Shell {
  readonly width: number;
  readonly length: number;
  readonly height: number;
  readonly panel: number;
  readonly eave: number;
  readonly material: SlabMaterial;
  readonly color: string;
}

/** The walls of a shell: its sides and its ends, each pair in slab order. */
interface Walls {
  readonly sides: readonly BoxRole[];
  readonly ends: readonly BoxRole[];
}

/**
 * The walls of a shell from the floor to `wallHeight`: the +X and -X sides that run the full
 * length, set in by the eave, and the +Z and -Z ends that butt between the sides.
 */
function walls(shell: Shell, wallHeight: number): Walls {
  const { width, length, panel, eave, material, color } = shell;
  const [halfW, halfL] = [width / 2, length / 2];
  const sideOuter = halfW - eave;
  const sideInner = sideOuter - panel;
  const side: Box = [
    [sideInner, sideOuter],
    [0, wallHeight],
    [-halfL, halfL],
  ];
  const end: Box = [
    [-sideInner, sideInner],
    [0, wallHeight],
    [halfL - panel, halfL],
  ];
  return {
    sides: [
      { form: "box", box: side, facing: "+X", material, color },
      { form: "box", box: mirrorX(side), facing: "-X", material, color },
    ],
    ends: [
      { form: "box", box: end, facing: "+Z", material, color },
      { form: "box", box: mirrorZ(end), facing: "-Z", material, color },
    ],
  };
}

/**
 * The shared layout of conveyor, enclosure, container, crate and the hollow parts, in slab
 * order: a top that runs through over everything below it, the +X and -X sides under it, set in
 * by the eave, and, with `ends`, the +Z and -Z ends that butt between the sides.
 */
export function hollowBox(shell: Shell, ends: boolean): BoxRole[] {
  const { width, length, height, panel, material, color } = shell;
  const top: Box = [
    [-width / 2, width / 2],
    [height - panel, height],
    [-length / 2, length / 2],
  ];
  const shellWalls = walls(shell, height - panel);
  return [
    { form: "box", box: top, facing: "up", material, color },
    ...shellWalls.sides,
    ...(ends ? shellWalls.ends : []),
  ];
}

/** The four walls of a shell over its full height with no top, as a mast's panels. */
export function openBox(shell: Shell): BoxRole[] {
  const shellWalls = walls(shell, shell.height);
  return [...shellWalls.sides, ...shellWalls.ends];
}

/**
 * The two glow slabs of a hollow box kind, +X then -X: metal, `GLOW_DEPTH` thick, over the
 * height `span` and the full length, each in the eave with its face in the plane x = +width/2
 * or -width/2, level with the top's edge, and its back on its side's outer face.
 */
export function glowPair(
  shell: Shell,
  span: readonly [number, number],
  glowName: string,
): BoxRole[] {
  const halfW = shell.width / 2;
  const halfL = shell.length / 2;
  const box: Box = [[halfW - GLOW_DEPTH, halfW], span, [-halfL, halfL]];
  const look = { material: "metal", color: shell.color, glow: glowName } as const;
  return [
    { form: "box", box, facing: "+X", ...look },
    { form: "box", box: mirrorX(box), facing: "-X", ...look },
  ];
}
