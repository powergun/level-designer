import { admitSlabs, roundSlab } from "@level-designer/level-format";
import type { Slab, Vec3 } from "@level-designer/level-format";
import { FACINGS, runAxis } from "./facing.js";
import type { Axis } from "./facing.js";
import { pitchedSlab } from "./pitch.js";
import type { Box, BoxRole, Role, Span } from "./role.js";

/**
 * The most runs a role is tried with before the kit reports a kind table that no run count
 * admits; a wrong table constant would otherwise loop for ever.
 */
const MAX_RUNS = 16;

/** The length of a span. */
function extent([min, max]: Span): number {
  return max - min;
}

/** The middle of a span. */
function middle([min, max]: Span): number {
  return (min + max) / 2;
}

/**
 * The slab that fills `box` with the role's facing, material and colour, in the prop frame:
 * its position is the base centre, the middle of the box with its height axis at the minimum.
 */
function frameSlab(box: Box, role: BoxRole): Slab {
  const facing = FACINGS[role.facing];
  const size: Vec3 = [
    extent(box[facing.width]),
    extent(box[facing.height]),
    extent(box[facing.thickness]),
  ];
  const base = (axis: Axis): number => (axis === facing.height ? box[axis][0] : middle(box[axis]));
  const position: Vec3 = [base(0), base(1), base(2)];
  return {
    size,
    material: role.material,
    color: role.color,
    position,
    rotation: facing.quaternion,
  };
}

/** The box cut into `n` equal runs along `axis`, in ascending order. */
function runBoxes(box: Box, axis: Axis, n: number): Box[] {
  const [start, end] = box[axis];
  const step = (end - start) / n;
  return Array.from({ length: n }, (_, k) => {
    const run: Span = [start + k * step, start + (k + 1) * step];
    const [x, y, z] = box;
    return [axis === 0 ? run : x, axis === 1 ? run : y, axis === 2 ? run : z];
  });
}

/** Whether the slab admission accepts this slab once it is rounded to the format's grid. */
function admitsRounded(slab: Slab): boolean {
  return admitSlabs([{ id: "run", slabs: [roundSlab(slab)] }]).length === 0;
}

/**
 * The role's slabs in the prop frame. A box role splits along its run axis into the fewest equal
 * runs that the slab admission accepts once rounded, listed in ascending order along the axis; a
 * pitched role stays one slab.
 */
export function splitRole(role: Role): Slab[] {
  if (role.form === "pitched") {
    return [pitchedSlab(role)];
  }
  const axis = runAxis(FACINGS[role.facing]);
  for (let n = 1; n <= MAX_RUNS; n += 1) {
    const slabs = runBoxes(role.box, axis, n).map((box) => frameSlab(box, role));
    if (slabs.every(admitsRounded)) {
      return slabs;
    }
  }
  throw new Error(`no run count up to ${MAX_RUNS} admits the role box ${JSON.stringify(role.box)}`);
}
