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

/** The finish paths of a shell's walls: the +X side, the -X side and, where it has them, both ends. */
export interface WallFinishes {
  readonly plusX: string;
  readonly minusX: string;
  readonly ends?: string;
}

/** The finish paths of a hollow box: its top and its walls. */
export interface BoxFinishes extends WallFinishes {
  readonly top: string;
}

/**
 * The walls of a shell from the floor to `wallHeight`, in slab order: the +X and -X sides that
 * run the full length, set in by the eave, then, where `finishes` names ends, the +Z and -Z ends
 * that butt between the sides.
 */
function walls(shell: Shell, wallHeight: number, finishes: WallFinishes): BoxRole[] {
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
  const look = { form: "box", material, color } as const;
  const sides: BoxRole[] = [
    { ...look, box: side, facing: "+X", finish: finishes.plusX },
    { ...look, box: mirrorX(side), facing: "-X", finish: finishes.minusX },
  ];
  const ends = finishes.ends;
  if (ends === undefined) {
    return sides;
  }
  return [
    ...sides,
    { ...look, box: end, facing: "+Z", finish: ends },
    { ...look, box: mirrorZ(end), facing: "-Z", finish: ends },
  ];
}

/**
 * The shared layout of conveyor, enclosure, container, crate and the hollow parts, in slab
 * order: a top that runs through over everything below it, the +X and -X sides under it, set in
 * by the eave, and, where `finishes` names ends, the +Z and -Z ends that butt between the sides.
 */
export function hollowBox(shell: Shell, finishes: BoxFinishes): BoxRole[] {
  const { width, length, height, panel, material, color } = shell;
  const top: Box = [
    [-width / 2, width / 2],
    [height - panel, height],
    [-length / 2, length / 2],
  ];
  return [
    { form: "box", box: top, facing: "up", material, color, finish: finishes.top },
    ...walls(shell, height - panel, finishes),
  ];
}

/** The four walls of a shell over its full height with no top, as a mast's panels. */
export function openBox(shell: Shell, finishes: Required<WallFinishes>): BoxRole[] {
  return walls(shell, shell.height, finishes);
}

/**
 * The two glow slabs of a hollow box kind, +X then -X: metal, `GLOW_DEPTH` thick, over the
 * height `span` and the full length, each in the eave with its face in the plane x = +width/2
 * or -width/2, level with the top's edge, and its back on its side's outer face.
 */
export function glowPair(shell: Shell, span: readonly [number, number], finish: string): BoxRole[] {
  const halfW = shell.width / 2;
  const halfL = shell.length / 2;
  const box: Box = [[halfW - GLOW_DEPTH, halfW], span, [-halfL, halfL]];
  const look = { form: "box", material: "metal", color: shell.color, finish } as const;
  return [
    { ...look, box, facing: "+X" },
    { ...look, box: mirrorX(box), facing: "-X" },
  ];
}
