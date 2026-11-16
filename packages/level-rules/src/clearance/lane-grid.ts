import { LENGTH_SLACK } from "@level-designer/level-format";
import type { PreparedLevel } from "@level-designer/sec111-gateway";
import { bounds, overlapsRect } from "../plan/index.js";
import type { PlanPoint, PlanRect, Polygon } from "../plan/index.js";

/** The side of a lane cell, 0.1 m. */
export const CELL = 0.1;

/**
 * The plan grid of the lane rule: 0.1 m cells from the interior's lowest x and z, row by row
 * along z, each marked blocked or free.
 */
export interface LaneGrid {
  readonly x0: number;
  readonly z0: number;
  readonly nx: number;
  readonly nz: number;
  readonly blocked: Uint8Array;
}

/** The cell range `[first, last]` along one axis that a span overlaps by more than the slack. */
function span(low: number, high: number, origin: number, cells: number): readonly [number, number] {
  const first = Math.max(0, Math.floor((low + LENGTH_SLACK - origin) / CELL));
  const last = Math.min(cells - 1, Math.ceil((high - LENGTH_SLACK - origin) / CELL) - 1);
  return [first, last];
}

/** The cell rectangle of cell (i, k), shrunk by the slack on every side. */
function shrunkCell(grid: LaneGrid, i: number, k: number): PlanRect {
  const minX = grid.x0 + i * CELL;
  const minZ = grid.z0 + k * CELL;
  return {
    minX: minX + LENGTH_SLACK,
    minZ: minZ + LENGTH_SLACK,
    maxX: minX + CELL - LENGTH_SLACK,
    maxZ: minZ + CELL - LENGTH_SLACK,
  };
}

/** Marks every cell of the rectangle's range for which `hits` holds. */
function mark(grid: LaneGrid, rect: PlanRect, hits: (i: number, k: number) => boolean): void {
  const [i0, i1] = span(rect.minX, rect.maxX, grid.x0, grid.nx);
  const [k0, k1] = span(rect.minZ, rect.maxZ, grid.z0, grid.nz);
  for (let k = k0; k <= k1; k++) {
    for (let i = i0; i <= i1; i++) {
      if (hits(i, k)) {
        grid.blocked[k * grid.nx + i] = 1;
      }
    }
  }
}

/**
 * The grid of the static scene: a cell is blocked when it reaches outside the interior, or when
 * a static standing obstacle overlaps it by more than the slack.
 */
export function staticGrid(prepared: PreparedLevel, obstacles: readonly PlanRect[]): LaneGrid {
  const { min, max } = prepared.metrics.interior;
  const nx = Math.ceil((max[0] - min[0] - LENGTH_SLACK) / CELL);
  const nz = Math.ceil((max[2] - min[2] - LENGTH_SLACK) / CELL);
  const grid: LaneGrid = { x0: min[0], z0: min[2], nx, nz, blocked: new Uint8Array(nx * nz) };
  for (let k = 0; k < nz; k++) {
    for (let i = 0; i < nx; i++) {
      const outside = min[0] + (i + 1) * CELL > max[0] + LENGTH_SLACK;
      if (outside || min[2] + (k + 1) * CELL > max[2] + LENGTH_SLACK) {
        grid.blocked[k * nx + i] = 1;
      }
    }
  }
  for (const rect of obstacles) {
    mark(grid, rect, () => true);
  }
  return grid;
}

/** A copy of the grid with every cell blocked that a plan outline overlaps by more than the slack. */
export function withOutlines(grid: LaneGrid, outlines: readonly Polygon[]): LaneGrid {
  const copy: LaneGrid = { ...grid, blocked: grid.blocked.slice() };
  for (const polygon of outlines) {
    mark(copy, bounds(polygon), (i, k) => overlapsRect(polygon, shrunkCell(copy, i, k)));
  }
  return copy;
}

/** The index of the cell that holds a plan point, clamped to the grid. */
export function cellOf(grid: LaneGrid, at: PlanPoint): number {
  const i = Math.min(grid.nx - 1, Math.max(0, Math.floor((at[0] - grid.x0) / CELL)));
  const k = Math.min(grid.nz - 1, Math.max(0, Math.floor((at[1] - grid.z0) / CELL)));
  return k * grid.nx + i;
}

/** The plan centre of a cell. */
export function cellCentre(grid: LaneGrid, cell: number): PlanPoint {
  const i = cell % grid.nx;
  const k = (cell - i) / grid.nx;
  return [grid.x0 + (i + 0.5) * CELL, grid.z0 + (k + 0.5) * CELL];
}
